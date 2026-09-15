<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'unit_price' => 'float',
            'stock_quantity' => 'integer',
            'reorder_level' => 'integer',
            'expiry_date' => 'date:Y-m-d',
        ];
    }

    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->reorder_level;
    }

    public function isExpiringSoon(): bool
    {
        return $this->expiry_date && $this->expiry_date->isBefore(now()->addDays(60));
    }
}
