<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Invoice;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    public function summary()
    {
        $statuses = ['Completed', 'Scheduled', 'Confirmed', 'In Progress', 'Cancelled', 'No Show'];
        $statusCounts = Appointment::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $monthly = collect(range(7, 0))->map(function ($back) {
            $month = Carbon::now()->startOfMonth()->subMonthsNoOverflow($back);

            return [
                'label' => $month->format('M'),
                'value' => round((float) Invoice::whereYear('date', $month->year)
                    ->whereMonth('date', $month->month)
                    ->sum('paid_amount'), 2),
            ];
        })->values();

        $weekStart = Carbon::now()->startOfWeek();
        $weekly = collect(range(0, 6))->map(function ($offset) use ($weekStart) {
            $day = $weekStart->copy()->addDays($offset);

            return [
                'label' => $day->format('D'),
                'value' => Appointment::whereDate('date', $day->toDateString())->count(),
            ];
        });

        return response()->json([
            'totalRevenue' => round((float) Invoice::sum('paid_amount'), 2),
            'totalAppointments' => Appointment::count(),
            'totalDepartments' => Department::count(),
            'avgDoctorRating' => round((float) Doctor::avg('rating'), 2),
            'monthlyRevenue' => $monthly,
            'weeklyAppointments' => $weekly,
            'doctorsPerDepartment' => Department::orderBy('name')->get()->map(fn ($d) => [
                'label' => explode(' ', $d->name)[0],
                'value' => $d->total_doctors ?: Doctor::where('department', $d->name)->count(),
            ])->values(),
            'appointmentStatus' => collect($statuses)
                ->map(fn ($s) => ['label' => $s, 'value' => (int) ($statusCounts[$s] ?? 0)])
                ->filter(fn ($row) => $row['value'] > 0)
                ->values(),
        ]);
    }
}
