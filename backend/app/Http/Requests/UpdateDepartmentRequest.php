<?php
 
namespace App\Http\Requests;
 
use Illuminate\Foundation\Http\FormRequest;
 
class UpdateDepartmentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }
 
    public function rules()
    {
        return [
            'dept_name' => 'required|string|max:255|unique:departments,dept_name,' . $this->department->id,
        ];
    }
 
    public function messages()
    {
        return [
            'dept_name.required' => 'Department name is required.',
            'dept_name.string' => 'Department name must be a string.',
            'dept_name.max' => 'Department name must not exceed 255 characters.',
            'dept_name.unique' => 'This department name is already taken.',
        ];
    }
}