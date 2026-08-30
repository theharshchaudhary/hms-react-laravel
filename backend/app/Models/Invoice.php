<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'amount' => 'float',
            'paid_amount' => 'float',
            'items' => 'array',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public static function generateNumber(): string
    {
        $year = now()->format('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;

        return sprintf('INV-%s-%03d', $year, $count);
    }

    /**
     * Keep amount / status coherent with the line items and payment.
     */
    public function recalculate(): void
    {
        $items = collect($this->items ?? []);
        $this->amount = round($items->sum(fn ($i) => (float) ($i['total'] ?? 0)), 2);

        if ($this->paid_amount <= 0) {
            $this->status = $this->due_date && $this->due_date->isPast() ? 'Overdue' : 'Pending';
        } elseif ($this->paid_amount >= $this->amount && $this->amount > 0) {
            $this->status = 'Paid';
        } else {
            $this->status = 'Partial';
        }
    }
}
