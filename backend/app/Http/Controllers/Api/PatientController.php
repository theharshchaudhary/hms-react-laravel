<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDoctor;
use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    use ScopesToDoctor;

    public function index(Request $request)
    {
        $query = Patient::query()->latest('id');

        // A doctor login only sees patients they have a relationship with.
        if ($doctorId = $this->currentDoctorId($request)) {
            $query->where(function ($q) use ($doctorId) {
                $q->whereHas('appointments', fn ($a) => $a->where('doctor_id', $doctorId))
                    ->orWhereHas('prescriptions', fn ($p) => $p->where('doctor_id', $doctorId))
                    ->orWhereHas('medicalRecords', fn ($m) => $m->where('doctor_id', $doctorId));
            });
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('patient_code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return PatientResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['patient_code'] = ($data['patient_code'] ?? null) ?: Patient::generateCode();
        $data['registered_date'] = ($data['registered_date'] ?? null) ?: now()->toDateString();

        $patient = Patient::create($data);

        return (new PatientResource($patient))->response()->setStatusCode(201);
    }

    public function show(Patient $patient)
    {
        return new PatientResource($patient);
    }

    public function update(Request $request, Patient $patient)
    {
        $data = $this->validateData($request, $patient);

        // Clearing the admitting department when discharged.
        if (($data['status'] ?? $patient->status) !== 'Admitted') {
            $data['department'] = null;
        }

        $patient->update($data);

        // Keep the linked portal login's email in sync.
        if ($patient->user && array_key_exists('email', $data) && $data['email']) {
            $patient->user->update(['email' => $data['email']]);
        }

        return new PatientResource($patient->fresh());
    }

    public function destroy(Patient $patient)
    {
        DB::transaction(function () use ($patient) {
            if ($user = $patient->user) {
                $user->tokens()->delete();
                $user->delete();
            }
            $patient->delete();
        });

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?Patient $patient = null): array
    {
        $rules = [
            'patientCode' => ['nullable', 'string', 'max:40', Rule::unique('patients', 'patient_code')->ignore($patient?->id)],
            'name' => [$patient ? 'sometimes' : 'required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($patient?->user?->id)],
            'phone' => ['nullable', 'string', 'max:40'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'bloodGroup' => ['nullable', 'string', 'max:5'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergencyContact' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive', 'Admitted'])],
            'department' => ['nullable', 'string', 'max:120'],
            'registeredDate' => ['nullable', 'date'],
            'lastVisit' => ['nullable', 'date'],
        ];

        $validated = $request->validate($rules);

        return collect($validated)->mapWithKeys(fn ($value, $key) => [match ($key) {
            'patientCode' => 'patient_code',
            'bloodGroup' => 'blood_group',
            'emergencyContact' => 'emergency_contact',
            'registeredDate' => 'registered_date',
            'lastVisit' => 'last_visit',
            default => $key,
        } => $value])->all();
    }
}
