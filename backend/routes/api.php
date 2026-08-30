<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:20,1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('contact', [ContactController::class, 'store']);
});

Route::prefix('public')->group(function () {
    Route::get('doctors', [PublicController::class, 'doctors']);
    Route::get('departments', [PublicController::class, 'departments']);
    Route::get('testimonials', [PublicController::class, 'testimonials']);
    Route::get('facilities', [PublicController::class, 'facilities']);
    Route::get('stats', [PublicController::class, 'stats']);
});

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/user', [AuthController::class, 'user']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('auth/password', [AuthController::class, 'updatePassword']);

    // Reads available to every authenticated user.
    Route::apiResource('patients', PatientController::class);
    Route::apiResource('appointments', AppointmentController::class);

    Route::get('queue', [QueueController::class, 'index']);
    Route::post('queue', [QueueController::class, 'store']);
    Route::put('queue/{queue}', [QueueController::class, 'update']);

    Route::apiResource('doctors', DoctorController::class)->only(['index', 'show']);
    Route::apiResource('departments', DepartmentController::class)->only(['index', 'show']);
    Route::apiResource('prescriptions', PrescriptionController::class)->only(['index', 'show']);
    Route::apiResource('records', MedicalRecordController::class)->only(['index', 'show'])->parameters(['records' => 'record']);
    Route::apiResource('invoices', InvoiceController::class)->only(['index', 'show']);

    Route::get('dashboard/overview', [DashboardController::class, 'overview']);

    // Role-restricted writes.
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('doctors', DoctorController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('departments', DepartmentController::class)->only(['store', 'update', 'destroy']);
    });

    Route::middleware('role:admin,doctor')->group(function () {
        Route::apiResource('prescriptions', PrescriptionController::class)->only(['store', 'update']);
        Route::apiResource('records', MedicalRecordController::class)->only(['store'])->parameters(['records' => 'record']);
    });

    Route::middleware('role:admin,receptionist')->group(function () {
        Route::apiResource('invoices', InvoiceController::class)->only(['store', 'update']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('reports/summary', [ReportController::class, 'summary']);
    });
});
