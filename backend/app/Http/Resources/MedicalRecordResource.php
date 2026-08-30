<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicalRecordResource extends JsonResource
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
            'doctorName' => $this->doctor_name,
            'date' => optional($this->date)->format('Y-m-d'),
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'attachments' => (int) $this->attachments,
            'status' => $this->status,
        ];
    }
}
