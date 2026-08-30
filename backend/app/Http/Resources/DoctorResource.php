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
            'totalPatients' => (int) $this->total_patients,
            'avatar' => $this->avatar,
            'bio' => $this->bio,
        ];
    }
}
