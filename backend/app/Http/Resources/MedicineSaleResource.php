<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineSaleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'saleNumber' => $this->sale_number,
            'patientId' => $this->patient_id ? (string) $this->patient_id : null,
            'customerName' => $this->customer_name,
            'customerPhone' => $this->customer_phone,
            'servedBy' => $this->whenLoaded('servedBy', fn () => $this->servedBy?->name, $this->servedBy?->name),
            'date' => optional($this->date)->format('Y-m-d'),
            'items' => collect($this->items ?? [])->map(fn ($i) => [
                'medicineId' => $i['medicineId'] ?? null,
                'name' => $i['name'] ?? '',
                'unit' => $i['unit'] ?? '',
                'unitPrice' => (float) ($i['unitPrice'] ?? 0),
                'quantity' => (int) ($i['quantity'] ?? 0),
                'total' => (float) ($i['total'] ?? 0),
            ])->values(),
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'tax' => (float) $this->tax,
            'total' => (float) $this->total,
            'paidAmount' => (float) $this->paid_amount,
            'paymentMethod' => $this->payment_method,
            'status' => $this->status,
            'notes' => $this->notes,
        ];
    }
}
