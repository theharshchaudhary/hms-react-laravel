<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'experience' => 'integer',
            'rating' => 'float',
            'total_patients' => 'integer',
        ];
    }
}
