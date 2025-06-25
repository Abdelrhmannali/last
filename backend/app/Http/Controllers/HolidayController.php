<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\Employee;
use App\Models\Attendence;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Http\Controllers\PayrollController;

class HolidayController extends Controller
{
    // Get all holidays
    public function index()
    {
        $holidays = Holiday::all();
        return response()->json([
            'message' => 'Holidays retrieved successfully.',
            'data' => $holidays
        ]);
    }

    // Store a new holiday
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date|unique:holidays,date',
            'name' => 'required|string',
        ]);

        // Convert date to date-only format (Y-m-d)
        $date = Carbon::parse($request->date)->toDateString();

        // Check if any attendance record exists on this date
        $attendanceExists = Attendence::whereDate('date', $date)->exists();

        if ($attendanceExists) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot register this day as a holiday because attendance has already been recorded for it.'
            ], 400);
        }

        // Create the holiday
        $holiday = Holiday::create([
            'date' => $date,
            'name' => $request->name,
        ]);

        // Recalculate payrolls for the affected month
        $this->recalculatePayrollsForMonth(Carbon::parse($date)->format('Y-m'));

        return response()->json([
            'success' => true,
            'message' => 'Holiday created successfully and payrolls recalculated.',
            'data' => $holiday
        ], 201);
    }

    // Show a specific holiday
    public function show(Holiday $holiday)
    {
        return response()->json([
            'message' => 'Holiday retrieved successfully.',
            'data' => $holiday
        ]);
    }

    // Update a holiday
    public function update(Request $request, Holiday $holiday)
    {
        $request->validate([
            'date' => 'required|date|unique:holidays,date,' . $holiday->id,
            'name' => 'required|string|max:255',
        ]);

        // Store the old month to check if it changed
        $oldMonth = Carbon::parse($holiday->date)->format('Y-m');
        $newDate = Carbon::parse($request->date)->toDateString();
        $newMonth = Carbon::parse($newDate)->format('Y-m');

        // Update the holiday
        $holiday->update([
            'date' => $newDate,
            'name' => $request->name,
        ]);

        // Recalculate payrolls for the affected months
        $this->recalculatePayrollsForMonth($newMonth);
        if ($oldMonth !== $newMonth) {
            $this->recalculatePayrollsForMonth($oldMonth);
        }

        return response()->json([
            'success' => true,
            'message' => 'Holiday updated successfully and payrolls recalculated.',
            'data' => $holiday
        ]);
    }

    // Delete a holiday
    public function destroy(Holiday $holiday)
    {
        // Store the month before deletion
        $month = Carbon::parse($holiday->date)->format('Y-m');

        // Delete the holiday
        $holiday->delete();

        // Recalculate payrolls for the affected month
        $this->recalculatePayrollsForMonth($month);

        return response()->json([
            'success' => true,
            'message' => 'Holiday deleted successfully and payrolls recalculated.'
        ]);
    }

    // Helper method to recalculate payrolls for all employees in a given month
    private function recalculatePayrollsForMonth($month)
    {
        $employees = Employee::all();
        $payrollController = new PayrollController();

        foreach ($employees as $employee) {
            $request = new Request([
                'employee_id' => $employee->id,
                'month' => $month,
            ]);

            // Call the recalculate method from PayrollController
            $payrollController->recalculate($request);
        }
    }
}