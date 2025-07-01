<?php
 
namespace App\Http\Requests;
 
use Illuminate\Foundation\Http\FormRequest;
 
class UpdateGeneralSettingRequest extends FormRequest

{

    public function authorize()

    {

        return true;

    }
 
    public function rules()

    {

        return [

            'deduction_type' => 'sometimes|in:hours,money',

            'deduction_value' => 'sometimes|numeric',

            'overtime_type' => 'sometimes|in:hours,money',

            'overtime_value' => 'sometimes|numeric',

            'weekend_days' => 'sometimes|array|min:1',

            'weekend_days.*' => 'string'

        ];

    }
 
    public function messages()

    {

        return [

            'deduction_type.in' => 'Deduction type must be either hours or money.',

            'deduction_value.numeric' => 'Deduction value must be a number.',

            'overtime_type.in' => 'Overtime type must be either hours or money.',

            'overtime_value.numeric' => 'Overtime value must be a number.',

            'weekend_days.array' => 'Weekend days must be an array.',

            'weekend_days.*.string' => 'Each weekend day must be a string.',

        ];

    }

}

 