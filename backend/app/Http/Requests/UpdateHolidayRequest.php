<?php
 
namespace App\Http\Requests;
 
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\Attendence;
use Illuminate\Validation\Validator;
 
class UpdateHolidayRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }
 
    public function rules()
    {
        $year = Carbon::parse($this->date)->year ?? now()->year;
 
        return [
            'date' => [
                'required',
                'date',
                'after_or_equal:today',
                Rule::unique('holidays', 'date')->ignore($this->holiday->id),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('holidays', 'name')->where(function ($query) use ($year) {
                    return $query->whereYear('date', $year);
                })->ignore($this->holiday->id),
            ],
        ];
    }
 
    public function withValidator($validator)
    {
        $validator->after(function (Validator $validator) {
            $newDate = Carbon::parse($this->date)->toDateString();
            if (
                $newDate !== $this->holiday->date &&
                Attendence::whereDate('date', $newDate)->exists()
            ) {
                $validator->errors()->add('date', 'Cannot update to this date because attendance has already been recorded.');
            }
        });
    }
 
    public function messages()
    {
        return [
            'date.required' => 'The holiday date is required.',
            'date.date' => 'The date must be a valid date.',
            'date.after_or_equal' => 'The holiday date cannot be in the past.',
            'date.unique' => 'This date is already registered as a holiday.',
            'name.required' => 'The holiday name is required.',
            'name.string' => 'The holiday name must be a string.',
            'name.max' => 'The holiday name must not exceed 255 characters.',
            'name.unique' => 'A holiday with this name already exists in the same year.',
        ];
    }
}