<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDoctor;
use App\Http\Controllers\Controller;
use App\Http\Resources\MedicalRecordResource;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MedicalRecordController extends Controller
{
    use ScopesToDoctor;

    public function index(Request $request)
    {
        $query = MedicalRecord::query()->latest('date')->latest('id');
        $this->scopeToDoctor($query, $request);

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($patientId = $request->query('patientId')) {
            $query->where('patient_id', $patientId);
        }

        return MedicalRecordResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patientId' => ['nullable', 'exists:patients,id'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'doctorId' => ['nullable', 'exists:doctors,id'],
            'doctorName' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'type' => ['required', Rule::in(['Lab Report', 'Diagnosis', 'Treatment', 'Imaging', 'Vitals'])],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'attachments' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['Normal', 'Critical', 'Under Observation'])],
        ]);

        $doctorId = $validated['doctorId'] ?? $this->currentDoctorId($request);
        $doctorName = $validated['doctorName']
            ?? ($doctorId ? optional(Doctor::find($doctorId))->name : null)
            ?? optional($request->user())->name
            ?? 'Attending Physician';

        $record = MedicalRecord::create([
            'patient_id' => $validated['patientId'] ?? null,
            'doctor_id' => $doctorId,
            'patient_name' => $validated['patientName']
                ?? ($validated['patientId'] ?? null ? optional(Patient::find($validated['patientId']))->name : null)
                ?? 'Unknown',
            'doctor_name' => $doctorName,
            'date' => $validated['date'] ?? now()->toDateString(),
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'attachments' => $validated['attachments'] ?? 0,
            'status' => $validated['status'] ?? 'Normal',
        ]);

        return (new MedicalRecordResource($record))->response()->setStatusCode(201);
    }

    public function show(MedicalRecord $record)
    {
        return new MedicalRecordResource($record);
    }
}
