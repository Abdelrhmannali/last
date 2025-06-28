<?php

namespace App\Http\Controllers;

use App\Models\HR;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class HRController extends Controller
{
    // Register HR with profile picture upload
    public function AddHr(Request $request)
    {
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:hrs,email'],
            'password' => ['required', 'string', 'min:6'],
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('hrs/profile_pictures', 'public');
            $validatedData['profile_picture'] = $path;
        }

        $hr = HR::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'profile_picture' => $validatedData['profile_picture'] ?? null,
        ]);

        $token = $hr->createToken('hr-token')->plainTextToken;

        return response()->json([
            'message' => 'HR registered successfully',
            'token' => $token,
            'hr' => $hr
        ], 201);
    }

    // HR login method
    public function login(Request $request)
    {
        $validatedData = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $hr = HR::where('email', $validatedData['email'])->first();

        if (!$hr || !Hash::check($validatedData['password'], $hr->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $hr->createToken('hr-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'hr' => $hr
        ]);
    }

    // HR logout method
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
    public function update(Request $request, $id)
{
    Log::info('Update Request Received:', [
        'id' => $id,
        'input' => $request->all(),
    ]);

    $hr = HR::findOrFail($id);

    $validatedData = $request->validate([
        'name' => ['sometimes', 'string', 'max:255'],
        'email' => ['sometimes', 'email', 'unique:hrs,email,' . $id],
        'password' => ['nullable', 'string', 'min:6'],
        'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    // الصورة
    if ($request->hasFile('profile_picture')) {
        if ($hr->profile_picture) {
            Storage::disk('public')->delete($hr->profile_picture);
        }
        $validatedData['profile_picture'] = $request->file('profile_picture')->store('hrs/profile_pictures', 'public');
    }

    // الباسورد
    if (!empty($validatedData['password'])) {
        $validatedData['password'] = Hash::make($validatedData['password']);
    }

    // لو مفيش أي حاجة جوه validatedData
    if (empty($validatedData)) {
        return response()->json(['message' => 'No fields provided for update.'], 422);
    }

    $hr->update($validatedData);

    return response()->json([
        'message' => 'HR updated successfully',
        'hr' => $hr
    ]);
}


    // Update HR details
  
}