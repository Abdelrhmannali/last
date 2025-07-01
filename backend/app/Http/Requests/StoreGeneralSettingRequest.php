<?php
 
namespace App\Http\Requests;
 
use Illuminate\Foundation\Http\FormRequest;
 
class StoreGeneralSettingRequest extends FormRequest

{

    public function authorize()

    {

        return true;

    }
 
    public function rules()

    {

        return [

            'employee_id' => 'required|exists:employees,id|unique:general_settings,employee_id',

            'deduction_type' => 'required|in:hours,money',

            'deduction_value' => 'required|numeric',

            'overtime_type' => 'required|in:hours,money',

            'overtime_value' => 'required|numeric',

            'weekend_days' => 'required|array|min:1',

            'weekend_days.*' => 'string'

        ];

    }
 
    public function messages()

    {

        return [

            'employee_id.required' => 'Employee ID is required.',

            'employee_id.exists' => 'Employee not found.',

            'employee_id.unique' => 'General setting already exists for this employee.',

            'deduction_type.required' => 'Deduction type is required.',

            'deduction_type.in' => 'Deduction type must be either hours or money.',

            'deduction_value.required' => 'Deduction value is required.',

            'deduction_value.numeric' => 'Deduction value must be a number.',

            'overtime_type.required' => 'Overtime type is required.',

            'overtime_type.in' => 'Overtime type must be either hours or money.',

            'overtime_value.required' => 'Overtime value is required.',

            'overtime_value.numeric' => 'Overtime value must be a number.',

            'weekend_days.required' => 'Weekend days are required.',

            'weekend_days.array' => 'Weekend days must be an array.',

            'weekend_days.*.string' => 'Each weekend day must be a string.',

        ];

    }

}

 