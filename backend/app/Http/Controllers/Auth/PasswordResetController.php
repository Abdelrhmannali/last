<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
    // Send password reset link
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:hrs,email',
        ]);

        $status = Password::broker('hrs')->sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Password reset link sent successfully.'])
            : response()->json(['message' => 'An error occurred while sending the link.'], 500);
    }

    // Reset the password
    public function reset(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:hrs,email',
            'token' => 'required',
            'password' => 'required|min:6|confirmed',
        ]);

        $status = Password::broker('hrs')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($hr, $password) {
                $hr->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password has been successfully reset.'])
            : response()->json(['message' => 'Invalid or expired token.'], 400);
    }
}
