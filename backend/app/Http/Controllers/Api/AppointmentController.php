<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::query()->orderBy('date')->orderBy('time');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($date = $request->query('date')) {
            $query->whereDate('date', $date);
        }
        if ($doctorId = $request->query('doctorId')) {
            $query->where('doctor_id', $doctorId);
        }
        if ($patientId = $request->query('patientId')) {
            $query->where('patient_id', $patientId);
        }

        return AppointmentResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $appointment = Appointment::create($this->validateData($request));

        return (new AppointmentResource($appointment))->response()->setStatusCode(201);
    }

    public function show(Appointment $appointment)
    {
        return new AppointmentResource($appointment);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $appointment->update($this->validateData($request, $appointment));

        return new AppointmentResource($appointment->fresh());
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?Appointment $appointment = null): array
    {
        $isCreate = ! $appointment;

        $validated = $request->validate([
            'patientId' => [$isCreate ? 'required' : 'sometimes', 'nullable', 'exists:patients,id'],
            'doctorId' => [$isCreate ? 'required' : 'sometimes', 'nullable', 'exists:doctors,id'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'doctorName' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'date' => [$isCreate ? 'required' : 'sometimes', 'date'],
            'time' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:5'],
            'type' => ['nullable', Rule::in(['Consultation', 'Follow-up', 'Emergency', 'Check-up', 'Surgery'])],
            'status' => ['nullable', Rule::in(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'])],
            'reason' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $data = [
            'patient_id' => $validated['patientId'] ?? $appointment?->patient_id,
            'doctor_id' => $validated['doctorId'] ?? $appointment?->doctor_id,
        ];

        foreach (['patientName' => 'patient_name', 'doctorName' => 'doctor_name', 'department' => 'department',
            'date' => 'date', 'time' => 'time', 'type' => 'type', 'status' => 'status',
            'reason' => 'reason', 'notes' => 'notes'] as $in => $col) {
            if (array_key_exists($in, $validated)) {
                $data[$col] = $validated[$in];
            }
        }

        // Keep the denormalised names in sync with the referenced records.
        if (! empty($data['patient_id']) && $patient = Patient::find($data['patient_id'])) {
            $data['patient_name'] = $patient->name;
        }
        if (! empty($data['doctor_id']) && $doctor = Doctor::find($data['doctor_id'])) {
            $data['doctor_name'] = $doctor->name;
            $data['department'] = $data['department'] ?? $doctor->department;
        }

        if ($isCreate) {
            $data['patient_name'] = $data['patient_name'] ?? 'Unknown';
            $data['doctor_name'] = $data['doctor_name'] ?? 'Unassigned';
        }

        return $data;
    }
}
