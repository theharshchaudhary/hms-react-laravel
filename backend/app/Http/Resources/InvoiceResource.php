<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'invoiceNumber' => $this->invoice_number,
            'patientName' => $this->patient_name,
            'patientId' => $this->patient_id ? (string) $this->patient_id : '',
            'date' => optional($this->date)->format('Y-m-d'),
            'dueDate' => optional($this->due_date)->format('Y-m-d'),
            'amount' => (float) $this->amount,
            'paidAmount' => (float) $this->paid_amount,
            'status' => $this->status,
            'paymentMethod' => $this->payment_method,
            'items' => collect($this->items ?? [])->map(fn ($i) => [
                'description' => $i['description'] ?? '',
                'quantity' => (int) ($i['quantity'] ?? 0),
                'unitPrice' => (float) ($i['unitPrice'] ?? $i['unit_price'] ?? 0),
                'total' => (float) ($i['total'] ?? 0),
            ])->values(),
        ];
    }
}
