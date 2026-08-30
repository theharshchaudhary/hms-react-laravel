<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Public self-service registration. Always creates a PATIENT account with a
     * linked clinical record. Staff accounts (admin / doctor / receptionist) are
     * created only by a super admin via /api/users.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:40'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'bloodGroup' => ['nullable', 'string', 'max:5'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergencyContact' => ['nullable', 'string', 'max:40'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $patient = Patient::create([
                'patient_code' => Patient::generateCode(),
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'gender' => $data['gender'] ?? 'Other',
                'age' => $data['age'] ?? 0,
                'blood_group' => $data['bloodGroup'] ?? null,
                'address' => $data['address'] ?? null,
                'emergency_contact' => $data['emergencyContact'] ?? null,
                'status' => 'Active',
                'registered_date' => now()->toDateString(),
            ]);

            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'patient',
                'phone' => $data['phone'] ?? null,
                'patient_id' => $patient->id,
            ]);
        });

        return response()->json([
            'token' => $user->createToken('spa')->plainTextToken,
            'user' => new UserResource($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password'],
            ])->status(422);
        }

        return response()->json([
            'token' => $user->createToken('spa')->plainTextToken,
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function user(Request $request)
    {
        return new UserResource($request->user());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:40'],
        ];

        // Staff may also change department / avatar; patients cannot.
        if ($user->isStaff()) {
            $rules['department'] = ['nullable', 'string', 'max:120'];
            $rules['avatar'] = ['nullable', 'string', 'max:255'];
        }

        $data = $request->validate($rules);
        $user->fill($data)->save();

        // Keep a linked patient record's contact details in step.
        if ($user->patient) {
            $user->patient->update(array_filter([
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
            ], fn ($v) => $v !== null));
        }

        return new UserResource($user->fresh());
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
