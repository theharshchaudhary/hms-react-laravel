<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'patientId' => $this->patient_id ? (string) $this->patient_id : '',
            'patientName' => $this->patient_name,
            'doctorId' => $this->doctor_id ? (string) $this->doctor_id : '',
            'doctorName' => $this->doctor_name,
            'department' => $this->department,
            'date' => optional($this->date)->format('Y-m-d'),
            'time' => $this->time,
            'type' => $this->type,
            'status' => $this->status,
            'reason' => $this->reason,
            'notes' => $this->notes,
        ];
    }
}
