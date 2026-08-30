<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'department' => $this->department,
            'avatar' => $this->avatar ?: $this->initials(),
            'patientId' => $this->patient_id ? (string) $this->patient_id : null,
            'doctorId' => $this->doctor_id ? (string) $this->doctor_id : null,
            'doctorName' => $this->whenLoaded('doctor', fn () => $this->doctor?->name),
            'createdAt' => optional($this->created_at)->toDateString(),
        ];
    }
}
