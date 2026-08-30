<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
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
            'phone' => $this->phone,
            'specialization' => $this->specialization,
            'department' => $this->department,
            'experience' => (int) $this->experience,
            'qualification' => $this->qualification,
            'availability' => $this->availability,
            'rating' => (float) $this->rating,
            // Derived: distinct patients this doctor has seen.
            'totalPatients' => (int) \App\Models\Appointment::where('doctor_id', $this->id)
                ->whereNotNull('patient_id')->distinct()->count('patient_id'),
            'avatar' => $this->avatar,
            'bio' => $this->bio,
        ];
    }
}
