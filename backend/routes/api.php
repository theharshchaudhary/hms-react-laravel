<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ContactMessageController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:20,1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']); // patients only
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
| Authenticated — shared
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/user', [AuthController::class, 'user']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('auth/password', [AuthController::class, 'updatePassword']);
});

/*
|--------------------------------------------------------------------------
| Patient portal — role:patient
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:patient'])->prefix('portal')->group(function () {
    Route::get('dashboard', [PortalController::class, 'dashboard']);
    Route::get('profile', [PortalController::class, 'profile']);
    Route::put('profile', [PortalController::class, 'updateProfile']);

    Route::get('appointments', [PortalController::class, 'appointments']);
    Route::post('appointments', [PortalController::class, 'storeAppointment']);
    Route::put('appointments/{appointment}', [PortalController::class, 'updateAppointment']);

    Route::get('prescriptions', [PortalController::class, 'prescriptions']);
    Route::post('prescriptions/{prescription}/refill', [PortalController::class, 'requestRefill']);

    Route::get('records', [PortalController::class, 'records']);

    Route::get('invoices', [PortalController::class, 'invoices']);
    Route::get('invoices/{invoice}/pdf', [PortalController::class, 'invoicePdf']);
});

/*
|--------------------------------------------------------------------------
| Staff back-office — any staff role
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:super_admin,admin,doctor,receptionist'])->group(function () {
    // Reads + writes available to every staff member.
    Route::apiResource('patients', PatientController::class)->except(['destroy']);
    Route::apiResource('appointments', AppointmentController::class);
    Route::post('appointments/{appointment}/check-in', [AppointmentController::class, 'checkIn']);

    Route::get('queue', [QueueController::class, 'index']);
    Route::post('queue', [QueueController::class, 'store']);
    Route::post('queue/reorder', [QueueController::class, 'reorder']);
    Route::put('queue/{queue}', [QueueController::class, 'update']);

    Route::apiResource('doctors', DoctorController::class)->only(['index', 'show']);
    Route::apiResource('departments', DepartmentController::class)->only(['index', 'show']);
    Route::apiResource('prescriptions', PrescriptionController::class)->only(['index', 'show']);
    Route::apiResource('records', MedicalRecordController::class)->only(['index', 'show'])->parameters(['records' => 'record']);
    Route::apiResource('invoices', InvoiceController::class)->only(['index', 'show']);
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'pdf']);

    Route::get('dashboard/overview', [DashboardController::class, 'overview']);

    // Clinical writes.
    Route::middleware('role:super_admin,admin,doctor')->group(function () {
        Route::apiResource('prescriptions', PrescriptionController::class)->only(['store', 'update']);
        Route::apiResource('records', MedicalRecordController::class)->only(['store'])->parameters(['records' => 'record']);
    });

    // Billing writes.
    Route::middleware('role:super_admin,admin,receptionist')->group(function () {
        Route::apiResource('invoices', InvoiceController::class)->only(['store', 'update']);
    });

    // Admin-level configuration.
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::delete('patients/{patient}', [PatientController::class, 'destroy']);
        Route::apiResource('doctors', DoctorController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('departments', DepartmentController::class)->only(['store', 'update', 'destroy']);
        Route::get('reports/summary', [ReportController::class, 'summary']);
        Route::get('reports/pdf', [ReportController::class, 'pdf']);
        Route::apiResource('messages', ContactMessageController::class)->only(['index', 'update', 'destroy']);
    });

    // Staff account management — super admin only.
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});
