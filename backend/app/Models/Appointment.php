<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function queueEntry(): HasOne
    {
        return $this->hasOne(QueueEntry::class);
    }

    /**
     * Is there already a live appointment for this doctor at this date + time?
     */
    public static function slotTaken(int $doctorId, string $date, string $time, ?int $ignoreId = null): bool
    {
        return static::query()
            ->where('doctor_id', $doctorId)
            ->whereDate('date', $date)
            ->where('time', $time)
            ->whereNotIn('status', ['Cancelled', 'No Show'])
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists();
    }
}
