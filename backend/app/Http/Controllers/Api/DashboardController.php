<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function overview(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $doctorId = $request->user()?->scopedDoctorId();

        // A doctor's dashboard is scoped to their own work.
        $appts = fn () => Appointment::query()->when($doctorId, fn ($q) => $q->where('doctor_id', $doctorId));
        $rx = fn () => Prescription::query()->when($doctorId, fn ($q) => $q->where('doctor_id', $doctorId));

        $statuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
        $statusCounts = $appts()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $weekStart = Carbon::now()->startOfWeek();
        $weekly = collect(range(0, 6))->map(function ($offset) use ($weekStart, $appts) {
            $day = $weekStart->copy()->addDays($offset);

            return [
                'label' => $day->format('D'),
                'value' => $appts()->whereDate('date', $day->toDateString())->count(),
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

        $todaysAppointments = $appts()->whereDate('date', $today)->orderBy('time')->get();

        // "My patients" for a doctor, all patients otherwise.
        $patientCount = $doctorId
            ? Patient::whereHas('appointments', fn ($q) => $q->where('doctor_id', $doctorId))->count()
            : Patient::count();

        return response()->json([
            'scopedToDoctor' => (bool) $doctorId,
            'totalPatients' => $patientCount,
            'admittedPatients' => Patient::where('status', 'Admitted')->count(),
            'todayAppointments' => $todaysAppointments->count(),
            'totalAppointments' => $appts()->count(),
            'activeDoctors' => Doctor::where('availability', 'Available')->count(),
            'totalDoctors' => Doctor::count(),
            'pendingRefills' => $rx()->where('refill_requested', true)->count(),
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
