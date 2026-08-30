<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $query = Patient::query()->latest('id');

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
        $patient->update($this->validateData($request, $patient));

        return new PatientResource($patient->fresh());
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();

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
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'bloodGroup' => ['nullable', 'string', 'max:5'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergencyContact' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive', 'Admitted'])],
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
