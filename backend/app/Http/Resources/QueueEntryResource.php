<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QueueEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tokenNumber' => (int) $this->token_number,
            'patientName' => $this->patient_name,
            'patientId' => $this->patient_id ? (string) $this->patient_id : '',
            'doctorName' => $this->doctor_name,
            'department' => $this->department,
            'priority' => $this->priority,
            'status' => $this->status,
            'checkInTime' => $this->check_in_time,
            'estimatedWait' => (int) $this->estimated_wait,
        ];
    }
}
