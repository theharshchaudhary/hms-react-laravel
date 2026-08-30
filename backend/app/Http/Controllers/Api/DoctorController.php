<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $query = Doctor::query()->latest('id');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('specialization', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            });
        }

        if ($availability = $request->query('availability')) {
            $query->where('availability', $availability);
        }

        // Doctor profiles not yet linked to a staff login (for the User Management picker).
        if ($request->boolean('unlinked')) {
            $query->whereDoesntHave('user');
        }

        return DoctorResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $doctor = Doctor::create($this->validateData($request));

        return (new DoctorResource($doctor))->response()->setStatusCode(201);
    }

    public function show(Doctor $doctor)
    {
        return new DoctorResource($doctor);
    }

    public function update(Request $request, Doctor $doctor)
    {
        $doctor->update($this->validateData($request, $doctor));

        return new DoctorResource($doctor->fresh());
    }

    public function destroy(Doctor $doctor)
    {
        $doctor->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?Doctor $doctor = null): array
    {
        $validated = $request->validate([
            'name' => [$doctor ? 'sometimes' : 'required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'experience' => ['nullable', 'integer', 'min:0', 'max:80'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'availability' => ['nullable', Rule::in(['Available', 'On Leave', 'Busy'])],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
        ]);

        // total_patients is derived (see DoctorResource) — not client-settable.
        return $validated;
    }
}
