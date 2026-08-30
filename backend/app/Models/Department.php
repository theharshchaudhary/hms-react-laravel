<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'total_doctors' => 'integer',
            'total_beds' => 'integer',
            'occupied_beds' => 'integer',
        ];
    }
}
