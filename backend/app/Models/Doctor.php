<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
