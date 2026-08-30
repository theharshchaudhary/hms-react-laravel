<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::query()->latest('date')->latest('id');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($patientId = $request->query('patientId')) {
            $query->where('patient_id', $patientId);
        }

        return InvoiceResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request, true);

        $invoice = new Invoice([
            'invoice_number' => $validated['invoiceNumber'] ?? Invoice::generateNumber(),
            'patient_id' => $validated['patientId'] ?? null,
            'patient_name' => $validated['patientName']
                ?? ($validated['patientId'] ?? null ? optional(Patient::find($validated['patientId']))->name : null)
                ?? 'Unknown',
            'date' => $validated['date'] ?? now()->toDateString(),
            'due_date' => $validated['dueDate'] ?? now()->addDays(30)->toDateString(),
            'paid_amount' => $validated['paidAmount'] ?? 0,
            'payment_method' => $validated['paymentMethod'] ?? null,
            'items' => $this->normaliseItems($validated['items'] ?? []),
        ]);

        $invoice->recalculate();
        if (! empty($validated['status'])) {
            $invoice->status = $validated['status'];
        }
        $invoice->save();

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    public function show(Invoice $invoice)
    {
        return new InvoiceResource($invoice);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validated = $this->validatePayload($request, false);

        foreach ([
            'patientName' => 'patient_name',
            'date' => 'date',
            'dueDate' => 'due_date',
            'paidAmount' => 'paid_amount',
            'paymentMethod' => 'payment_method',
        ] as $in => $col) {
            if (array_key_exists($in, $validated)) {
                $invoice->{$col} = $validated[$in];
            }
        }

        if (array_key_exists('items', $validated)) {
            $invoice->items = $this->normaliseItems($validated['items']);
        }

        $invoice->recalculate();
        if (! empty($validated['status'])) {
            $invoice->status = $validated['status'];
        }
        $invoice->save();

        return new InvoiceResource($invoice->fresh());
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $isCreate): array
    {
        return $request->validate([
            'invoiceNumber' => ['nullable', 'string', 'max:40', Rule::unique('invoices', 'invoice_number')->ignore($request->route('invoice'))],
            'patientId' => ['nullable', 'exists:patients,id'],
            'patientName' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'dueDate' => ['nullable', 'date'],
            'paidAmount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(['Paid', 'Pending', 'Overdue', 'Partial'])],
            'paymentMethod' => ['nullable', Rule::in(['Cash', 'Card', 'Insurance', 'Online'])],
            'items' => [$isCreate ? 'required' : 'sometimes', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unitPrice' => ['required', 'numeric', 'min:0'],
            'items.*.total' => ['nullable', 'numeric', 'min:0'],
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function normaliseItems(array $items): array
    {
        return collect($items)->map(function ($i) {
            $qty = (int) ($i['quantity'] ?? 1);
            $unit = (float) ($i['unitPrice'] ?? 0);

            return [
                'description' => $i['description'] ?? '',
                'quantity' => $qty,
                'unitPrice' => $unit,
                'total' => isset($i['total']) ? (float) $i['total'] : round($qty * $unit, 2),
            ];
        })->values()->all();
    }
}
