<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDoctor;
use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\QueueEntryResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\QueueEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    use ScopesToDoctor;

    public function index(Request $request)
    {
        $query = Appointment::query()->orderBy('date')->orderBy('time');
        $this->scopeToDoctor($query, $request);

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
        $data = $this->validateData($request);
        $this->assertSlotFree($data['doctor_id'], $data['date'], $data['time']);

        $appointment = Appointment::create($data);

        return (new AppointmentResource($appointment))->response()->setStatusCode(201);
    }

    public function show(Appointment $appointment)
    {
        return new AppointmentResource($appointment);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $data = $this->validateData($request, $appointment);
        $this->assertSlotFree(
            $data['doctor_id'] ?? $appointment->doctor_id,
            $data['date'] ?? $appointment->date->format('Y-m-d'),
            $data['time'] ?? $appointment->time,
            $appointment->id,
        );

        $wasCompleted = $appointment->status === 'Completed';
        $appointment->update($data);

        if (! $wasCompleted && $appointment->status === 'Completed') {
            $this->onCompleted($appointment);
        }

        return new AppointmentResource($appointment->fresh());
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return response()->noContent();
    }

    /**
     * Turn a scheduled appointment into a live queue token for today.
     */
    public function checkIn(Request $request, Appointment $appointment)
    {
        if (in_array($appointment->status, ['Completed', 'Cancelled', 'No Show'], true)) {
            throw ValidationException::withMessages(['appointment' => ['This appointment cannot be checked in.']]);
        }

        $entry = $appointment->queueEntry()->first() ?? QueueEntry::create([
            'token_number' => (int) QueueEntry::max('token_number') + 1,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'appointment_id' => $appointment->id,
            'patient_name' => $appointment->patient_name,
            'doctor_name' => $appointment->doctor_name,
            'department' => $appointment->department,
            'priority' => $appointment->type === 'Emergency' ? 'Emergency' : 'Normal',
            'status' => 'Waiting',
            'check_in_time' => now()->format('H:i'),
            'estimated_wait' => 15,
        ]);

        if ($appointment->status === 'Scheduled') {
            $appointment->update(['status' => 'Confirmed']);
        }

        return (new QueueEntryResource($entry))->response()->setStatusCode(201);
    }

    private function assertSlotFree(?int $doctorId, ?string $date, ?string $time, ?int $ignoreId = null): void
    {
        if ($doctorId && $date && $time && Appointment::slotTaken($doctorId, $date, $time, $ignoreId)) {
            throw ValidationException::withMessages([
                'time' => ['That doctor already has an appointment at this date and time.'],
            ]);
        }
    }

    public static function onCompleted(Appointment $appointment): void
    {
        if ($appointment->patient) {
            $appointment->patient->update(['last_visit' => now()->toDateString()]);
        }
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
