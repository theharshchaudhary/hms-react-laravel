<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrescriptionResource;
use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PrescriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Prescription::query()->latest('date')->latest('id');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($patientId = $request->query('patientId')) {
            $query->where('patient_id', $patientId);
        }

        return PrescriptionResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $prescription = Prescription::create($this->validateData($request));

        return (new PrescriptionResource($prescription))->response()->setStatusCode(201);
    }

    public function show(Prescription $prescription)
    {
        return new PrescriptionResource($prescription);
    }

    public function update(Request $request, Prescription $prescription)
    {
        $prescription->update($this->validateData($request, $prescription));

        return new PrescriptionResource($prescription->fresh());
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?Prescription $prescription = null): array
    {
        $isCreate = ! $prescription;

        $validated = $request->validate([
            'patientId' => ['nullable', 'exists:patients,id'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'doctorName' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'medications' => [$isCreate ? 'required' : 'sometimes', 'array', 'min:1'],
            'medications.*.name' => ['required', 'string', 'max:255'],
            'medications.*.dosage' => ['nullable', 'string', 'max:120'],
            'medications.*.duration' => ['nullable', 'string', 'max:120'],
            'medications.*.instructions' => ['nullable', 'string', 'max:500'],
            'diagnosis' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', Rule::in(['Active', 'Completed', 'Expired'])],
        ]);

        $data = [];
        if (array_key_exists('patientId', $validated)) {
            $data['patient_id'] = $validated['patientId'];
        }
        $data['patient_name'] = $validated['patientName']
            ?? ($validated['patientId'] ?? null ? optional(Patient::find($validated['patientId']))->name : null)
            ?? $prescription?->patient_name
            ?? 'Unknown';

        foreach (['doctorName' => 'doctor_name', 'date' => 'date', 'medications' => 'medications',
            'diagnosis' => 'diagnosis', 'notes' => 'notes', 'status' => 'status'] as $in => $col) {
            if (array_key_exists($in, $validated)) {
                $data[$col] = $validated[$in];
            }
        }

        if ($isCreate) {
            $data['date'] = $data['date'] ?? now()->toDateString();
        }

        return $data;
    }
}
