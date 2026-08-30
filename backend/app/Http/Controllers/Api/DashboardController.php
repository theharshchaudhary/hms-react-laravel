<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function overview()
    {
        $today = Carbon::today()->toDateString();

        $statuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
        $statusCounts = Appointment::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $weekStart = Carbon::now()->startOfWeek();
        $weekly = collect(range(0, 6))->map(function ($offset) use ($weekStart) {
            $day = $weekStart->copy()->addDays($offset);

            return [
                'label' => $day->format('D'),
                'value' => Appointment::whereDate('date', $day->toDateString())->count(),
            ];
        });

        $monthly = collect(range(5, 0))->map(function ($back) {
            $month = Carbon::now()->startOfMonth()->subMonthsNoOverflow($back);

            return [
                'label' => $month->format('M'),
                'value' => round((float) Invoice::whereYear('date', $month->year)
                    ->whereMonth('date', $month->month)
                    ->sum('paid_amount'), 2),
            ];
        })->values();

        $todaysAppointments = Appointment::whereDate('date', $today)
            ->orderBy('time')
            ->get();

        return response()->json([
            'totalPatients' => Patient::count(),
            'admittedPatients' => Patient::where('status', 'Admitted')->count(),
            'todayAppointments' => $todaysAppointments->count(),
            'totalAppointments' => Appointment::count(),
            'activeDoctors' => Doctor::where('availability', 'Available')->count(),
            'totalDoctors' => Doctor::count(),
            'totalRevenue' => round((float) Invoice::sum('paid_amount'), 2),
            'pendingRevenue' => round((float) Invoice::selectRaw('coalesce(sum(amount - paid_amount), 0) as due')->value('due'), 2),
            'totalInvoices' => Invoice::count(),
            'appointmentStatus' => collect($statuses)
                ->map(fn ($s) => ['label' => $s, 'value' => (int) ($statusCounts[$s] ?? 0)])
                ->filter(fn ($row) => $row['value'] > 0)
                ->values(),
            'weeklyAppointments' => $weekly,
            'monthlyRevenue' => $monthly,
            'todaysAppointmentsList' => AppointmentResource::collection($todaysAppointments),
        ]);
    }
}
