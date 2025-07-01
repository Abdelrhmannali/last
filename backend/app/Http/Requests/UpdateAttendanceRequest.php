<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'date' => 'required|date',
            'checkInTime' => 'required|date_format:H:i',
            'checkOutTime' => 'required|date_format:H:i|after:checkInTime',
        ];
    }

    public function messages()
    {
        return [
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date.',
            'checkInTime.required' => 'Check-in time is required.',
            'checkInTime.date_format' => 'Check-in time must be in HH:MM format.',
            'checkOutTime.required' => 'Check-out time is required.',
            'checkOutTime.date_format' => 'Check-out time must be in HH:MM format.',
            'checkOutTime.after' => 'Check-out time must be after check-in time.',
        ];
    }
}
