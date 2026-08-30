<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QueueEntryResource;
use App\Models\Patient;
use App\Models\QueueEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QueueController extends Controller
{
    public function index()
    {
        return QueueEntryResource::collection(QueueEntry::query()->orderBy('token_number')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patientId' => ['nullable', 'exists:patients,id'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'doctorName' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::in(['Normal', 'Urgent', 'Emergency'])],
            'status' => ['nullable', Rule::in(['Waiting', 'In Consultation', 'Done', 'Skipped'])],
            'tokenNumber' => ['nullable', 'integer', 'min:1'],
            'checkInTime' => ['nullable', 'string', 'max:5'],
            'estimatedWait' => ['nullable', 'integer', 'min:0'],
        ]);

        $patientName = $validated['patientName'] ?? null;
        if (! $patientName && ! empty($validated['patientId'])) {
            $patientName = optional(Patient::find($validated['patientId']))->name;
        }

        $entry = QueueEntry::create([
            'token_number' => $validated['tokenNumber'] ?? ((int) QueueEntry::max('token_number') + 1),
            'patient_id' => $validated['patientId'] ?? null,
            'patient_name' => $patientName ?? 'Walk-in',
            'doctor_name' => $validated['doctorName'] ?? null,
            'department' => $validated['department'] ?? null,
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

        return new QueueEntryResource($queue->fresh());
    }
}
