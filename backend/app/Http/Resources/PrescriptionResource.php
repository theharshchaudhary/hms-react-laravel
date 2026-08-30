<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrescriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'patientName' => $this->patient_name,
            'patientId' => $this->patient_id ? (string) $this->patient_id : '',
            'doctorName' => $this->doctor_name,
            'date' => optional($this->date)->format('Y-m-d'),
            'medications' => collect($this->medications ?? [])->map(fn ($m) => [
                'name' => $m['name'] ?? '',
                'dosage' => $m['dosage'] ?? '',
                'duration' => $m['duration'] ?? '',
                'instructions' => $m['instructions'] ?? '',
            ])->values(),
            'diagnosis' => $this->diagnosis,
            'notes' => $this->notes,
            'status' => $this->status,
        ];
    }
}
