<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Staff account management — super admin only (see routes/api.php).
 */
class UserController extends Controller
{
    private const MANAGEABLE_ROLES = ['super_admin', 'admin', 'doctor', 'receptionist'];

    public function index(Request $request)
    {
        $query = User::query()->with('doctor')->whereIn('role', self::MANAGEABLE_ROLES)->latest('id');

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }
        if ($search = $request->query('search')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        return UserResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);

        $user = DB::transaction(function () use ($data, $request) {
            $doctorId = $data['role'] === 'doctor' ? $this->resolveDoctorId($request) : null;

            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
                'phone' => $data['phone'] ?? null,
                'department' => $data['department'] ?? null,
                'doctor_id' => $doctorId,
            ]);
        });

        return (new UserResource($user->load('doctor')))->response()->setStatusCode(201);
    }

    public function show(User $user)
    {
        $this->assertStaff($user);

        return new UserResource($user->load('doctor'));
    }

    public function update(Request $request, User $user)
    {
        $this->assertStaff($user);

        $data = $this->validatePayload($request, $user);

        if (isset($data['role']) && $user->isSuperAdmin() && $data['role'] !== 'super_admin'
            && User::where('role', 'super_admin')->count() <= 1) {
            throw ValidationException::withMessages(['role' => ['Cannot demote the only super admin.']]);
        }

        DB::transaction(function () use ($data, $request, $user) {
            $role = $data['role'] ?? $user->role;
            $payload = collect($data)->only(['name', 'email', 'role', 'phone', 'department'])->all();

            if (! empty($data['password'])) {
                $payload['password'] = $data['password'];
            }

            if ($role === 'doctor') {
                $payload['doctor_id'] = $this->resolveDoctorId($request, $user);
            } else {
                $payload['doctor_id'] = null;
            }

            $user->update($payload);
        });

        return new UserResource($user->fresh()->load('doctor'));
    }

    public function destroy(Request $request, User $user)
    {
        $this->assertStaff($user);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages(['user' => ['You cannot delete your own account.']]);
        }
        if ($user->isSuperAdmin() && User::where('role', 'super_admin')->count() <= 1) {
            throw ValidationException::withMessages(['user' => ['Cannot delete the only super admin.']]);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?User $user = null): array
    {
        $creating = ! $user;

        return $request->validate([
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'email' => [$creating ? 'required' : 'sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$creating ? 'required' : 'nullable', 'string', 'min:8'],
            'role' => [$creating ? 'required' : 'sometimes', Rule::in(self::MANAGEABLE_ROLES)],
            'phone' => ['nullable', 'string', 'max:40'],
            'department' => ['nullable', 'string', 'max:120'],
            'doctorId' => ['nullable', 'exists:doctors,id'],
            'doctorProfile' => ['nullable', 'array'],
            'doctorProfile.name' => ['required_with:doctorProfile', 'string', 'max:255'],
            'doctorProfile.specialization' => ['nullable', 'string', 'max:255'],
            'doctorProfile.department' => ['nullable', 'string', 'max:255'],
            'doctorProfile.qualification' => ['nullable', 'string', 'max:255'],
            'doctorProfile.experience' => ['nullable', 'integer', 'min:0', 'max:80'],
        ]);
    }

    /**
     * Link an existing (unlinked) doctor profile, or create one from the payload.
     */
    private function resolveDoctorId(Request $request, ?User $user = null): int
    {
        $existing = $request->input('doctorId');
        $profile = $request->input('doctorProfile');

        if ($existing) {
            $takenBy = User::where('doctor_id', $existing)->where('id', '!=', $user?->id)->exists();
            if ($takenBy) {
                throw ValidationException::withMessages(['doctorId' => ['That doctor profile is already linked to another account.']]);
            }

            return (int) $existing;
        }

        if (is_array($profile) && ! empty($profile['name'])) {
            $doctor = Doctor::create([
                'name' => $profile['name'],
                'specialization' => $profile['specialization'] ?? null,
                'department' => $profile['department'] ?? $request->input('department'),
                'qualification' => $profile['qualification'] ?? null,
                'experience' => $profile['experience'] ?? 0,
                'availability' => 'Available',
                'rating' => 5,
                'avatar' => collect(explode(' ', $profile['name']))->take(2)->map(fn ($p) => mb_substr($p, 0, 1))->implode(''),
            ]);

            return $doctor->id;
        }

        // Keep an existing link on update; require one on create.
        if ($user?->doctor_id) {
            return $user->doctor_id;
        }

        throw ValidationException::withMessages([
            'doctorId' => ['Pick an existing doctor profile or provide details to create one.'],
        ]);
    }

    private function assertStaff(User $user): void
    {
        abort_unless(in_array($user->role, self::MANAGEABLE_ROLES, true), 404);
    }
}
