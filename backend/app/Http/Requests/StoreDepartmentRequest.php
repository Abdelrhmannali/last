<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'dept_name' => 'required|string|max:255|unique:departments,dept_name',
        ];
    }

    public function messages()
    {
        return [
            'dept_name.required' => 'The department name is required.',
            'dept_name.string' => 'The department name must be a string.',
            'dept_name.max' => 'The department name may not be greater than 255 characters.',
            'dept_name.unique' => 'The department name has already been taken.',
        ];
    }
}
