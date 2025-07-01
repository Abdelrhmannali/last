<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckInRequest extends FormRequest
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
            'checkInTime' => 'required|date_format:H:i',
        ];
    }

    public function messages()
    {
        return [
            'employee_id.required' => 'Employee ID is required.',
            'employee_id.exists' => 'Employee does not exist.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date.',
            'checkInTime.required' => 'Check-in time is required.',
            'checkInTime.date_format' => 'Check-in time must be in HH:MM format.',
        ];
    }
}
