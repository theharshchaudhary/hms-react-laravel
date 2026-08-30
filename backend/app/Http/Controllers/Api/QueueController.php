<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDoctor;
use App\Http\Controllers\Controller;
use App\Http\Resources\QueueEntryResource;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\QueueEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class QueueController extends Controller
{
    use ScopesToDoctor;

    public function index(Request $request)
    {
        $query = QueueEntry::query()->orderBy('token_number');
        $this->scopeToDoctor($query, $request);

        return QueueEntryResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patientId' => ['nullable', 'exists:patients,id'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'doctorId' => ['nullable', 'exists:doctors,id'],
            'doctorName' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::in(['Normal', 'Urgent', 'Emergency'])],
            'status' => ['nullable', Rule::in(['Waiting', 'In Consultation', 'Done', 'Skipped'])],
            'tokenNumber' => ['nullable', 'integer', 'min:1'],
            'checkInTime' => ['nullable', 'string', 'max:5'],
            'estimatedWait' => ['nullable', 'integer', 'min:0'],
        ]);

        $doctor = ! empty($validated['doctorId']) ? Doctor::find($validated['doctorId']) : null;

        $patientName = $validated['patientName'] ?? null;
        if (! $patientName && ! empty($validated['patientId'])) {
            $patientName = optional(Patient::find($validated['patientId']))->name;
        }

        $entry = QueueEntry::create([
            'token_number' => $validated['tokenNumber'] ?? ((int) QueueEntry::max('token_number') + 1),
            'patient_id' => $validated['patientId'] ?? null,
            'doctor_id' => $doctor?->id ?? $this->currentDoctorId($request),
            'patient_name' => $patientName ?? 'Walk-in',
            'doctor_name' => $doctor?->name ?? $validated['doctorName'] ?? null,
            'department' => $doctor?->department ?? $validated['department'] ?? null,
            'priority' => $validated['priority'] ?? 'Normal',
            'status' => $validated['status'] ?? 'Waiting',
            'check_in_time' => $validated['checkInTime'] ?? now()->format('H:i'),
            'estimated_wait' => $validated['estimatedWait'] ?? 15,
        ]);

        return (new QueueEntryResource($entry))->response()->setStatusCode(201);
    }

    public function update(Request $request, QueueEntry $queue)
    {
        $validated = $request->validate([
            'priority' => ['sometimes', Rule::in(['Normal', 'Urgent', 'Emergency'])],
            'status' => ['sometimes', Rule::in(['Waiting', 'In Consultation', 'Done', 'Skipped'])],
            'tokenNumber' => ['sometimes', 'integer', 'min:1'],
            'estimatedWait' => ['sometimes', 'integer', 'min:0'],
            'doctorName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'department' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $map = [
            'priority' => 'priority',
            'status' => 'status',
            'tokenNumber' => 'token_number',
            'estimatedWait' => 'estimated_wait',
            'doctorName' => 'doctor_name',
            'department' => 'department',
        ];

        foreach ($map as $in => $col) {
            if (array_key_exists($in, $validated)) {
                $queue->{$col} = $validated[$in];
            }
        }

        $queue->save();

        // Keep a linked appointment's status in step with the queue.
        if (array_key_exists('status', $validated) && $queue->appointment) {
            $appt = $queue->appointment;
            if ($validated['status'] === 'In Consultation' && $appt->status !== 'Completed') {
                $appt->update(['status' => 'In Progress']);
            } elseif ($validated['status'] === 'Done' && $appt->status !== 'Completed') {
                $appt->update(['status' => 'Completed']);
                AppointmentController::onCompleted($appt);
            }
        }

        return new QueueEntryResource($queue->fresh());
    }

    /**
     * Atomically re-number the queue from an ordered list of ids.
     */
    public function reorder(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:queue_entries,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['ids'] as $i => $id) {
                QueueEntry::whereKey($id)->update(['token_number' => $i + 1]);
            }
        });

        return QueueEntryResource::collection(QueueEntry::query()->orderBy('token_number')->get());
    }
}
