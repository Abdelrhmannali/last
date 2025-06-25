<?php

namespace App\Http\Controllers;

use App\Models\Attendence;
use App\Models\Employee;
use App\Models\Holiday;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AttendenceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendence::with(['employee.department']);

        if ($request->filled('employee_name')) {
            $fullName = $request->employee_name;
            $query->whereHas('employee', function ($q) use ($fullName) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%$fullName%"]);
            });
        }

        if ($request->filled('department_name')) {
            $query->whereHas('employee.department', function ($q) use ($request) {
                $q->where('dept_name', 'like', '%' . $request->department_name . '%');
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

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
                'employee' => [
                    'id' => $attendance->employee->id,
                    'full_name' => $attendance->employee->full_name,
                    'profile_picture_url' => $attendance->employee->profile_image_url,
                    'email' => $attendance->employee->email,
                    'dept_name' => $attendance->employee->department ? $attendance->employee->department->dept_name : null,
                ]
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

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'checkInTime' => 'required|date_format:H:i',
            'checkOutTime' => 'required|date_format:H:i|after:checkInTime',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::with('generalSetting')->find($request->employee_id);
        $date = Carbon::parse($request->date);

        if (!$employee->generalSetting) {
            Log::warning("No general settings found for employee {$employee->id}");
            return response()->json(['error' => 'Employee settings not found'], 422);
        }

        $attendanceExists = Attendence::where('employee_id', $request->employee_id)
            ->whereDate('date', $date)
            ->exists();

        if ($attendanceExists) {
            return response()->json(['error' => 'Attendance already recorded for this date'], 422);
        }

        $weekendDays = $employee->generalSetting->weekend_days ?? ['Saturday', 'Sunday'];
        if (!is_array($weekendDays)) {
            Log::warning("Unexpected type for weekend_days for employee {$employee->id}", ['value' => $weekendDays]);
            $weekendDays = ['Saturday', 'Sunday'];
        }

        if (in_array($date->englishDayOfWeek, $weekendDays)) {
            return response()->json(['error' => 'Cannot record attendance on a weekend'], 422);
        }

        $holidayExists = Holiday::whereDate('date', $date)->exists();
        if ($holidayExists) {
            return response()->json(['error' => 'Cannot record attendance on an official holiday'], 422);
        }

        $attendance = Attendence::create([
            'employee_id' => $request->employee_id,
            'date' => $date,
            'checkInTime' => $request->checkInTime,
            'checkOutTime' => $request->checkOutTime,
            'lateDurationInHours' => $this->calculateLate($employee, $request->checkInTime),
            'overtimeDurationInHours' => $this->calculateOvertime($employee, $request->checkOutTime),
            'status' => 'Present',
        ]);

        if ($employee->generalSetting->status) {
            $attendance->status = $employee->generalSetting->status;
            $attendance->save();
        }

        try {
            $payrollController = new PayrollController();
            $month = $date->format('Y-m');
            $recalculateRequest = new Request([
                'employee_id' => $request->employee_id,
                'month' => $month,
            ]);
            $payrollResponse = $payrollController->recalculate($recalculateRequest);

            if (!$payrollResponse->getData()->success) {
                Log::warning("Failed to recalculate payroll for employee_id: {$request->employee_id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
            }
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

    public function update(Request $request, $employee_id)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'checkInTime' => 'required|date_format:H:i',
            'checkOutTime' => 'required|date_format:H:i|after:checkInTime',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::findOrFail($employee_id);
        $date = Carbon::parse($request->date);

        if (!$employee->generalSetting) {
            Log::warning("No general settings found for employee {$employee->id}");
            return response()->json(['error' => 'Employee settings not found'], 422);
        }

        $attendance = Attendence::where('employee_id', $employee_id)
            ->whereDate('date', $date)
            ->first();

        if (!$attendance) {
            return response()->json(['error' => 'No attendance record found for this employee and date'], 404);
        }

        $attendance->update([
            'checkInTime' => $request->checkInTime,
            'checkOutTime' => $request->checkOutTime,
            'lateDurationInHours' => $this->calculateLate($employee, $request->checkInTime),
            'overtimeDurationInHours' => $this->calculateOvertime($employee, $request->checkOutTime),
        ]);

        try {
            $payrollController = new PayrollController();
            $month = $date->format('Y-m');
            $recalculateRequest = new Request([
                'employee_id' => $employee_id,
                'month' => $month,
            ]);
            $payrollResponse = $payrollController->recalculate($recalculateRequest);

            if (!$payrollResponse->getData()->success) {
                Log::warning("Failed to recalculate payroll for employee_id: {$employee_id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
            }
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll for employee_id: {$employee_id}, month: {$month}. Exception: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Attendance record updated successfully',
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

    public function destroy(Request $request, $employee_id)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::findOrFail($employee_id);
        $date = Carbon::parse($request->date);

        if (!$employee->generalSetting) {
            Log::warning("No general settings found for employee {$employee->id}");
            return response()->json(['error' => 'Employee settings not found'], 422);
        }

        $attendance = Attendence::where('employee_id', $employee_id)
            ->whereDate('date', $date)
            ->first();

        if (!$attendance) {
            return response()->json(['error' => 'No attendance record found for this employee and date'], 404);
        }

        $month = $date->format('Y-m');
        $attendance->delete();

        try {
            $payrollController = new PayrollController();
            $recalculateRequest = new Request([
                'employee_id' => $employee_id,
                'month' => $month,
            ]);
            $payrollResponse = $payrollController->recalculate($recalculateRequest);

            if (!$payrollResponse->getData()->success) {
                Log::warning("Failed to recalculate payroll for employee_id: {$employee_id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
            }
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll for employee_id: {$employee_id}, month: {$month}. Exception: " . $e->getMessage());
        }

        return response()->json(['message' => 'Attendance record deleted successfully']);
    }

    public function checkIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'checkInTime' => 'required|date_format:H:i',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $date = Carbon::parse($request->date);
        $employee = Employee::with('generalSetting')->findOrFail($request->employee_id);

        if (!$employee->generalSetting) {
            Log::warning("No general settings found for employee {$employee->id}");
            return response()->json(['error' => 'Employee settings not found'], 422);
        }

        $weekendDays = $employee->generalSetting->weekend_days ?? ['Saturday', 'Sunday'];
        if (!is_array($weekendDays)) {
            Log::warning("Unexpected type for weekend_days for employee {$employee->id}", ['value' => $weekendDays]);
            $weekendDays = ['Saturday', 'Sunday'];
        }

        if (in_array($date->englishDayOfWeek, $weekendDays)) {
            return response()->json(['error' => 'Cannot record check-in on a weekend'], 422);
        }

        $holidayExists = Holiday::whereDate('date', $date)->exists();
        if ($holidayExists) {
            return response()->json(['error' => 'Cannot record check-in on an official holiday'], 422);
        }

        $attendance = Attendence::firstOrCreate(
            [
                'employee_id' => $request->employee_id,
                'date' => $date,
            ],
            [
                'status' => 'Present',
            ]
        );

        $attendance->checkInTime = $request->checkInTime;
        $attendance->lateDurationInHours = $this->calculateLate($employee, $request->checkInTime);

        if ($attendance->checkOutTime) {
            $attendance->overtimeDurationInHours = $this->calculateOvertime($employee, $attendance->checkOutTime);
        }

        $attendance->save();

        try {
            $payrollController = new PayrollController();
            $month = $date->format('Y-m');
            $recalculateRequest = new Request([
                'employee_id' => $request->employee_id,
                'month' => $month,
            ]);
            $payrollResponse = $payrollController->recalculate($recalculateRequest);

            if (!$payrollResponse->getData()->success) {
                Log::warning("Failed to recalculate payroll for employee_id: {$request->employee_id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
            }
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll for employee_id: {$request->employee_id}, month: {$month}. Exception: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Check-in recorded successfully',
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

    public function checkOut(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'checkOutTime' => 'required|date_format:H:i',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $date = Carbon::parse($request->date);
        $employee = Employee::with('generalSetting')->findOrFail($request->employee_id);

        if (!$employee->generalSetting) {
            Log::warning("No general settings found for employee {$employee->id}");
            return response()->json(['error' => 'Employee settings not found'], 422);
        }

        $weekendDays = $employee->generalSetting->weekend_days ?? ['Saturday', 'Sunday'];
        if (!is_array($weekendDays)) {
            Log::warning("Unexpected type for weekend_days for employee {$employee->id}", ['value' => $weekendDays]);
            $weekendDays = ['Saturday', 'Sunday'];
        }

        if (in_array($date->englishDayOfWeek, $weekendDays)) {
            return response()->json(['error' => 'Cannot record check-out on a weekend'], 422);
        }

        $holidayExists = Holiday::whereDate('date', $date)->exists();
        if ($holidayExists) {
            return response()->json(['error' => 'Cannot record check-out on an official holiday'], 422);
        }

        $attendance = Attendence::where('employee_id', $request->employee_id)
            ->whereDate('date', $date)
            ->first();

        if (!$attendance) {
            return response()->json(['error' => 'Check-in not recorded yet'], 404);
        }

        if ($attendance->checkOutTime) {
            return response()->json(['error' => 'Check-out already recorded for this date'], 422);
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
            $payrollResponse = $payrollController->recalculate($recalculateRequest);

            if (!$payrollResponse->getData()->success) {
                Log::warning("Failed to recalculate payroll for employee_id: {$request->employee_id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
            }
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll for employee_id: {$request->employee_id}, month: {$month}. Exception: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Check-out recorded successfully',
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

    private function calculateLate($employee, $checkInTime)
    {
        $defaultTime = Carbon::parse($employee->default_check_in_time);
        $actualTime = Carbon::parse($checkInTime);

        $lateMinutes = $defaultTime->diffInMinutes($actualTime, false);
        return max($lateMinutes, 0) / 60;
    }

    private function calculateOvertime($employee, $checkOutTime)
    {
        $defaultTime = Carbon::parse($employee->default_check_out_time);
        $actualTime = Carbon::parse($checkOutTime);

        if ($actualTime->lessThanOrEqualTo($defaultTime)) {
            return 0;
        }

        return $defaultTime->diffInMinutes($actualTime) / 60;
    }
}