<?php

namespace App\Http\Requests;

class HRValidation
{
    public static function rules($type, $id = null)
    {
        switch ($type) {
            case 'store':
                return [
                    'name' => ['required', 'string', 'max:255'],
                    'email' => [
                        'required',
                        'regex:/^[\w\.-]+@[\w\.-]+\.\w{2,4}$/',
                        'unique:hrs,email'
                    ],
                    'password' => [
                        'required',
                        'string',
                        'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
                    ],
                    'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                ];

            case 'update':
                return [
                    'name' => ['sometimes', 'string', 'max:255'],
                    'email' => [
                        'sometimes',
                        'regex:/^[\w\.-]+@[\w\.-]+\.\w{2,4}$/',
                        'unique:hrs,email,' . $id
                    ],
                    'password' => [
                        'nullable',
                        'string',
                        'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
                    ],
                    'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                ];

            case 'login':
                return [
                    'email' => ['required', 'regex:/^[\w\.-]+@[\w\.-]+\.\w{2,4}$/'],
                    'password' => ['required', 'string'],
                ];

            default:
                return [];
        }
    }

    public static function messages()
    {
        return [
            // name
            'name.required' => 'Name is required.',
            'name.string' => 'Name must be a string.',
            'name.max' => 'Name must not exceed 255 characters.',

            // email
            'email.required' => 'Email is required.',
            'email.regex' => 'Email format is invalid.',
            'email.unique' => 'Email has already been taken.',
            'email.regex' => 'The email format is invalid. Please enter a valid email like example@domain.com.',
            'email.unique' => 'The email has already been taken. Please use a different email.',
                

            // password
            'password.required' => 'Password is required.',
            'password.string' => 'Password must be a string.',
            'password.regex' => 'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.',

            // profile_picture
            'profile_picture.image' => 'Profile picture must be an image.',
            'profile_picture.mimes' => 'Allowed image types: jpeg, png, jpg, gif.',
            'profile_picture.max' => 'Profile picture must not exceed 2MB.',
        ];
    }
}
