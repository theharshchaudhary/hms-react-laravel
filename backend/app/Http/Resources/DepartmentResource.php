<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'head' => $this->head,
            'description' => $this->description,
            'totalDoctors' => (int) $this->total_doctors,
            'totalBeds' => (int) $this->total_beds,
            'occupiedBeds' => (int) $this->occupied_beds,
            'location' => $this->location,
            'phone' => $this->phone,
            'icon' => $this->icon,
        ];
    }
}
