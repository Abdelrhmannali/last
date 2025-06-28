<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Department;
use App\Models\GeneralSetting;
use App\Models\Payroll;
use App\Models\Attendence;
use App\Notifications\EmployeeActionNotification;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class EmployeeController extends Controller
{
    /**
     * Get a paginated list of employees along with their department data.
     */
    public function index()
    {
        $employees = Employee::with('department')->paginate(10);
        return response()->json($employees, 200);
    }

    /**
     * Fetch all departments to be used when creating a new employee.
     */
    public function create()
    {
        $departments = Department::all();
        return response()->json(['departments' => $departments], 200);
    }

    /**
     * Store a new employee record in the database.
     * Handle validation, image upload, and save all employee data.
     * Also create default GeneralSetting and Payroll records.
     * Send notification to employee's email.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'required|digits_between:11,15|numeric',
            'address' => 'nullable|string',
            'salary' => 'required|numeric|min:0',
            'hire_date' => 'required|date|after_or_equal:2008-01-01',
            'default_check_in_time' => 'nullable|date_format:H:i',
            'default_check_out_time' => 'nullable|date_format:H:i',
            'gender' => 'required|in:Male,Female',
            'nationality' => 'required|string',
            'national_id' => 'required|digits:14|unique:employees,national_id',
            'birthdate' => 'required|date|before_or_equal:' . Carbon::now()->subYears(20)->toDateString(),
            'department_id' => 'nullable|exists:departments,id',
            'working_hours_per_day' => 'required|integer|min:1|max:24',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('profile_picture') && $request->file('profile_picture')->isValid()) {
            $path = $request->file('profile_picture')->store('employees', 'public');
            $validatedData['profile_picture'] = $path;
        }

        $employee = Employee::create($validatedData);

        GeneralSetting::create([
            'employee_id' => $employee->id,
            'weekend_days' => json_encode(['Friday', 'Saturday']),
            'deduction_type' => 'money',
            'deduction_value' => 0,
            'overtime_type' => 'money',
            'overtime_value' => 0,
        ]);

        $existingPayroll = Payroll::where('employee_id', $employee->id)
            ->where('month', now()->format('Y-m'))
            ->first();

        if (!$existingPayroll) {
            Payroll::create([
                'employee_id' => $employee->id,
                'month' => now()->format('Y-m'),
                'month_days' => now()->daysInMonth,
                'attended_days' => 0,
                'absent_days' => 0,
                'total_overtime' => 0,
                'total_bonus_amount' => 0,
                'total_deduction_amount' => 0,
                'net_salary' => $employee->salary,
                'absence_deduction_amount' => 0,
                'late_deduction_amount' => 0,
            ]);
        }

        // إرسال إشعار إلى بريد الموظف
        try {
            $employee->notify(new EmployeeActionNotification($employee, 'added'));
        } catch (\Exception $e) {
            Log::error("Failed to send notification to employee {$employee->email}: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Employee added successfully.',
            'employee' => $employee->load('department', 'generalSetting', 'latestPayroll')
        ], 201);
    }

    /**
     * Display a single employee data with department details.
     */
    public function show($id)
    {
        $employee = Employee::with('department', 'generalSetting', 'latestPayroll')->findOrFail($id);
        return response()->json($employee, 200);
    }

    /**
     * Get data for editing a specific employee including department list.
     */
    public function edit($id)
    {
        $employee = Employee::with('generalSetting')->findOrFail($id);
        $departments = Department::all();

        return response()->json([
            'employee' => $employee,
            'departments' => $departments
        ], 200);
    }

    /**
     * Update employee data partially or fully.
     * Handle profile picture replacement if uploaded.
     * Also update related GeneralSetting and optionally recalculate Payroll.
     */
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $validatedData = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:employees,email,' . $id,
            'phone' => 'sometimes|required|digits_between:11,15|numeric',
            'address' => 'nullable|string',
            'salary' => 'sometimes|required|numeric|min:0',
            'hire_date' => 'sometimes|required|date|after_or_equal:2008-01-01',
            'default_check_in_time' => 'nullable|date_format:H:i',
            'default_check_out_time' => 'nullable|date_format:H:i',
            'gender' => 'sometimes|required|in:Male,Female',
            'nationality' => 'sometimes|required|string',
            'national_id' => 'sometimes|required|digits:14|unique:employees,national_id,' . $id,
            'birthdate' => 'sometimes|required|date|before_or_equal:' . Carbon::now()->subYears(20)->toDateString(),
            'department_id' => 'nullable|exists:departments,id',
            'working_hours_per_day' => 'sometimes|required|integer|min:1|max:24',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'general_setting.deduction_type' => 'nullable|string',
            'general_setting.deduction_value' => 'nullable|numeric|min:0',
            'general_setting.overtime_type' => 'nullable|string',
            'general_setting.overtime_value' => 'nullable|numeric|min:0',
            'general_setting.weekend_days' => 'nullable|array',
            'general_setting.weekend_days.*' => 'in:Friday,Saturday,Sunday,Monday,Tuesday,Wednesday,Thursday',
        ]);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture') && $request->file('profile_picture')->isValid()) {
            if ($employee->profile_picture && Storage::disk('public')->exists($employee->profile_picture)) {
                Storage::disk('public')->delete($employee->profile_picture);
            }
            $path = $request->file('profile_picture')->store('employees', 'public');
            $validatedData['profile_picture'] = $path;
        }

        $employee->update($validatedData);

        // Update GeneralSetting if provided
        if ($request->has('general_setting')) {
            $gsData = $request->input('general_setting');
            if (array_key_exists('weekend_days', $gsData)) {
                $gsData['weekend_days'] = json_encode($gsData['weekend_days']);
            } elseif (!array_key_exists('weekend_days', $gsData)) {
                $gsData['weekend_days'] = json_encode($employee->weekend_days ?? ['Friday', 'Saturday']);
            }
            $employee->generalSetting()->updateOrCreate(
                ['employee_id' => $employee->id],
                $gsData
            );
        }

        // Trigger payroll recalculation if salary or working hours changed
        if ($request->hasAny(['salary', 'working_hours_per_day'])) {
            try {
                $payrollController = new PayrollController();
                $attendanceMonths = Attendence::where('employee_id', $id)
                    ->selectRaw('DISTINCT DATE_FORMAT(date, "%Y-%m") as month')
                    ->pluck('month');

                foreach ($attendanceMonths as $month) {
                    $recalculateRequest = new Request([
                        'employee_id' => $id,
                        'month' => $month,
                    ]);
                    $payrollResponse = $payrollController->recalculate($recalculateRequest);

                    if (!$payrollResponse->getData()->success) {
                        Log::warning("Failed to recalculate payroll for employee_id: {$id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Error recalculating payroll for employee_id: {$id}. Exception: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Employee updated successfully.',
            'employee' => $employee->load('department', 'generalSetting', 'latestPayroll')
        ], 200);
    }

    /**
     * Delete an employee and their related records.
     * Send notification to employee's email before deletion.
     */
    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);

        try {
            // إرسال إشعار إلى بريد الموظف
            $employee->notify(new EmployeeActionNotification($employee, 'deleted'));

            // Delete profile picture if it exists
            if ($employee->profile_picture && Storage::disk('public')->exists($employee->profile_picture)) {
                Storage::disk('public')->delete($employee->profile_picture);
            }

            $employee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Employee and related records deleted successfully.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete employee: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search for employees by name or national ID.
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = $request->input('query');

        $employees = Employee::whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$query}%"])
            ->orWhere('national_id', 'like', "%{$query}%")
            ->with('department')
            ->paginate(10);

        return response()->json($employees, 200);
    }
}