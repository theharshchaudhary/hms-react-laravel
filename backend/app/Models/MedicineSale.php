<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicineSale extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'items' => 'array',
            'subtotal' => 'float',
            'discount' => 'float',
            'tax' => 'float',
            'total' => 'float',
            'paid_amount' => 'float',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function servedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'served_by');
    }

    /**
     * Recompute totals from the line items and payment, and derive the status.
     */
    public function recalculate(): void
    {
        $items = collect($this->items ?? []);
        $this->subtotal = round($items->sum(fn ($i) => (float) ($i['total'] ?? 0)), 2);
        $this->total = max(0, round($this->subtotal - (float) $this->discount + (float) $this->tax, 2));
        // Paid amounts feed revenue totals, so overpayment (change) is never stored.
        $this->paid_amount = round(min(max(0, (float) $this->paid_amount), $this->total), 2);

        if ($this->paid_amount >= $this->total) {
            $this->status = 'Paid';
        } elseif ($this->paid_amount <= 0) {
            $this->status = 'Pending';
        } else {
            $this->status = 'Partial';
        }
    }
}
