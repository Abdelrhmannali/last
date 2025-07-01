<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOutRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'checkOutTime' => 'required|date_format:H:i',
        ];
    }

    public function messages()
    {
        return [
            'employee_id.required' => 'Employee ID is required.',
            'employee_id.exists' => 'Employee does not exist.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date.',
            'checkOutTime.required' => 'Check-out time is required.',
            'checkOutTime.date_format' => 'Check-out time must be in HH:MM format.',
        ];
    }
}
