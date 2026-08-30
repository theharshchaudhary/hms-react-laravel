<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ScopesToDoctor
{
    /**
     * When the caller is a doctor login linked to a doctor profile, constrain the
     * query to rows belonging to that doctor via the given column. No-op otherwise.
     */
    protected function scopeToDoctor(Builder $query, Request $request, string $column = 'doctor_id'): Builder
    {
        $doctorId = $request->user()?->scopedDoctorId();

        if ($doctorId) {
            $query->where($column, $doctorId);
        }

        return $query;
    }

    protected function currentDoctorId(Request $request): ?int
    {
        return $request->user()?->scopedDoctorId();
    }
}
