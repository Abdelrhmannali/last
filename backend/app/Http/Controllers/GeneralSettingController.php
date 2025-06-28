<?php
namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use App\Models\Employee;
use App\Models\Attendence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GeneralSettingController extends Controller
{
    public function index()
    {
        $settings = GeneralSetting::all(); // Changed from first() to all()

        return response()->json([
            'success' => true,
            'message' => $settings->isEmpty() ? 'No general settings found.' : 'General settings retrieved successfully.',
            'data' => $settings
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'deduction_type' => 'required|in:hours,money',
            'deduction_value' => 'required|numeric',
            'overtime_type' => 'required|in:hours,money',
            'overtime_value' => 'required|numeric',
            'weekend_days' => 'required|array',
            'weekend_days.*' => 'string',
        ]);

        // Encode weekend_days to JSON before saving
        if (isset($validated['weekend_days'])) {
            $validated['weekend_days'] = json_encode($validated['weekend_days']);
        }

        $setting = GeneralSetting::where('employee_id', $validated['employee_id'])->first();

        $message = 'General setting created successfully.';
        if ($setting) {
            $setting->update($validated);
            $message = 'General setting updated successfully.';
        } else {
            $setting = GeneralSetting::create($validated);
        }

        // Recalculate payroll for all attendance months
        try {
            $payrollController = new PayrollController();
            $attendanceMonths = Attendence::where('employee_id', $validated['employee_id'])
                ->selectRaw('DISTINCT DATE_FORMAT(date, "%Y-%m") as month')
                ->pluck('month');

            foreach ($attendanceMonths as $month) {
                $recalculateRequest = new Request([
                    'employee_id' => $validated['employee_id'],
                    'month' => $month,
                ]);
                $payrollResponse = $payrollController->recalculate($recalculateRequest);

                if (!$payrollResponse->getData()->success) {
                    Log::warning("Failed to recalculate payroll for employee_id: {$validated['employee_id']}, month: {$month}. Error: " . $payrollResponse->getData()->message);
                }
            }
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll for employee_id: {$validated['employee_id']}. Exception: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $setting
        ], 201);
    }

    public function show($employee_id)
    {
        $setting = GeneralSetting::where('employee_id', $employee_id)->firstOrFail();

        return response()->json([
            'success' => true,
            'message' => 'General setting retrieved successfully.',
            'data' => $setting
        ]);
    }

    public function update(Request $request, $employee_id)
    {
        $validator = Validator::make($request->all(), [
            'deduction_type' => 'sometimes|in:hours,money',
            'deduction_value' => 'sometimes|numeric',
            'overtime_type' => 'sometimes|in:hours,money',
            'overtime_value' => 'sometimes|numeric',
            'weekend_days' => 'sometimes|array',
            'weekend_days.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        if (isset($validated['weekend_days'])) {
            $validated['weekend_days'] = json_encode($validated['weekend_days']);
        }

        $setting = GeneralSetting::where('employee_id', $employee_id)->firstOrFail();
        $setting->update($validated);

        try {
            $payrollController = new PayrollController();
            $attendanceMonths = Attendence::where('employee_id', $employee_id)
                ->selectRaw('DISTINCT DATE_FORMAT(date, "%Y-%m") as month')
                ->pluck('month');

            foreach ($attendanceMonths as $month) {
                $recalculateRequest = new Request([
                    'employee_id' => $employee_id,
                    'month' => $month,
                ]);
                $payrollResponse = $payrollController->recalculate($recalculateRequest);

                if (!$payrollResponse->getData()->success) {
                    Log::warning("Failed to recalculate payroll for employee_id: {$employee_id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
                }
            }
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll for employee_id: {$employee_id}. Exception: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'General setting updated successfully.',
            'data' => $setting
        ]);
    }

    public function destroy($employee_id)
    {
        $setting = GeneralSetting::where('employee_id', $employee_id)->first();

        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'No general setting found for this employee.'
            ], 404);
        }

        $attendanceMonths = Attendence::where('employee_id', $employee_id)
            ->selectRaw('DISTINCT DATE_FORMAT(date, "%Y-%m") as month')
            ->pluck('month');

        $setting->delete();

        try {
            $payrollController = new PayrollController();
            foreach ($attendanceMonths as $month) {
                $recalculateRequest = new Request([
                    'employee_id' => $employee_id,
                    'month' => $month,
                ]);
                $payrollResponse = $payrollController->recalculate($recalculateRequest);

                if (!$payrollResponse->getData()->success) {
                    Log::warning("Failed to recalculate payroll for employee_id: {$employee_id}, month: {$month}. Error: " . $payrollResponse->getData()->message);
                }
            }
        } catch (\Exception $e) {
            Log::error("Error recalculating payroll for employee_id: {$employee_id}. Exception: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'General setting deleted successfully.'
        ]);
    }
}
