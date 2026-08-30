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
            // Derived from live data; total_beds stays the stored capacity.
            'totalDoctors' => (int) \App\Models\Doctor::where('department', $this->name)->count(),
            'totalBeds' => (int) $this->total_beds,
            'occupiedBeds' => (int) \App\Models\Patient::where('department', $this->name)
                ->where('status', 'Admitted')->count(),
            'location' => $this->location,
            'phone' => $this->phone,
            'icon' => $this->icon,
        ];
    }
}
