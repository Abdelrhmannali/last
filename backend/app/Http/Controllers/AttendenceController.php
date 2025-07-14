<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Requests\DestroyAttendanceRequest;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;

use App\Models\Attendence;
use App\Models\Employee;
use App\Models\Holiday;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AttendenceController extends Controller
{
    // List attendances with optional filters
    public function index(Request $request)
    {
        $query = Attendence::with(['employee.department']);

        // Filter by employee full name
        if ($request->filled('employee_name')) {
            $fullName = $request->employee_name;
            $query->whereHas('employee', function ($q) use ($fullName) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%$fullName%"]);
            });
        }

        // Filter by department name
        if ($request->filled('department_name')) {
            $query->whereHas('employee.department', function ($q) use ($request) {
                $q->where('dept_name', 'like', '%' . $request->department_name . '%');
            });
        }

        // Filter by specific date
        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        // Paginate and transform results
        $attendances = $query->orderBy('date', 'desc')->paginate(10);

        $transformed = $attendances->getCollection()->map(function ($attendance) {
            return [
                'id' => $attendance->id,
                'date' => $attendance->date->toDateString(),
                'checkInTime' => $attendance->checkInTime,
                'checkOutTime' => $attendance->checkOutTime,
                'lateDurationInHours' => round((float) $attendance->lateDurationInHours, 2),
                'overtimeDurationInHours' => round((float) $attendance->overtimeDurationInHours, 2),
                'status' => $attendance->status,
                'employee' => $attendance->employee ? [
                    'id' => $attendance->employee->id,
                    'first_name' => $attendance->employee->first_name,
                    'last_name' => $attendance->employee->last_name,
                    'full_name' => $attendance->employee->first_name . ' ' . $attendance->employee->last_name,
                    'email' => $attendance->employee->email,
                    'department' => $attendance->employee->department ? [
                        'id' => $attendance->employee->department->id,
                        'dept_name' => $attendance->employee->department->dept_name,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json([
            'data' => $transformed,
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
            'total' => $attendances->total(),
        ]);
    }

    // Store new attendance record
    public function store(StoreAttendanceRequest $request)
    {
        $employee = Employee::with('generalSetting')->find($request->employee_id);
        $date = Carbon::parse($request->date)->format('Y-m-d');

        if (!$employee->generalSetting) {
            Log::warning("No general settings found for employee {$employee->id}");
            return response()->json(['error' => 'Employee settings not found'], 422);
        }

        // Check if attendance already exists
        $attendanceExists = Attendence::where('employee_id', $request->employee_id)
            ->whereDate('date', $date)
            ->exists();

        if ($attendanceExists) {
            return response()->json(['error' => 'Attendance already recorded for this date'], 422);
        }

        // Check weekend
        $weekendDays = $employee->generalSetting->weekend_days ?? ['Saturday', 'Sunday'];
        if (!is_array($weekendDays)) {
            Log::warning("Unexpected type for weekend_days for employee {$employee->id}", ['value' => $weekendDays]);
            $weekendDays = ['Saturday', 'Sunday'];
        }

        if (in_array(Carbon::parse($date)->englishDayOfWeek, $weekendDays)) {
            return response()->json(['error' => 'Cannot record attendance on a weekend'], 422);
        }

        // Check holiday
        $holidayExists = Holiday::whereDate('date', $date)->exists();
        if ($holidayExists) {
            return response()->json(['error' => 'Cannot record attendance on an official holiday'], 422);
        }

        // Create attendance record
        $attendance = Attendence::create([
            'employee_id' => $request->employee_id,
            'date' => $date,
            'checkInTime' => $request->checkInTime,
            'checkOutTime' => $request->checkOutTime,
            'lateDurationInHours' => $this->calculateLate($employee, $request->checkInTime),
            'overtimeDurationInHours' => $this->calculateOvertime($employee, $request->checkOutTime),
            'status' => 'Present',
        ]);

        // Override status if set
        if ($employee->generalSetting->status) {
            $attendance->status = $employee->generalSetting->status;
            $attendance->save();
        }

        // Trigger payroll recalculation
        try {
            $payrollController = new PayrollController();
            $month = Carbon::parse($date)->format('Y-m');
            $recalculateRequest = new Request([
                'employee_id' => $request->employee_id,
                'month' => $month,
            ]);
            $payrollController->recalculate($recalculateRequest);
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll after attendance creation for employee_id: {$request->employee_id}, month: {$month}. Exception: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Attendance recorded successfully',
            'attendance' => [
                'id' => $attendance->id,
                'date' => $attendance->date->toDateString(),
                'checkInTime' => $attendance->checkInTime,
                'checkOutTime' => $attendance->checkOutTime,
                'lateDurationInHours' => round((float) $attendance->lateDurationInHours, 2),
                'overtimeDurationInHours' => round((float) $attendance->overtimeDurationInHours, 2),
                'status' => $attendance->status,
                'employee_id' => $attendance->employee_id,
            ]
        ]);
    }

    // Update existing attendance times
    public function update(Request $request, $id)
    {
        $attendance = Attendence::find($id);
        if (!$attendance) {
            return response()->json(['error' => 'No attendance record found'], 404);
        }

        // Update check-in and check-out times
        $attendance->update([
            'checkInTime' => $request->checkInTime,
            'checkOutTime' => $request->checkOutTime,
        ]);

        return response()->json(['message' => 'Attendance record updated successfully', 'attendance' => $attendance]);
    }

    // Delete attendance record and update payroll
    public function destroy(Request $request, $employee_id)
    {
        $dateString = $request->query('date');
        if (!$dateString) {
            return response()->json(['error' => 'Date is required'], 400);
        }

        try {
            $date = Carbon::parse($dateString);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid date format'], 400);
        }

        $employee = Employee::findOrFail($employee_id);

        $attendance = Attendence::where('employee_id', $employee_id)
            ->whereDate('date', $date->format('Y-m-d'))
            ->first();

        if (!$attendance) {
            return response()->json(['error' => 'No attendance record found for this employee and date'], 404);
        }

        $month = $date->format('Y-m');
        $attendance->forceDelete();

        // Recalculate payroll
        try {
            $payrollController = new PayrollController();
            $recalculateRequest = new Request([
                'employee_id' => $employee_id,
                'month' => $month,
            ]);
            $payrollController->recalculate($recalculateRequest);
        } catch (\Exception $e) {
            Log::error("Payroll recalculation failed: " . $e->getMessage());
        }

        return response()->json(['message' => 'Attendance record deleted successfully']);
    }

    // Record check-in for today only
    public function checkIn(CheckInRequest $request)
    {
        $date = Carbon::parse($request->date);
        $employee = Employee::with('generalSetting')->findOrFail($request->employee_id);

        if (!$employee->generalSetting) {
            return response()->json(['error' => ' Employee settings not found'], 422);
        }

        if ($date->isFuture()) {
            return response()->json(['error' => ' Cannot check-in for a future date'], 422);
        }

        if ($date->isPast() && !$date->isToday()) {
            return response()->json(['error' => ' Cannot check-in for a past date'], 422);
        }

        $weekendDays = $employee->generalSetting->weekend_days ?? ['Saturday', 'Sunday'];
        if (!is_array($weekendDays)) {
            Log::warning("Unexpected type for weekend_days for employee {$employee->id}", ['value' => $weekendDays]);
            $weekendDays = ['Saturday', 'Sunday'];
        }

        if (in_array($date->englishDayOfWeek, $weekendDays)) {
            return response()->json(['error' => 'Cannot check-in on a weekend day'], 422);
        }

        if (Holiday::whereDate('date', $date)->exists()) {
            return response()->json(['error' => 'Cannot check-in on an official holiday'], 422);
        }

        $attendanceExists = Attendence::where('employee_id', $request->employee_id)
            ->whereDate('date', $date)
            ->exists();

        if ($attendanceExists) {
            return response()->json(['error' => ' Attendance already recorded for this date'], 422);
        }

        $attendance = Attendence::create([
            'employee_id' => $request->employee_id,
            'date' => $date,
            'checkInTime' => $request->checkInTime,
            'status' => 'Present',
            'lateDurationInHours' => $this->calculateLate($employee, $request->checkInTime),
        ]);

        try {
            $payrollController = new PayrollController();
            $month = $date->format('Y-m');
            $recalculateRequest = new Request([
                'employee_id' => $request->employee_id,
                'month' => $month,
            ]);
            $payrollController->recalculate($recalculateRequest);
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll after check-in: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Check-in recorded successfully',
            'attendance' => $attendance
        ]);
    }

    // Record check-out
    public function checkOut(CheckOutRequest $request)
    {
        $date = Carbon::parse($request->date);
        $employee = Employee::with('generalSetting')->findOrFail($request->employee_id);

        if (!$employee->generalSetting) {
            return response()->json(['error' => ' Employee settings not found'], 422);
        }

        if ($date->isFuture()) {
            return response()->json(['error' => ' Cannot check-out for a future date'], 422);
        }

        if ($date->isPast() && !$date->isToday()) {
            return response()->json(['error' => ' Cannot check-out for a past date'], 422);
        }

        $weekendDays = $employee->generalSetting->weekend_days ?? ['Saturday', 'Sunday'];
        if (!is_array($weekendDays)) {
            Log::warning("Unexpected type for weekend_days for employee {$employee->id}", ['value' => $weekendDays]);
            $weekendDays = ['Saturday', 'Sunday'];
        }

        if (in_array($date->englishDayOfWeek, $weekendDays)) {
            return response()->json(['error' => ' Cannot check-out on a weekend day'], 422);
        }

        if (Holiday::whereDate('date', $date)->exists()) {
            return response()->json(['error' => 'Cannot check-out on an official holiday'], 422);
        }

        $attendance = Attendence::where('employee_id', $request->employee_id)
            ->whereDate('date', $date)
            ->first();

        if (!$attendance) {
            return response()->json(['error' => ' No check-in record found for this date'], 404);
        }

        if ($attendance->checkOutTime) {
            return response()->json(['error' => ' Check-out already recorded for this day'], 422);
        }

        $actualCheckout = Carbon::parse($request->checkOutTime);
        $defaultCheckout = Carbon::parse($employee->default_check_out_time);

        if ($actualCheckout->gt($defaultCheckout->copy()->addHours(5))) {
            return response()->json(['error' => 'Cannot check-out after the allowed time limit'], 422);
        }

        $attendance->checkOutTime = $request->checkOutTime;

        if ($attendance->checkInTime) {
            $attendance->lateDurationInHours = $this->calculateLate($employee, $attendance->checkInTime);
        }

        $attendance->overtimeDurationInHours = $this->calculateOvertime($employee, $request->checkOutTime);
        $attendance->save();

        try {
            $payrollController = new PayrollController();
            $month = $date->format('Y-m');
            $recalculateRequest = new Request([
                'employee_id' => $request->employee_id,
                'month' => $month,
            ]);
            $payrollController->recalculate($recalculateRequest);
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll after check-out: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Check-out recorded successfully',
            'attendance' => $attendance
        ]);
    }

    // Calculate late hours
    private function calculateLate($employee, $checkInTime)
    {
        $defaultTime = Carbon::parse($employee->default_check_in_time);
        $actualTime = Carbon::parse($checkInTime);
        $lateMinutes = $defaultTime->diffInMinutes($actualTime, false);
        return max($lateMinutes, 0) / 60;
    }

    // Calculate overtime hours
    private function calculateOvertime($employee, $checkOutTime)
    {
        $defaultTime = Carbon::parse($employee->default_check_out_time);
        $actualTime = Carbon::parse($checkOutTime);
        if ($actualTime->lessThanOrEqualTo($defaultTime)) {
            return 0;
        }
        return $defaultTime->diffInMinutes($actualTime) / 60;
    }

    // Mark absent employees who didn't check in
    public function markAbsentees()
    {
        $today = now()->toDateString();
        $employees = Employee::all();

        foreach ($employees as $employee) {
            $alreadyMarked = Attendence::where('employee_id', $employee->id)
                ->whereDate('date', $today)
                ->exists();

            if (!$alreadyMarked) {
                Attendence::create([
                    'employee_id' => $employee->id,
                    'date' => $today,
                    'status' => 'Absent',
                    'checkInTime' => null,
                    'checkOutTime' => null,
                    'lateDurationInHours' => 0,
                    'overtimeDurationInHours' => 0,
                ]);
            }
        }

        return response()->json(['message' => 'Absentees marked successfully']);
    }
}
