<?php
 
namespace App\Http\Controllers;
 
use App\Models\Holiday;
use App\Models\Employee;
use App\Models\Attendence;
use App\Http\Requests\StoreHolidayRequest;
use App\Http\Requests\UpdateHolidayRequest;
use App\Http\Controllers\PayrollController;
use Carbon\Carbon;
use Illuminate\Http\Request;
 
class HolidayController extends Controller
{
    public function index()
    {
        $holidays = Holiday::all();
        return response()->json([
            'message' => 'Holidays retrieved successfully.',
            'data' => $holidays
        ]);
    }
 
    public function store(StoreHolidayRequest $request)
    {
        $date = Carbon::parse($request->date)->toDateString();
 
        if (Attendence::whereDate('date', $date)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot register this day as a holiday because attendance has already been recorded.'
            ], 400);
        }
 
        $holiday = Holiday::create([
            'date' => $date,
            'name' => $request->name,
        ]);
 
        $this->recalculatePayrollsForMonth(Carbon::parse($date)->format('Y-m'));
 
        return response()->json([
            'success' => true,
            'message' => 'Holiday created successfully and payrolls recalculated.',
            'data' => $holiday
        ], 201);
    }
 
    public function show(Holiday $holiday)
    {
        return response()->json([
            'message' => 'Holiday retrieved successfully.',
            'data' => $holiday
        ]);
    }
 
    public function update(UpdateHolidayRequest $request, Holiday $holiday)
    {
        $oldMonth = Carbon::parse($holiday->date)->format('Y-m');
        $newDate = Carbon::parse($request->date)->toDateString();
        $newMonth = Carbon::parse($newDate)->format('Y-m');
 
        $holiday->update([
            'date' => $newDate,
            'name' => $request->name,
        ]);
 
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
 
    public function destroy(Holiday $holiday)
    {
        $month = Carbon::parse($holiday->date)->format('Y-m');
        $holiday->delete();
        $this->recalculatePayrollsForMonth($month);
 
        return response()->json([
            'success' => true,
            'message' => 'Holiday deleted successfully and payrolls recalculated.'
        ]);
    }
 
    private function recalculatePayrollsForMonth($month)
    {
        $employees = Employee::all();
        $payrollController = new PayrollController();
 
        foreach ($employees as $employee) {
            $payrollController->recalculate(new Request([
                'employee_id' => $employee->id,
                'month' => $month,
            ]));
        }
    }
}