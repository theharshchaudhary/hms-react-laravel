<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\MedicalRecordResource;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Prescription;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Patient self-service portal. Every action is scoped to the logged-in
 * patient's own clinical record.
 */
class PortalController extends Controller
{
    private function patient(Request $request): Patient
    {
        $patient = $request->user()->patient;

        abort_if(! $patient, 409, 'No patient record is linked to this account.');

        return $patient;
    }

    public function dashboard(Request $request)
    {
        $patient = $this->patient($request);
        $today = Carbon::today()->toDateString();

        $upcoming = $patient->appointments()
            ->whereDate('date', '>=', $today)
            ->whereNotIn('status', ['Cancelled', 'Completed', 'No Show'])
            ->orderBy('date')->orderBy('time')
            ->get();

        return response()->json([
            'patient' => $this->patientPayload($patient),
            'upcomingAppointments' => AppointmentResource::collection($upcoming),
            'stats' => [
                'upcomingAppointments' => $upcoming->count(),
                'activePrescriptions' => $patient->prescriptions()->where('status', 'Active')->count(),
                'medicalRecords' => $patient->medicalRecords()->count(),
                'outstandingBalance' => round((float) $patient->invoices()
                    ->selectRaw('coalesce(sum(amount - paid_amount), 0) as due')->value('due'), 2),
            ],
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json($this->patientPayload($this->patient($request)));
    }

    public function updateProfile(Request $request)
    {
        $patient = $this->patient($request);
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:40'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'bloodGroup' => ['nullable', 'string', 'max:5'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergencyContact' => ['nullable', 'string', 'max:40'],
        ]);

        $patient->fill(array_filter([
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'gender' => $data['gender'] ?? null,
            'age' => $data['age'] ?? null,
            'blood_group' => $data['bloodGroup'] ?? null,
            'address' => $data['address'] ?? null,
            'emergency_contact' => $data['emergencyContact'] ?? null,
        ], fn ($v) => $v !== null))->save();

        $user->fill(array_filter([
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
        ], fn ($v) => $v !== null))->save();

        return response()->json($this->patientPayload($patient->fresh()));
    }

    public function appointments(Request $request)
    {
        $appointments = $this->patient($request)->appointments()
            ->orderByDesc('date')->orderByDesc('time')->get();

        return AppointmentResource::collection($appointments);
    }

    public function storeAppointment(Request $request)
    {
        $patient = $this->patient($request);

        $data = $request->validate([
            'doctorId' => ['required', 'exists:doctors,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'time' => ['required', 'string', 'max:5'],
            'type' => ['nullable', Rule::in(['Consultation', 'Follow-up', 'Emergency', 'Check-up', 'Surgery'])],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $doctor = Doctor::findOrFail($data['doctorId']);

        if ($doctor->availability === 'On Leave') {
            throw ValidationException::withMessages(['doctorId' => ['This doctor is currently on leave. Please choose another.']]);
        }
        if (Appointment::slotTaken($doctor->id, $data['date'], $data['time'])) {
            throw ValidationException::withMessages(['time' => ['That time slot is already booked. Please pick another.']]);
        }

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'patient_name' => $patient->name,
            'doctor_name' => $doctor->name,
            'department' => $doctor->department,
            'date' => $data['date'],
            'time' => $data['time'],
            'type' => $data['type'] ?? 'Consultation',
            'status' => 'Scheduled',
            'reason' => $data['reason'],
        ]);

        return (new AppointmentResource($appointment))->response()->setStatusCode(201);
    }

    public function updateAppointment(Request $request, Appointment $appointment)
    {
        $patient = $this->patient($request);
        abort_unless($appointment->patient_id === $patient->id, 403);

        if (in_array($appointment->status, ['In Progress', 'Completed', 'Cancelled', 'No Show'], true)) {
            throw ValidationException::withMessages(['appointment' => ['This appointment can no longer be changed. Please call the front desk.']]);
        }

        $data = $request->validate([
            'date' => ['sometimes', 'date', 'after_or_equal:today'],
            'time' => ['sometimes', 'string', 'max:5'],
            'reason' => ['sometimes', 'string', 'max:500'],
            'action' => ['sometimes', Rule::in(['cancel'])],
        ]);

        if (($data['action'] ?? null) === 'cancel') {
            $appointment->status = 'Cancelled';
        } else {
            $newDate = $data['date'] ?? $appointment->date->format('Y-m-d');
            $newTime = $data['time'] ?? $appointment->time;
            if (Appointment::slotTaken($appointment->doctor_id, $newDate, $newTime, $appointment->id)) {
                throw ValidationException::withMessages(['time' => ['That time slot is already booked. Please pick another.']]);
            }
            $appointment->fill(array_filter([
                'date' => $data['date'] ?? null,
                'time' => $data['time'] ?? null,
                'reason' => $data['reason'] ?? null,
            ], fn ($v) => $v !== null));
            // A patient-edited appointment goes back to "Scheduled" for staff to re-confirm.
            $appointment->status = 'Scheduled';
        }

        $appointment->save();

        return new AppointmentResource($appointment->fresh());
    }

    public function prescriptions(Request $request)
    {
        return PrescriptionResource::collection(
            $this->patient($request)->prescriptions()->latest('date')->latest('id')->get()
        );
    }

    public function requestRefill(Request $request, Prescription $prescription)
    {
        $patient = $this->patient($request);
        abort_unless($prescription->patient_id === $patient->id, 403);

        if ($prescription->status !== 'Active') {
            throw ValidationException::withMessages(['prescription' => ['Only active prescriptions can be refilled.']]);
        }

        $prescription->update([
            'refill_requested' => true,
            'refill_requested_at' => now(),
        ]);

        return new PrescriptionResource($prescription->fresh());
    }

    public function records(Request $request)
    {
        return MedicalRecordResource::collection(
            $this->patient($request)->medicalRecords()->latest('date')->latest('id')->get()
        );
    }

    public function invoices(Request $request)
    {
        return InvoiceResource::collection(
            $this->patient($request)->invoices()->latest('date')->latest('id')->get()
        );
    }

    public function invoicePdf(Request $request, Invoice $invoice)
    {
        abort_unless($invoice->patient_id === $this->patient($request)->id, 403);

        return $this->renderInvoicePdf($invoice);
    }

    public static function renderInvoicePdf(Invoice $invoice)
    {
        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'balance' => round($invoice->amount - $invoice->paid_amount, 2),
        ])->setPaper('a4');

        return $pdf->download("{$invoice->invoice_number}.pdf");
    }

    /**
     * @return array<string, mixed>
     */
    private function patientPayload(Patient $patient): array
    {
        return [
            'id' => (string) $patient->id,
            'patientCode' => $patient->patient_code,
            'name' => $patient->name,
            'email' => $patient->email,
            'phone' => $patient->phone,
            'gender' => $patient->gender,
            'age' => (int) $patient->age,
            'bloodGroup' => $patient->blood_group,
            'address' => $patient->address,
            'emergencyContact' => $patient->emergency_contact,
            'status' => $patient->status,
            'registeredDate' => optional($patient->registered_date)->format('Y-m-d'),
            'lastVisit' => optional($patient->last_visit)->format('Y-m-d'),
        ];
    }
}
