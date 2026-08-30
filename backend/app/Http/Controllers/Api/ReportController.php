<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Prescription;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
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
                'value' => Doctor::where('department', $d->name)->count(),
            ])->values(),
            'appointmentStatus' => collect($statuses)
                ->map(fn ($s) => ['label' => $s, 'value' => (int) ($statusCounts[$s] ?? 0)])
                ->filter(fn ($row) => $row['value'] > 0)
                ->values(),
        ]);
    }

    /**
     * Downloadable PDF report. ?type=revenue|appointments|departments|demographics|doctors|prescriptions
     */
    public function pdf(Request $request)
    {
        $type = $request->query('type', 'revenue');

        [$title, $columns, $rows] = match ($type) {
            'appointments' => $this->appointmentsReport(),
            'departments' => $this->departmentsReport(),
            'demographics' => $this->demographicsReport(),
            'doctors' => $this->doctorsReport(),
            'prescriptions' => $this->prescriptionsReport(),
            default => $this->revenueReport(),
        };

        $pdf = Pdf::loadView('pdf.report', compact('title', 'columns', 'rows'))->setPaper('a4');

        return $pdf->download(str($title)->slug().'-'.now()->format('Y-m-d').'.pdf');
    }

    private function revenueReport(): array
    {
        $rows = Invoice::orderBy('date')->get()->map(fn ($i) => [
            $i->invoice_number, $i->patient_name, optional($i->date)->format('Y-m-d'),
            '$'.number_format((float) $i->amount, 2), '$'.number_format((float) $i->paid_amount, 2), $i->status,
        ])->all();

        return ['Revenue Report', ['Invoice', 'Patient', 'Date', 'Amount', 'Paid', 'Status'], $rows];
    }

    private function appointmentsReport(): array
    {
        $rows = Appointment::orderBy('date')->orderBy('time')->get()->map(fn ($a) => [
            optional($a->date)->format('Y-m-d'), $a->time, $a->patient_name, $a->doctor_name, $a->department, $a->type, $a->status,
        ])->all();

        return ['Appointment Analytics', ['Date', 'Time', 'Patient', 'Doctor', 'Department', 'Type', 'Status'], $rows];
    }

    private function departmentsReport(): array
    {
        $rows = Department::orderBy('name')->get()->map(fn ($d) => [
            $d->name, $d->head,
            (string) Doctor::where('department', $d->name)->count(),
            (string) $d->total_beds,
            (string) Patient::where('department', $d->name)->where('status', 'Admitted')->count(),
        ])->all();

        return ['Department Utilization', ['Department', 'Head', 'Doctors', 'Beds', 'Occupied'], $rows];
    }

    private function demographicsReport(): array
    {
        $byGender = Patient::selectRaw('gender, count(*) c')->groupBy('gender')->pluck('c', 'gender');
        $byBlood = Patient::selectRaw('blood_group, count(*) c')->groupBy('blood_group')->pluck('c', 'blood_group');
        $rows = [];
        foreach ($byGender as $g => $c) {
            $rows[] = ['Gender', $g ?: '—', (string) $c];
        }
        foreach ($byBlood as $b => $c) {
            $rows[] = ['Blood group', $b ?: '—', (string) $c];
        }

        return ['Patient Demographics Report', ['Category', 'Value', 'Count'], $rows];
    }

    private function doctorsReport(): array
    {
        $rows = Doctor::orderByDesc('rating')->get()->map(fn ($d) => [
            $d->name, $d->specialization, $d->department, (string) $d->experience.' yrs',
            number_format((float) $d->rating, 1),
            (string) Appointment::where('doctor_id', $d->id)->whereNotNull('patient_id')->distinct()->count('patient_id'),
        ])->all();

        return ['Doctor Performance', ['Doctor', 'Specialization', 'Department', 'Experience', 'Rating', 'Patients'], $rows];
    }

    private function prescriptionsReport(): array
    {
        $rows = Prescription::orderByDesc('date')->get()->map(fn ($p) => [
            optional($p->date)->format('Y-m-d'), $p->patient_name, $p->doctor_name, $p->diagnosis,
            (string) count($p->medications ?? []), $p->status,
        ])->all();

        return ['Prescription Trends', ['Date', 'Patient', 'Prescriber', 'Diagnosis', 'Meds', 'Status'], $rows];
    }
}
