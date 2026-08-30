<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function index()
    {
        return DepartmentResource::collection(Department::query()->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $department = Department::create($this->validateData($request));

        return (new DepartmentResource($department))->response()->setStatusCode(201);
    }

    public function show(Department $department)
    {
        return new DepartmentResource($department);
    }

    public function update(Request $request, Department $department)
    {
        $department->update($this->validateData($request, $department));

        return new DepartmentResource($department->fresh());
    }

    public function destroy(Department $department)
    {
        $department->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?Department $department = null): array
    {
        $validated = $request->validate([
            'name' => [$department ? 'sometimes' : 'required', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($department?->id)],
            'head' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'totalDoctors' => ['nullable', 'integer', 'min:0'],
            'totalBeds' => ['nullable', 'integer', 'min:0'],
            'occupiedBeds' => ['nullable', 'integer', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'icon' => ['nullable', 'string', 'max:60'],
        ]);

        return collect($validated)->mapWithKeys(fn ($value, $key) => [match ($key) {
            'totalDoctors' => 'total_doctors',
            'totalBeds' => 'total_beds',
            'occupiedBeds' => 'occupied_beds',
            default => $key,
        } => $value])->all();
    }
}
