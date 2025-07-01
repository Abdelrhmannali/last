<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DestroyAttendanceRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'date' => 'required|date',
        ];
    }

    public function messages()
    {
        return [
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date.',
        ];
    }
}
