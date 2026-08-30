<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\DoctorResource;
use App\Http\Resources\FacilityResource;
use App\Http\Resources\TestimonialResource;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Facility;
use App\Models\Patient;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PublicController extends Controller
{
    /** Clinic hours: 09:00–16:30, 30-minute slots. */
    private const SLOTS = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ];

    public function doctors()
    {
        return DoctorResource::collection(Doctor::orderByDesc('rating')->get());
    }

    /**
     * Open time slots for a doctor on a given date (for the public booking page).
     */
    public function slots(Request $request, Doctor $doctor)
    {
        $date = $request->query('date', Carbon::today()->toDateString());

        $taken = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('date', $date)
            ->whereNotIn('status', ['Cancelled', 'No Show'])
            ->pluck('time')
            ->all();

        $isPast = Carbon::parse($date)->isPast() && ! Carbon::parse($date)->isToday();

        return response()->json([
            'date' => $date,
            'doctorId' => (string) $doctor->id,
            'doctorName' => $doctor->name,
            'onLeave' => $doctor->availability === 'On Leave',
            'available' => $isPast ? [] : array_values(array_diff(self::SLOTS, $taken)),
            'booked' => $taken,
        ]);
    }

    public function departments()
    {
        return DepartmentResource::collection(Department::orderBy('name')->get());
    }

    public function testimonials()
    {
        return TestimonialResource::collection(Testimonial::latest('id')->get());
    }

    public function facilities()
    {
        return FacilityResource::collection(Facility::orderBy('id')->get());
    }

    public function stats()
    {
        $totalBeds = (int) Department::sum('total_beds');
        $occupied = (int) Department::sum('occupied_beds');

        return response()->json([
            'totalPatients' => Patient::count(),
            'totalDoctors' => Doctor::count(),
            'totalDepartments' => Department::count(),
            'totalBeds' => $totalBeds,
            'satisfactionRate' => round((float) (Testimonial::avg('rating') ?: 5) * 20, 1),
            'yearsOfService' => 25,
            'monthlyAppointments' => Appointment::whereBetween('date', [
                Carbon::now()->startOfMonth()->toDateString(),
                Carbon::now()->endOfMonth()->toDateString(),
            ])->count() ?: Appointment::count(),
            'emergencyResponse' => 4,
        ]);
    }
}
