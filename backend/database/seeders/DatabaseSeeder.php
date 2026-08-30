<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\ContactMessage;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Facility;
use App\Models\Invoice;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\QueueEntry;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedStaff();
        $this->seedDepartments();
        $doctors = $this->seedDoctors();
        $patients = $this->seedPatients();
        $this->seedPatientLogin($patients);
        $this->seedDoctorLogin($doctors);
        $this->seedAppointments($patients, $doctors);
        $this->seedQueue($patients);
        $this->seedPrescriptions($patients, $doctors);
        $this->seedRecords($patients, $doctors);
        $this->seedInvoices($patients);
        $this->seedTestimonials();
        $this->seedFacilities();
        $this->seedInboxData($patients);
    }

    /**
     * A pending refill request and a contact message so the staff inboxes aren't empty.
     *
     * @param  array<string, Patient>  $patients
     */
    private function seedInboxData(array $patients): void
    {
        Prescription::where('patient_id', $patients['p3']->id)->where('status', 'Active')->first()?->update([
            'refill_requested' => true,
            'refill_requested_at' => now()->subDay(),
        ]);

        ContactMessage::updateOrCreate(
            ['email' => 'prospective@example.com'],
            [
                'name' => 'Grace Holloway',
                'phone' => '+1 555-7788',
                'message' => 'Do you accept the BlueShield PPO plan for cardiology consultations? Thank you.',
                'handled' => false,
            ]
        );
    }

    private function seedStaff(): void
    {
        $users = [
            ['name' => 'Olivia Bennett', 'email' => 'super@medicore.com', 'password' => 'super123', 'role' => 'super_admin', 'phone' => '+1 555-0099', 'department' => 'Administration', 'avatar' => 'OB'],
            ['name' => 'Dr. Sarah Chen', 'email' => 'admin@medicore.com', 'password' => 'admin123', 'role' => 'admin', 'phone' => '+1 555-0100', 'department' => 'Administration', 'avatar' => 'SC'],
            ['name' => 'Emily Rodriguez', 'email' => 'reception@medicore.com', 'password' => 'reception123', 'role' => 'receptionist', 'phone' => '+1 555-0102', 'department' => 'Front Desk', 'avatar' => 'ER'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], $user);
        }
    }

    /**
     * @param  array<string, Doctor>  $doctors
     */
    private function seedDoctorLogin(array $doctors): void
    {
        // Demo doctor login, linked to the "Dr. James Wilson" profile.
        $doctor = $doctors['d1'];

        User::updateOrCreate(
            ['email' => 'doctor@medicore.com'],
            [
                'name' => $doctor->name,
                'password' => 'doctor123',
                'role' => 'doctor',
                'phone' => $doctor->phone,
                'department' => $doctor->department,
                'avatar' => $doctor->avatar,
                'doctor_id' => $doctor->id,
            ]
        );
    }

    /**
     * @param  array<string, Patient>  $patients
     */
    private function seedPatientLogin(array $patients): void
    {
        // Demo patient portal account, linked to Michael Johnson's clinical record.
        $patient = $patients['p1'];

        User::updateOrCreate(
            ['email' => 'patient@medicore.com'],
            [
                'name' => $patient->name,
                'password' => 'patient123',
                'role' => 'patient',
                'phone' => $patient->phone,
                'patient_id' => $patient->id,
            ]
        );

        $patient->update(['email' => 'patient@medicore.com']);
    }

    private function seedDepartments(): void
    {
        $departments = [
            ['name' => 'Cardiology', 'head' => 'Dr. James Wilson', 'description' => 'Comprehensive heart and cardiovascular care with state-of-the-art diagnostic and treatment facilities.', 'total_doctors' => 8, 'total_beds' => 40, 'occupied_beds' => 32, 'location' => 'Block A, 3rd Floor', 'phone' => '+1 555-3001', 'icon' => 'HeartPulse'],
            ['name' => 'Neurology', 'head' => 'Dr. Sarah Chen', 'description' => 'Diagnosis and treatment of disorders of the nervous system including stroke and epilepsy.', 'total_doctors' => 6, 'total_beds' => 30, 'occupied_beds' => 21, 'location' => 'Block B, 2nd Floor', 'phone' => '+1 555-3002', 'icon' => 'Brain'],
            ['name' => 'Orthopedics', 'head' => 'Dr. Michael Brown', 'description' => 'Treatment of musculoskeletal injuries and conditions including joint replacement surgery.', 'total_doctors' => 7, 'total_beds' => 35, 'occupied_beds' => 28, 'location' => 'Block C, 1st Floor', 'phone' => '+1 555-3003', 'icon' => 'Bone'],
            ['name' => 'Pediatrics', 'head' => 'Dr. Jennifer Lee', 'description' => 'Specialized medical care for infants, children, and adolescents up to age 18.', 'total_doctors' => 10, 'total_beds' => 50, 'occupied_beds' => 35, 'location' => 'Block D, 4th Floor', 'phone' => '+1 555-3004', 'icon' => 'Baby'],
            ['name' => 'Surgery', 'head' => 'Dr. Robert Kim', 'description' => 'Advanced surgical procedures including general, laparoscopic, and emergency surgery.', 'total_doctors' => 12, 'total_beds' => 45, 'occupied_beds' => 38, 'location' => 'Block A, 1st Floor', 'phone' => '+1 555-3005', 'icon' => 'Stethoscope'],
            ['name' => 'Dermatology', 'head' => 'Dr. Maria Garcia', 'description' => 'Diagnosis and treatment of skin, hair, and nail conditions.', 'total_doctors' => 4, 'total_beds' => 15, 'occupied_beds' => 8, 'location' => 'Block B, 3rd Floor', 'phone' => '+1 555-3006', 'icon' => 'Hand'],
            ['name' => 'Internal Medicine', 'head' => 'Dr. David Park', 'description' => 'Preventive care, diagnosis, and treatment of adult diseases and chronic conditions.', 'total_doctors' => 9, 'total_beds' => 40, 'occupied_beds' => 30, 'location' => 'Block C, 2nd Floor', 'phone' => '+1 555-3007', 'icon' => 'Pill'],
            ['name' => 'Obstetrics & Gynecology', 'head' => 'Dr. Lisa Anderson', 'description' => "Comprehensive women's health, pregnancy care, and reproductive services.", 'total_doctors' => 8, 'total_beds' => 35, 'occupied_beds' => 26, 'location' => 'Block D, 2nd Floor', 'phone' => '+1 555-3008', 'icon' => 'Flower'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(['name' => $department['name']], $department);
        }
    }

    /**
     * @return array<string, Doctor>
     */
    private function seedDoctors(): array
    {
        $doctors = [
            'd1' => ['name' => 'Dr. James Wilson', 'email' => 'j.wilson@medicore.com', 'phone' => '+1 555-2001', 'specialization' => 'Interventional Cardiology', 'department' => 'Cardiology', 'experience' => 15, 'qualification' => 'MD, FACC', 'availability' => 'Available', 'rating' => 4.9, 'total_patients' => 1240, 'avatar' => 'JW', 'bio' => 'Specialist in interventional cardiology with 15+ years treating complex heart conditions.'],
            'd2' => ['name' => 'Dr. Sarah Chen', 'email' => 's.chen@medicore.com', 'phone' => '+1 555-2002', 'specialization' => 'Neurology', 'department' => 'Neurology', 'experience' => 12, 'qualification' => 'MD, PhD', 'availability' => 'Available', 'rating' => 4.8, 'total_patients' => 980, 'avatar' => 'SC', 'bio' => 'Board-certified neurologist focused on stroke care and neurodegenerative disorders.'],
            'd3' => ['name' => 'Dr. Michael Brown', 'email' => 'm.brown@medicore.com', 'phone' => '+1 555-2003', 'specialization' => 'Orthopedic Surgery', 'department' => 'Orthopedics', 'experience' => 18, 'qualification' => 'MD, MS Ortho', 'availability' => 'Busy', 'rating' => 4.7, 'total_patients' => 1560, 'avatar' => 'MB', 'bio' => 'Orthopedic surgeon specializing in joint replacement and sports injuries.'],
            'd4' => ['name' => 'Dr. Jennifer Lee', 'email' => 'j.lee@medicore.com', 'phone' => '+1 555-2004', 'specialization' => 'Pediatrics', 'department' => 'Pediatrics', 'experience' => 10, 'qualification' => 'MD, FAAP', 'availability' => 'Available', 'rating' => 4.9, 'total_patients' => 2100, 'avatar' => 'JL', 'bio' => 'Dedicated pediatrician providing compassionate care for children of all ages.'],
            'd5' => ['name' => 'Dr. Robert Kim', 'email' => 'r.kim@medicore.com', 'phone' => '+1 555-2005', 'specialization' => 'General Surgery', 'department' => 'Surgery', 'experience' => 20, 'qualification' => 'MD, FACS', 'availability' => 'On Leave', 'rating' => 4.8, 'total_patients' => 1800, 'avatar' => 'RK', 'bio' => 'Veteran general surgeon with expertise in minimally invasive procedures.'],
            'd6' => ['name' => 'Dr. Maria Garcia', 'email' => 'm.garcia@medicore.com', 'phone' => '+1 555-2006', 'specialization' => 'Dermatology', 'department' => 'Dermatology', 'experience' => 8, 'qualification' => 'MD, FAAD', 'availability' => 'Available', 'rating' => 4.6, 'total_patients' => 750, 'avatar' => 'MG', 'bio' => 'Dermatologist treating skin conditions and cosmetic dermatology.'],
            'd7' => ['name' => 'Dr. David Park', 'email' => 'd.park@medicore.com', 'phone' => '+1 555-2007', 'specialization' => 'Internal Medicine', 'department' => 'Internal Medicine', 'experience' => 14, 'qualification' => 'MD, FACP', 'availability' => 'Available', 'rating' => 4.7, 'total_patients' => 1320, 'avatar' => 'DP', 'bio' => 'Internist focused on preventive care and chronic disease management.'],
            'd8' => ['name' => 'Dr. Lisa Anderson', 'email' => 'l.anderson@medicore.com', 'phone' => '+1 555-2008', 'specialization' => 'Obstetrics & Gynecology', 'department' => 'Obstetrics & Gynecology', 'experience' => 16, 'qualification' => 'MD, FACOG', 'availability' => 'Busy', 'rating' => 4.9, 'total_patients' => 1650, 'avatar' => 'LA', 'bio' => "OB-GYN providing comprehensive women's health services."],
        ];

        $result = [];
        foreach ($doctors as $key => $doctor) {
            $result[$key] = Doctor::updateOrCreate(['email' => $doctor['email']], $doctor);
        }

        // Flesh out each department so counts look realistic on the public site.
        $first = ['Aaron', 'Bianca', 'Carlos', 'Dana', 'Elena', 'Felix', 'Grace', 'Hassan', 'Ivy', 'Jonah', 'Kira', 'Leo', 'Mona', 'Nate', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Tara', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zane'];
        $last = ['Adler', 'Boyd', 'Cross', 'Diaz', 'Frost', 'Gill', 'Hale', 'Ito', 'Jain', 'Klein', 'Lowe', 'Marsh', 'Nolan', 'Ortiz', 'Pope', 'Reed', 'Shah', 'Tan', 'Vance', 'Ward'];
        $bySpec = [
            'Cardiology' => ['Cardiology', 'Electrophysiology', 'Heart Failure'],
            'Neurology' => ['Neurology', 'Epileptology', 'Movement Disorders'],
            'Orthopedics' => ['Sports Medicine', 'Spine Surgery', 'Joint Replacement'],
            'Pediatrics' => ['General Pediatrics', 'Neonatology', 'Pediatric Cardiology'],
            'Surgery' => ['General Surgery', 'Laparoscopic Surgery', 'Trauma Surgery'],
            'Dermatology' => ['Medical Dermatology', 'Cosmetic Dermatology', 'Dermatopathology'],
            'Internal Medicine' => ['Internal Medicine', 'Endocrinology', 'Rheumatology'],
            'Obstetrics & Gynecology' => ['Obstetrics', 'Gynecologic Oncology', 'Maternal-Fetal Medicine'],
        ];
        $targets = ['Cardiology' => 7, 'Neurology' => 5, 'Orthopedics' => 6, 'Pediatrics' => 9, 'Surgery' => 11, 'Dermatology' => 3, 'Internal Medicine' => 8, 'Obstetrics & Gynecology' => 7];
        $n = 0;
        foreach ($targets as $dept => $count) {
            for ($i = 0; $i < $count; $i++) {
                $name = 'Dr. '.$first[$n % count($first)].' '.$last[($n * 3) % count($last)];
                $n++;
                Doctor::updateOrCreate(
                    ['email' => 'd'.$n.'.staff@medicore.com'],
                    [
                        'name' => $name,
                        'phone' => sprintf('+1 555-2%03d', 100 + $n),
                        'specialization' => $bySpec[$dept][$i % 3],
                        'department' => $dept,
                        'experience' => 5 + ($n % 20),
                        'qualification' => ['MD', 'MD, PhD', 'MD, FACP', 'MBBS, MS'][$n % 4],
                        'availability' => ['Available', 'Available', 'Available', 'Busy', 'On Leave'][$n % 5],
                        'rating' => round(4.3 + ($n % 7) / 10, 1),
                        'avatar' => collect(explode(' ', $name))->slice(1)->take(2)->map(fn ($p) => mb_substr($p, 0, 1))->implode(''),
                        'bio' => "{$bySpec[$dept][$i % 3]} specialist in the {$dept} department.",
                    ]
                );
            }
        }

        return $result;
    }

    /**
     * @return array<string, Patient>
     */
    private function seedPatients(): array
    {
        $patients = [
            'p1' => ['patient_code' => 'PT-2024-001', 'name' => 'Michael Johnson', 'email' => 'michael.j@email.com', 'phone' => '+1 555-1001', 'gender' => 'Male', 'age' => 45, 'blood_group' => 'O+', 'address' => '123 Maple St, Springfield', 'emergency_contact' => '+1 555-1002', 'status' => 'Active', 'registered_date' => '2024-01-15', 'last_visit' => '2024-08-20'],
            'p2' => ['patient_code' => 'PT-2024-002', 'name' => 'Emily Davis', 'email' => 'emily.davis@email.com', 'phone' => '+1 555-1003', 'gender' => 'Female', 'age' => 32, 'blood_group' => 'A+', 'address' => '456 Oak Ave, Riverside', 'emergency_contact' => '+1 555-1004', 'status' => 'Admitted', 'department' => 'Neurology', 'registered_date' => '2024-02-10', 'last_visit' => '2024-08-25'],
            'p3' => ['patient_code' => 'PT-2024-003', 'name' => 'Robert Brown', 'email' => 'robert.b@email.com', 'phone' => '+1 555-1005', 'gender' => 'Male', 'age' => 67, 'blood_group' => 'B+', 'address' => '789 Pine Rd, Lakeside', 'emergency_contact' => '+1 555-1006', 'status' => 'Active', 'registered_date' => '2024-01-20', 'last_visit' => '2024-08-18'],
            'p4' => ['patient_code' => 'PT-2024-004', 'name' => 'Jessica Martinez', 'email' => 'jessica.m@email.com', 'phone' => '+1 555-1007', 'gender' => 'Female', 'age' => 28, 'blood_group' => 'AB+', 'address' => '321 Elm St, Hillcrest', 'emergency_contact' => '+1 555-1008', 'status' => 'Active', 'registered_date' => '2024-03-05', 'last_visit' => '2024-08-22'],
            'p5' => ['patient_code' => 'PT-2024-005', 'name' => 'William Garcia', 'email' => 'william.g@email.com', 'phone' => '+1 555-1009', 'gender' => 'Male', 'age' => 54, 'blood_group' => 'O-', 'address' => '654 Cedar Ln, Brookfield', 'emergency_contact' => '+1 555-1010', 'status' => 'Inactive', 'registered_date' => '2024-02-28', 'last_visit' => '2024-07-15'],
            'p6' => ['patient_code' => 'PT-2024-006', 'name' => 'Olivia Taylor', 'email' => 'olivia.t@email.com', 'phone' => '+1 555-1011', 'gender' => 'Female', 'age' => 41, 'blood_group' => 'A-', 'address' => '987 Birch Dr, Westwood', 'emergency_contact' => '+1 555-1012', 'status' => 'Active', 'registered_date' => '2024-04-12', 'last_visit' => '2024-08-28'],
            'p7' => ['patient_code' => 'PT-2024-007', 'name' => 'David Anderson', 'email' => 'david.a@email.com', 'phone' => '+1 555-1013', 'gender' => 'Male', 'age' => 38, 'blood_group' => 'B-', 'address' => '147 Spruce St, Eastgate', 'emergency_contact' => '+1 555-1014', 'status' => 'Admitted', 'department' => 'Surgery', 'registered_date' => '2024-05-08', 'last_visit' => '2024-08-30'],
            'p8' => ['patient_code' => 'PT-2024-008', 'name' => 'Sophia Thomas', 'email' => 'sophia.t@email.com', 'phone' => '+1 555-1015', 'gender' => 'Female', 'age' => 52, 'blood_group' => 'O+', 'address' => '258 Willow Way, Fairmont', 'emergency_contact' => '+1 555-1016', 'status' => 'Active', 'registered_date' => '2024-06-01', 'last_visit' => '2024-08-26'],
            'p9' => ['patient_code' => 'PT-2024-009', 'name' => 'Daniel Moore', 'email' => 'daniel.m@email.com', 'phone' => '+1 555-1017', 'gender' => 'Male', 'age' => 29, 'blood_group' => 'A+', 'address' => '369 Aspen Ct, Greenfield', 'emergency_contact' => '+1 555-1018', 'status' => 'Active', 'registered_date' => '2024-06-20', 'last_visit' => '2024-08-29'],
            'p10' => ['patient_code' => 'PT-2024-010', 'name' => 'Isabella Lee', 'email' => 'isabella.l@email.com', 'phone' => '+1 555-1019', 'gender' => 'Female', 'age' => 35, 'blood_group' => 'AB-', 'address' => '741 Redwood Blvd, Sunnyvale', 'emergency_contact' => '+1 555-1020', 'status' => 'Active', 'registered_date' => '2024-07-02', 'last_visit' => '2024-08-27'],
        ];

        $result = [];
        foreach ($patients as $key => $patient) {
            $result[$key] = Patient::updateOrCreate(['patient_code' => $patient['patient_code']], $patient);
        }

        return $result;
    }

    /**
     * @param  array<string, Patient>  $patients
     * @param  array<string, Doctor>  $doctors
     */
    private function seedAppointments(array $patients, array $doctors): void
    {
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        $rows = [
            ['p1', 'd1', $today, '09:00', 'Consultation', 'Confirmed', 'Chest pain follow-up'],
            ['p2', 'd2', $today, '09:30', 'Follow-up', 'In Progress', 'Migraine treatment review'],
            ['p3', 'd3', $today, '10:00', 'Check-up', 'Scheduled', 'Post-surgery check-up'],
            ['p4', 'd4', $today, '10:30', 'Consultation', 'Scheduled', 'Routine vaccination'],
            ['p6', 'd7', $today, '11:00', 'Follow-up', 'Completed', 'Blood pressure management'],
            ['p7', 'd5', $today, '11:30', 'Emergency', 'In Progress', 'Appendicitis consultation'],
            ['p8', 'd1', $today, '13:00', 'Check-up', 'Scheduled', 'Annual heart check-up'],
            ['p9', 'd6', $today, '13:30', 'Consultation', 'Cancelled', 'Skin rash evaluation'],
            ['p10', 'd8', $today, '14:00', 'Check-up', 'Confirmed', 'Prenatal check-up'],
            ['p1', 'd1', $tomorrow, '09:00', 'Follow-up', 'Scheduled', 'Medication review'],
            ['p3', 'd3', $tomorrow, '10:00', 'Consultation', 'Scheduled', 'Knee pain assessment'],
            ['p4', 'd4', $tomorrow, '11:00', 'Follow-up', 'Scheduled', 'Growth monitoring'],
        ];

        foreach ($rows as [$pKey, $dKey, $date, $time, $type, $status, $reason]) {
            $patient = $patients[$pKey];
            $doctor = $doctors[$dKey];

            Appointment::updateOrCreate(
                ['patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'date' => $date, 'time' => $time],
                [
                    'patient_name' => $patient->name,
                    'doctor_name' => $doctor->name,
                    'department' => $doctor->department,
                    'type' => $type,
                    'status' => $status,
                    'reason' => $reason,
                ]
            );
        }
    }

    /**
     * @param  array<string, Patient>  $patients
     */
    private function seedQueue(array $patients): void
    {
        QueueEntry::query()->delete();

        $byName = Doctor::pluck('id', 'name');

        $rows = [
            [1, 'p1', 'Dr. James Wilson', 'Cardiology', 'Normal', 'In Consultation', '08:45', 0],
            [2, 'p2', 'Dr. Sarah Chen', 'Neurology', 'Normal', 'Waiting', '09:00', 15],
            [3, 'p7', 'Dr. Robert Kim', 'Surgery', 'Emergency', 'Waiting', '09:05', 5],
            [4, 'p3', 'Dr. Michael Brown', 'Orthopedics', 'Normal', 'Waiting', '09:10', 30],
            [5, 'p4', 'Dr. Jennifer Lee', 'Pediatrics', 'Urgent', 'Waiting', '09:15', 10],
            [6, 'p8', 'Dr. James Wilson', 'Cardiology', 'Normal', 'Waiting', '09:20', 45],
            [7, 'p6', 'Dr. David Park', 'Internal Medicine', 'Normal', 'Done', '08:30', 0],
        ];

        foreach ($rows as [$token, $pKey, $doctorName, $department, $priority, $status, $checkIn, $wait]) {
            $patient = $patients[$pKey];

            QueueEntry::create([
                'token_number' => $token,
                'patient_id' => $patient->id,
                'doctor_id' => $byName[$doctorName] ?? null,
                'patient_name' => $patient->name,
                'doctor_name' => $doctorName,
                'department' => $department,
                'priority' => $priority,
                'status' => $status,
                'check_in_time' => $checkIn,
                'estimated_wait' => $wait,
            ]);
        }
    }

    /**
     * @param  array<string, Patient>  $patients
     * @param  array<string, Doctor>  $doctors
     */
    private function seedPrescriptions(array $patients, array $doctors): void
    {
        $byName = collect($doctors)->keyBy('name');

        $rows = [
            ['p1', 'Dr. James Wilson', '2024-08-20', 'Hypertension', 'Active', 'Monitor blood pressure weekly. Follow-up in 4 weeks.', [
                ['name' => 'Lisinopril', 'dosage' => '10mg', 'duration' => '30 days', 'instructions' => 'Take once daily in the morning'],
                ['name' => 'Atorvastatin', 'dosage' => '20mg', 'duration' => '30 days', 'instructions' => 'Take once daily at bedtime'],
            ]],
            ['p2', 'Dr. Sarah Chen', '2024-08-25', 'Chronic Migraine', 'Active', 'Maintain headache diary. Avoid known triggers.', [
                ['name' => 'Sumatriptan', 'dosage' => '50mg', 'duration' => 'As needed', 'instructions' => 'Take at onset of migraine symptoms'],
                ['name' => 'Propranolol', 'dosage' => '40mg', 'duration' => '60 days', 'instructions' => 'Take twice daily'],
            ]],
            ['p3', 'Dr. Michael Brown', '2024-08-18', 'Osteoarthritis', 'Active', 'Physical therapy recommended twice weekly.', [
                ['name' => 'Ibuprofen', 'dosage' => '400mg', 'duration' => '14 days', 'instructions' => 'Take with food, every 8 hours'],
                ['name' => 'Glucosamine', 'dosage' => '1500mg', 'duration' => '90 days', 'instructions' => 'Take once daily'],
            ]],
            ['p6', 'Dr. David Park', '2024-08-28', 'Type 2 Diabetes', 'Active', 'Check HbA1c in 3 months. Daily glucose monitoring.', [
                ['name' => 'Metformin', 'dosage' => '500mg', 'duration' => '90 days', 'instructions' => 'Take twice daily with meals'],
                ['name' => 'Glimepiride', 'dosage' => '2mg', 'duration' => '90 days', 'instructions' => 'Take once daily before breakfast'],
            ]],
            ['p4', 'Dr. Jennifer Lee', '2024-08-22', 'Common Cold', 'Completed', null, [
                ['name' => 'Amoxicillin', 'dosage' => '250mg', 'duration' => '7 days', 'instructions' => 'Take three times daily'],
                ['name' => 'Acetaminophen', 'dosage' => '500mg', 'duration' => '5 days', 'instructions' => 'Take every 6 hours as needed for fever'],
            ]],
        ];

        $offsets = [10, 5, 12, 2, 8];

        foreach (array_values($rows) as $i => [$pKey, $doctorName, $date, $diagnosis, $status, $notes, $medications]) {
            $patient = $patients[$pKey];
            $issued = Carbon::today()->subDays($offsets[$i] ?? ($i * 4))->toDateString();

            Prescription::updateOrCreate(
                ['patient_id' => $patient->id, 'diagnosis' => $diagnosis],
                [
                    'date' => $issued,
                    'doctor_id' => optional($byName->get($doctorName))->id,
                    'patient_name' => $patient->name,
                    'doctor_name' => $doctorName,
                    'status' => $status,
                    'notes' => $notes,
                    'medications' => $medications,
                ]
            );
        }
    }

    /**
     * @param  array<string, Patient>  $patients
     * @param  array<string, Doctor>  $doctors
     */
    private function seedRecords(array $patients, array $doctors): void
    {
        $byName = collect($doctors)->keyBy('name');

        $rows = [
            ['p1', 'Dr. James Wilson', '2024-08-20', 'Lab Report', 'Complete Blood Count', 'CBC results within normal range. Cholesterol slightly elevated.', 2, 'Under Observation'],
            ['p1', 'Dr. James Wilson', '2024-08-20', 'Vitals', 'Vital Signs', 'BP: 145/92, HR: 78, Temp: 98.6F, RR: 16', 0, 'Critical'],
            ['p2', 'Dr. Sarah Chen', '2024-08-25', 'Imaging', 'Brain MRI', 'Normal brain MRI. No evidence of structural abnormalities.', 3, 'Normal'],
            ['p3', 'Dr. Michael Brown', '2024-08-18', 'Imaging', 'Knee X-Ray', 'Moderate osteoarthritis in right knee. Joint space narrowing observed.', 1, 'Under Observation'],
            ['p2', 'Dr. Sarah Chen', '2024-08-25', 'Diagnosis', 'Migraine Diagnosis', 'Chronic migraine without aura. Frequency: 8-10 episodes per month.', 0, 'Normal'],
            ['p6', 'Dr. David Park', '2024-08-28', 'Lab Report', 'HbA1c Test', 'HbA1c: 7.2%. Diabetes control needs improvement.', 1, 'Critical'],
            ['p7', 'Dr. Robert Kim', '2024-08-30', 'Diagnosis', 'Acute Appendicitis', 'CT scan confirms acute appendicitis. Surgery scheduled.', 2, 'Critical'],
            ['p4', 'Dr. Jennifer Lee', '2024-08-22', 'Treatment', 'Vaccination Record', 'Routine childhood vaccinations administered. No adverse reactions.', 0, 'Normal'],
        ];

        foreach (array_values($rows) as $i => [$pKey, $doctorName, $date, $type, $title, $description, $attachments, $status]) {
            $patient = $patients[$pKey];
            $recorded = Carbon::today()->subDays([10, 10, 5, 12, 5, 2, 1, 8][$i] ?? $i)->toDateString();

            MedicalRecord::updateOrCreate(
                ['patient_id' => $patient->id, 'title' => $title],
                [
                    'date' => $recorded,
                    'doctor_id' => optional($byName->get($doctorName))->id,
                    'patient_name' => $patient->name,
                    'doctor_name' => $doctorName,
                    'type' => $type,
                    'description' => $description,
                    'attachments' => $attachments,
                    'status' => $status,
                ]
            );
        }
    }

    /**
     * @param  array<string, Patient>  $patients
     */
    private function seedInvoices(array $patients): void
    {
        $rows = [
            ['INV-2026-001', 'p1', '2024-08-20', '2024-09-20', 850, 'Insurance', [
                ['description' => 'Cardiology Consultation', 'quantity' => 1, 'unitPrice' => 250, 'total' => 250],
                ['description' => 'ECG Test', 'quantity' => 1, 'unitPrice' => 300, 'total' => 300],
                ['description' => 'Laboratory Tests', 'quantity' => 1, 'unitPrice' => 300, 'total' => 300],
            ]],
            ['INV-2026-002', 'p2', '2024-08-25', '2024-09-25', 600, 'Card', [
                ['description' => 'Neurology Consultation', 'quantity' => 1, 'unitPrice' => 300, 'total' => 300],
                ['description' => 'Brain MRI', 'quantity' => 1, 'unitPrice' => 700, 'total' => 700],
                ['description' => 'Medications', 'quantity' => 1, 'unitPrice' => 200, 'total' => 200],
            ]],
            ['INV-2026-003', 'p3', '2024-08-18', '2024-09-18', 0, null, [
                ['description' => 'Orthopedic Consultation', 'quantity' => 1, 'unitPrice' => 200, 'total' => 200],
                ['description' => 'Knee X-Ray', 'quantity' => 1, 'unitPrice' => 150, 'total' => 150],
                ['description' => 'Medications', 'quantity' => 1, 'unitPrice' => 100, 'total' => 100],
            ]],
            ['INV-2026-004', 'p6', '2024-08-28', '2024-09-28', 320, 'Cash', [
                ['description' => 'Internal Medicine Consultation', 'quantity' => 1, 'unitPrice' => 180, 'total' => 180],
                ['description' => 'HbA1c Test', 'quantity' => 1, 'unitPrice' => 140, 'total' => 140],
            ]],
            ['INV-2026-005', 'p7', '2024-08-30', '2024-08-30', 0, null, [
                ['description' => 'Emergency Surgery Consultation', 'quantity' => 1, 'unitPrice' => 500, 'total' => 500],
                ['description' => 'CT Scan', 'quantity' => 1, 'unitPrice' => 1000, 'total' => 1000],
                ['description' => 'Emergency Room Charges', 'quantity' => 1, 'unitPrice' => 2000, 'total' => 2000],
            ]],
            ['INV-2026-006', 'p4', '2024-08-22', '2024-09-22', 180, 'Online', [
                ['description' => 'Pediatric Consultation', 'quantity' => 1, 'unitPrice' => 150, 'total' => 150],
                ['description' => 'Vaccination', 'quantity' => 1, 'unitPrice' => 30, 'total' => 30],
            ]],
            ['INV-2026-007', 'p8', '2024-08-26', '2024-09-26', 0, null, [
                ['description' => 'Cardiology Consultation', 'quantity' => 1, 'unitPrice' => 250, 'total' => 250],
                ['description' => 'ECG Test', 'quantity' => 1, 'unitPrice' => 30, 'total' => 30],
            ]],
        ];

        // Spread invoice dates across the last ~5 months so revenue charts populate.
        $offsets = [130, 96, 68, 40, 12, 5, 2];

        foreach (array_values($rows) as $i => [$number, $pKey, $date, $dueDate, $paid, $method, $items]) {
            $patient = $patients[$pKey];
            $issued = Carbon::today()->subDays($offsets[$i] ?? ($i * 20));

            $invoice = Invoice::firstOrNew(['invoice_number' => $number]);
            $invoice->fill([
                'patient_id' => $patient->id,
                'patient_name' => $patient->name,
                'date' => $issued->toDateString(),
                'due_date' => $issued->copy()->addDays(30)->toDateString(),
                'paid_amount' => $paid,
                'payment_method' => $method,
                'items' => $items,
            ]);
            $invoice->recalculate();
            $invoice->save();
        }
    }

    private function seedTestimonials(): void
    {
        $rows = [
            ['John Matthews', 'Patient', 5, 'The care I received at MediCore was exceptional. The doctors were thorough, the staff was compassionate, and the facilities were spotless. I felt in safe hands throughout my treatment.'],
            ['Sarah Williams', 'Patient', 5, 'From the emergency room to discharge, every step was handled with professionalism. The online appointment system saved me hours of waiting. Truly a modern hospital experience.'],
            ['Robert Chen', 'Patient Family', 4, 'My mother was admitted for a week, and the nursing staff went above and beyond. The daily updates from the doctor gave our family peace of mind. Thank you MediCore.'],
            ['Amanda Foster', 'Patient', 5, 'The cardiology team is world-class. Dr. Wilson took the time to explain every detail of my treatment plan. The follow-up care has been outstanding.'],
            ['Michael Stevens', 'Patient', 5, 'Best hospital experience I have had. Clean, efficient, and genuinely caring staff. The billing was transparent with no surprises.'],
            ['Patricia Lee', 'Patient Family', 5, 'My son was treated in the pediatric ward and the staff made him feel comfortable and safe. The facilities are designed with families in mind.'],
        ];

        foreach ($rows as [$name, $role, $rating, $content]) {
            Testimonial::updateOrCreate(['name' => $name, 'content' => $content], compact('role', 'rating'));
        }
    }

    private function seedFacilities(): void
    {
        $rows = [
            ['24/7 Emergency Care', 'Round-the-clock emergency department with rapid response team and trauma care capabilities.', 'Ambulance'],
            ['Advanced Diagnostic Imaging', 'State-of-the-art MRI, CT scan, X-ray, and ultrasound facilities for accurate diagnosis.', 'Scan'],
            ['Modern Operation Theaters', '12 fully equipped surgical suites with advanced laparoscopic and robotic surgery systems.', 'Stethoscope'],
            ['Intensive Care Unit', '30-bed ICU with advanced life support systems and 24/7 critical care specialists.', 'HeartPulse'],
            ['Laboratory Services', 'Full-service pathology and diagnostic laboratory with rapid turnaround times.', 'FlaskConical'],
            ['Pharmacy', 'In-house pharmacy stocked with all essential medications, open 24 hours a day.', 'Pill'],
            ['Telemedicine', 'Virtual consultation platform connecting patients with specialists from anywhere.', 'Video'],
            ['Patient Rooms', 'Comfortable private and semi-private rooms with modern amenities for patient recovery.', 'Bed'],
        ];

        foreach ($rows as [$name, $description, $icon]) {
            Facility::updateOrCreate(['name' => $name], compact('description', 'icon'));
        }
    }
}
