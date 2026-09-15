<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MedicineResource;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MedicineController extends Controller
{
    private const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other'];

    public function index(Request $request)
    {
        $query = Medicine::query()->orderBy('name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        if ($request->boolean('lowStock')) {
            $query->whereColumn('stock_quantity', '<=', 'reorder_level');
        }
        if ($request->boolean('expiringSoon')) {
            $query->whereNotNull('expiry_date')->where('expiry_date', '<=', now()->addDays(60));
        }

        return MedicineResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $medicine = Medicine::create($this->validateData($request));

        return (new MedicineResource($medicine))->response()->setStatusCode(201);
    }

    public function show(Medicine $medicine)
    {
        return new MedicineResource($medicine);
    }

    public function update(Request $request, Medicine $medicine)
    {
        $medicine->update($this->validateData($request, $medicine));

        return new MedicineResource($medicine->fresh());
    }

    public function destroy(Medicine $medicine)
    {
        $medicine->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?Medicine $medicine = null): array
    {
        $validated = $request->validate([
            'name' => [$medicine ? 'sometimes' : 'required', 'string', 'max:255'],
            'genericName' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', Rule::in(self::CATEGORIES)],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:60'],
            'unitPrice' => ['nullable', 'numeric', 'min:0'],
            'stockQuantity' => ['nullable', 'integer', 'min:0'],
            'reorderLevel' => ['nullable', 'integer', 'min:0'],
            'batchNumber' => ['nullable', 'string', 'max:120'],
            'expiryDate' => ['nullable', 'date'],
        ]);

        return collect($validated)->mapWithKeys(fn ($value, $key) => [match ($key) {
            'genericName' => 'generic_name',
            'unitPrice' => 'unit_price',
            'stockQuantity' => 'stock_quantity',
            'reorderLevel' => 'reorder_level',
            'batchNumber' => 'batch_number',
            'expiryDate' => 'expiry_date',
            default => $key,
        } => $value])->all();
    }
}
