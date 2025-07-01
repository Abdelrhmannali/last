<?php

namespace App\Http\Controllers;

use App\Models\HR;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\HRValidation;

class HRController extends Controller
{
    // Register HR with profile picture upload
    public function AddHr(Request $request)
    {
        $validated = $request->validate(
            HRValidation::rules('store'),
            HRValidation::messages()
        );

        if ($request->hasFile('profile_picture')) {
            $validated['profile_picture'] = $request->file('profile_picture')->store('hrs/profile_pictures', 'public');
        }

        $hr = HR::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'profile_picture' => $validated['profile_picture'] ?? null,
        ]);

        $token = $hr->createToken('hr-token')->plainTextToken;

        return response()->json([
            'message' => 'HR registered successfully.',
            'token' => $token,
            'hr' => $hr
        ], 201);
    }

    // HR login method
    public function login(Request $request)
    {
        $validated = $request->validate(
            HRValidation::rules('login'),
            HRValidation::messages()
        );

        $hr = HR::where('email', $validated['email'])->first();

        if (!$hr || !Hash::check($validated['password'], $hr->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $token = $hr->createToken('hr-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'hr' => $hr
        ]);
    }

    // HR logout method
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    // Update HR info
    public function update(Request $request, $id)
    {
        Log::info('Update Request Received:', [
            'id' => $id,
            'input' => $request->all(),
        ]);

        $hr = HR::findOrFail($id);

        $validated = $request->validate(
            HRValidation::rules('update', $id),
            HRValidation::messages()
        );

        if ($request->hasFile('profile_picture')) {
            if ($hr->profile_picture) {
                Storage::disk('public')->delete($hr->profile_picture);
            }
            $validated['profile_picture'] = $request->file('profile_picture')->store('hrs/profile_pictures', 'public');
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        if (empty($validated)) {
            return response()->json(['message' => 'No fields provided for update.'], 422);
        }

        $hr->update($validated);

        return response()->json([
            'message' => 'HR updated successfully.',
            'hr' => $hr
        ]);
    }
}
