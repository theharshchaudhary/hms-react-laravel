<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['rating' => 'integer'];
    }
}
