<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'genericName' => $this->generic_name,
            'category' => $this->category,
            'manufacturer' => $this->manufacturer,
            'unit' => $this->unit,
            'unitPrice' => (float) $this->unit_price,
            'stockQuantity' => (int) $this->stock_quantity,
            'reorderLevel' => (int) $this->reorder_level,
            'batchNumber' => $this->batch_number,
            'expiryDate' => optional($this->expiry_date)->format('Y-m-d'),
            'lowStock' => $this->isLowStock(),
            'expiringSoon' => $this->isExpiringSoon(),
        ];
    }
}
