<?php
 
namespace App\Http\Controllers;
 
use App\Models\GeneralSetting;

use App\Models\Attendence;

use App\Http\Requests\StoreGeneralSettingRequest;

use App\Http\Requests\UpdateGeneralSettingRequest;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;
 
class GeneralSettingController extends Controller

{

    public function index()

    {

        $settings = GeneralSetting::all();
 
        return response()->json([

            'success' => true,

            'message' => $settings->isEmpty() ? 'No general settings found.' : 'General settings retrieved successfully.',

            'data' => $settings

        ]);

    }
 
    public function store(StoreGeneralSettingRequest $request)

    {

        $data = $request->validated();

        $data['weekend_days'] = ($data['weekend_days']);
 
        $setting = GeneralSetting::create($data);
 
        $this->recalculatePayrollForEmployee($data['employee_id']);
 
        return response()->json([

            'success' => true,

            'message' => 'General setting created successfully.',

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
 
    public function update(UpdateGeneralSettingRequest $request, $employee_id)

    {

        $setting = GeneralSetting::where('employee_id', $employee_id)->firstOrFail();

        $data = $request->validated();
 
        if (isset($data['weekend_days'])) {

            $data['weekend_days'] = ($data['weekend_days']);

        }
 
        $setting->update($data);
 
        $this->recalculatePayrollForEmployee($employee_id);
 
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
 
        $setting->delete();
 
        $this->recalculatePayrollForEmployee($employee_id);
 
        return response()->json([

            'success' => true,

            'message' => 'General setting deleted successfully.'

        ]);

    }
 
    private function recalculatePayrollForEmployee($employee_id)

    {

        try {

            $months = Attendence::where('employee_id', $employee_id)

                ->selectRaw('DISTINCT DATE_FORMAT(date, "%Y-%m") as month')

                ->pluck('month');
 
            $payrollController = new PayrollController();
 
            foreach ($months as $month) {

                $response = $payrollController->recalculate(new Request([

                    'employee_id' => $employee_id,

                    'month' => $month,

                ]));
 
                if (!$response->getData()->success) {

                    Log::warning("Failed to recalculate payroll for employee_id: {$employee_id}, month: {$month}. Error: " . $response->getData()->message);

                }

            }

        } catch (\Exception $e) {

            Log::error("Payroll recalculation failed for employee_id: {$employee_id}. Exception: " . $e->getMessage());

        }

    }

}

 