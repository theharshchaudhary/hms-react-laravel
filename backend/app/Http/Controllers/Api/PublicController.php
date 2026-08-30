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
use Illuminate\Support\Carbon;

class PublicController extends Controller
{
    public function doctors()
    {
        return DoctorResource::collection(Doctor::orderByDesc('rating')->get());
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
