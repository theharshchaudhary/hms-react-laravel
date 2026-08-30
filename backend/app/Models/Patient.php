<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'registered_date' => 'date:Y-m-d',
            'last_visit' => 'date:Y-m-d',
        ];
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public static function generateCode(): string
    {
        $year = now()->format('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;

        return sprintf('PT-%s-%03d', $year, $count);
    }
}
