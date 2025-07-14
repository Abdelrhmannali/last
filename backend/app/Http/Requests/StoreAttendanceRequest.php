<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use App\Models\Attendence;
use Carbon\Carbon;use Illuminate\Support\Facades\DB;

class StoreAttendanceRequest extends FormRequest
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
            'checkOutTime' => 'required|date_format:H:i|after:checkInTime',
        ];
    }





public function withValidator($validator)
{
    $validator->after(function ($validator) {
        $employee_id = $this->input('employee_id');
        $date = $this->input('date');

        if ($employee_id && $date) {
            $formattedDate = Carbon::parse($date)->format('Y-m-d');

            $exists = DB::table('attendences') 
                ->where('employee_id', $employee_id)
                ->whereDate('date', $formattedDate)
                ->exists();

            if ($exists) {
                $validator->errors()->add('date', 'Attendance for this employee on this date already exists.');
            }
        }
    });
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
            'checkOutTime.required' => 'Check-out time is required.',
            'checkOutTime.date_format' => 'Check-out time must be in HH:MM format.',
            'checkOutTime.after' => 'Check-out time must be after check-in time.',
        ];
    }
}
