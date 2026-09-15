<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MedicineSaleResource;
use App\Models\Medicine;
use App\Models\MedicineSale;
use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MedicineSaleController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicineSale::query()->with('servedBy')->latest('date')->latest('id');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($patientId = $request->query('patientId')) {
            $query->where('patient_id', $patientId);
        }

        return MedicineSaleResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patientId' => ['nullable', 'exists:patients,id'],
            'customerName' => ['required_without:patientId', 'nullable', 'string', 'max:255'],
            'customerPhone' => ['nullable', 'string', 'max:40'],
            'date' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicineId' => ['required', 'exists:medicines,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'paidAmount' => ['nullable', 'numeric', 'min:0'],
            'paymentMethod' => ['nullable', Rule::in(['Cash', 'Card', 'Insurance', 'Online'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $patient = ! empty($validated['patientId']) ? Patient::find($validated['patientId']) : null;

        $sale = DB::transaction(function () use ($request, $validated, $patient) {
            $items = [];

            foreach ($validated['items'] as $line) {
                // Lock the row so two concurrent sales can't oversell the same stock.
                $medicine = Medicine::whereKey($line['medicineId'])->lockForUpdate()->firstOrFail();
                $qty = (int) $line['quantity'];

                if ($medicine->stock_quantity < $qty) {
                    throw ValidationException::withMessages([
                        'items' => ["Only {$medicine->stock_quantity} unit(s) of \"{$medicine->name}\" left in stock."],
                    ]);
                }

                $items[] = [
                    'medicineId' => (string) $medicine->id,
                    'name' => $medicine->name,
                    'unit' => $medicine->unit,
                    'unitPrice' => (float) $medicine->unit_price,
                    'quantity' => $qty,
                    'total' => round($qty * (float) $medicine->unit_price, 2),
                ];

                $medicine->decrement('stock_quantity', $qty);
            }

            $sale = new MedicineSale([
                // Placeholder; replaced with an id-based number below so concurrent
                // counter sales can never collide on the unique sale_number.
                'sale_number' => 'PENDING-'.Str::uuid(),
                'patient_id' => $patient?->id,
                'customer_name' => $patient?->name ?? $validated['customerName'],
                'customer_phone' => $validated['customerPhone'] ?? $patient?->phone,
                'served_by' => $request->user()->id,
                'date' => $validated['date'] ?? now()->toDateString(),
                'items' => $items,
                'discount' => $validated['discount'] ?? 0,
                'tax' => $validated['tax'] ?? 0,
                'payment_method' => $validated['paymentMethod'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $sale->recalculate();
            $sale->paid_amount = $validated['paidAmount'] ?? $sale->total;
            $sale->recalculate();
            $sale->save();

            $sale->sale_number = sprintf('RX-%s-%04d', now()->format('Y'), $sale->id);
            $sale->save();

            return $sale;
        });

        return (new MedicineSaleResource($sale->load('servedBy')))->response()->setStatusCode(201);
    }

    public function show(MedicineSale $medicineSale)
    {
        return new MedicineSaleResource($medicineSale->load('servedBy'));
    }

    public function update(Request $request, MedicineSale $medicineSale)
    {
        $validated = $request->validate([
            'paidAmount' => ['nullable', 'numeric', 'min:0'],
            'paymentMethod' => ['nullable', Rule::in(['Cash', 'Card', 'Insurance', 'Online'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (array_key_exists('paidAmount', $validated)) {
            $medicineSale->paid_amount = $validated['paidAmount'];
        }
        if (array_key_exists('paymentMethod', $validated)) {
            $medicineSale->payment_method = $validated['paymentMethod'];
        }
        if (array_key_exists('notes', $validated)) {
            $medicineSale->notes = $validated['notes'];
        }

        $medicineSale->recalculate();
        $medicineSale->save();

        return new MedicineSaleResource($medicineSale->fresh()->load('servedBy'));
    }

    public function pdf(MedicineSale $medicineSale)
    {
        return self::renderPdf($medicineSale);
    }

    public static function renderPdf(MedicineSale $medicineSale)
    {
        $pdf = Pdf::loadView('pdf.medicine-sale', [
            'sale' => $medicineSale->load('servedBy'),
            'balance' => round($medicineSale->total - $medicineSale->paid_amount, 2),
        ])->setPaper('a4');

        return $pdf->download("{$medicineSale->sale_number}.pdf");
    }
}
