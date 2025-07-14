<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\{
    EmployeeController,
    HRController,
    AttendenceController,
    PayrollController,
    GeneralSettingController,
    HolidayController,
    DepartmentController
};
use App\Http\Controllers\Auth\PasswordResetController;




Route::post('/hr/forgot-password', [PasswordResetController::class, 'sendResetLink']);
Route::post('/hr/reset-password', [PasswordResetController::class, 'reset']);

// ==================
// Public routes
// ==================

Route::post('/hr/login', [HRController::class, 'login']);
        Route::post('/hr/AddHr', [HRController::class, 'AddHr']);

// ==================
// Protected routes
// ==================
Route::middleware('auth:sanctum')->group(function () {

    // ✅ Get current logged-in HR (for frontend use)
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // HR


 Route::post('/hr/update/{id}', [HRController::class, 'update']);



    Route::post('/hr/logout', [HRController::class, 'logout']);

    Route::get('/dashboard', fn() => response()->json(['message' => 'Welcome HR']));

    // Employees
    Route::get('/employees/search', [EmployeeController::class, 'search']);
    Route::apiResource('employees', EmployeeController::class);

    // Attendance
Route::get('/attendances', [AttendenceController::class, 'index']);
Route::post('/attendances', [AttendenceController::class, 'store']);
Route::get('/attendances/{attendance}', [AttendenceController::class, 'show']);
Route::put('/attendances/{attendance}', [AttendenceController::class, 'update']);
Route::delete('/attendances/{id}', [AttendenceController::class, 'destroy']);

Route::post('/attendances/check-in', [AttendenceController::class, 'checkIn']);
Route::post('/attendances/check-out', [AttendenceController::class, 'checkOut']);


Route::post('/run-mark-absentees', [AttendenceController::class, 'markAbsentees']);


    // Payroll
    Route::prefix('payroll')->group(function () {
        Route::get('/show', [PayrollController::class, 'show']);
        Route::get('/summary', [PayrollController::class, 'summary']);
        Route::get('/all-employees-data', [PayrollController::class, 'allEmployeesData']);
        Route::post('/recalculate', [PayrollController::class, 'recalculate']);
        Route::get('/all', [PayrollController::class, 'allPayrolls']); 
Route::get('/current-month', [PayrollController::class, 'getCurrentMonth']);
Route::get('/all-months', [PayrollController::class, 'getAllMonths']);

    });
    Route::get('/payroll/verify/{employee_id}/{month}', [PayrollController::class, 'verifyPayrollApi']);

    // Settings
    Route::apiResource('settings', GeneralSettingController::class);

    // Holidays
    Route::apiResource('holidays', HolidayController::class);

    // Departments
    Route::apiResource('departments', DepartmentController::class);
    Route::get('/departments-with-employees', [DepartmentController::class, 'departmentsWithEmployees']);

Route::prefix('ai-chat')->group(function () {
    Route::post('/message', [App\Http\Controllers\Api\AIChatController::class, 'chat']);
    Route::get('/test-connection', [App\Http\Controllers\Api\AIChatController::class, 'testConnection']);
    Route::get('/stats', [App\Http\Controllers\Api\AIChatController::class, 'getStats']);
    Route::get('/suggestions', [App\Http\Controllers\Api\AIChatController::class, 'getSuggestions']);
    Route::post('/clear-cache', [App\Http\Controllers\Api\AIChatController::class, 'clearCache']);
    Route::get('/health', [App\Http\Controllers\Api\AIChatController::class, 'healthCheck']);
    Route::get('/system-info', [App\Http\Controllers\Api\AIChatController::class, 'getSystemInfo']);
});




});


