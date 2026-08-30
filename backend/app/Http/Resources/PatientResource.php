<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'patientCode' => $this->patient_code,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'age' => (int) $this->age,
            'bloodGroup' => $this->blood_group,
            'address' => $this->address,
            'emergencyContact' => $this->emergency_contact,
            'status' => $this->status,
            'registeredDate' => optional($this->registered_date)->format('Y-m-d'),
            'lastVisit' => optional($this->last_visit)->format('Y-m-d'),
        ];
    }
}
