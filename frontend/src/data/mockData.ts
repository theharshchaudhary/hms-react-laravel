import type {
  Patient, Doctor, Department, Appointment, QueueEntry,
  Prescription, MedicalRecord, Invoice, Testimonial, Facility, User,
} from '@/types';

export const mockUsers: (User & { password: string })[] = [
  { id: 'u1', name: 'Dr. Sarah Chen', email: 'admin@medicore.com', password: 'admin123', role: 'admin', phone: '+1 555-0100', department: 'Administration', avatar: 'SC' },
  { id: 'u2', name: 'Dr. James Wilson', email: 'doctor@medicore.com', password: 'doctor123', role: 'doctor', phone: '+1 555-0101', department: 'Cardiology', avatar: 'JW' },
  { id: 'u3', name: 'Emily Rodriguez', email: 'reception@medicore.com', password: 'reception123', role: 'receptionist', phone: '+1 555-0102', department: 'Front Desk', avatar: 'ER' },
];

export const mockPatients: Patient[] = [
  { id: 'p1', patientCode: 'PT-2024-001', name: 'Michael Johnson', email: 'michael.j@email.com', phone: '+1 555-1001', gender: 'Male', age: 45, bloodGroup: 'O+', address: '123 Maple St, Springfield', emergencyContact: '+1 555-1002', status: 'Active', registeredDate: '2024-01-15', lastVisit: '2024-08-20' },
  { id: 'p2', patientCode: 'PT-2024-002', name: 'Emily Davis', email: 'emily.davis@email.com', phone: '+1 555-1003', gender: 'Female', age: 32, bloodGroup: 'A+', address: '456 Oak Ave, Riverside', emergencyContact: '+1 555-1004', status: 'Admitted', registeredDate: '2024-02-10', lastVisit: '2024-08-25' },
  { id: 'p3', patientCode: 'PT-2024-003', name: 'Robert Brown', email: 'robert.b@email.com', phone: '+1 555-1005', gender: 'Male', age: 67, bloodGroup: 'B+', address: '789 Pine Rd, Lakeside', emergencyContact: '+1 555-1006', status: 'Active', registeredDate: '2024-01-20', lastVisit: '2024-08-18' },
  { id: 'p4', patientCode: 'PT-2024-004', name: 'Jessica Martinez', email: 'jessica.m@email.com', phone: '+1 555-1007', gender: 'Female', age: 28, bloodGroup: 'AB+', address: '321 Elm St, Hillcrest', emergencyContact: '+1 555-1008', status: 'Active', registeredDate: '2024-03-05', lastVisit: '2024-08-22' },
  { id: 'p5', patientCode: 'PT-2024-005', name: 'William Garcia', email: 'william.g@email.com', phone: '+1 555-1009', gender: 'Male', age: 54, bloodGroup: 'O-', address: '654 Cedar Ln, Brookfield', emergencyContact: '+1 555-1010', status: 'Inactive', registeredDate: '2024-02-28', lastVisit: '2024-07-15' },
  { id: 'p6', patientCode: 'PT-2024-006', name: 'Olivia Taylor', email: 'olivia.t@email.com', phone: '+1 555-1011', gender: 'Female', age: 41, bloodGroup: 'A-', address: '987 Birch Dr, Westwood', emergencyContact: '+1 555-1012', status: 'Active', registeredDate: '2024-04-12', lastVisit: '2024-08-28' },
  { id: 'p7', patientCode: 'PT-2024-007', name: 'David Anderson', email: 'david.a@email.com', phone: '+1 555-1013', gender: 'Male', age: 38, bloodGroup: 'B-', address: '147 Spruce St, Eastgate', emergencyContact: '+1 555-1014', status: 'Admitted', registeredDate: '2024-05-08', lastVisit: '2024-08-30' },
  { id: 'p8', patientCode: 'PT-2024-008', name: 'Sophia Thomas', email: 'sophia.t@email.com', phone: '+1 555-1015', gender: 'Female', age: 52, bloodGroup: 'O+', address: '258 Willow Way, Fairmont', emergencyContact: '+1 555-1016', status: 'Active', registeredDate: '2024-06-01', lastVisit: '2024-08-26' },
  { id: 'p9', patientCode: 'PT-2024-009', name: 'Daniel Moore', email: 'daniel.m@email.com', phone: '+1 555-1017', gender: 'Male', age: 29, bloodGroup: 'A+', address: '369 Aspen Ct, Greenfield', emergencyContact: '+1 555-1018', status: 'Active', registeredDate: '2024-06-20', lastVisit: '2024-08-29' },
  { id: 'p10', patientCode: 'PT-2024-010', name: 'Isabella Lee', email: 'isabella.l@email.com', phone: '+1 555-1019', gender: 'Female', age: 35, bloodGroup: 'AB-', address: '741 Redwood Blvd, Sunnyvale', emergencyContact: '+1 555-1020', status: 'Active', registeredDate: '2024-07-02', lastVisit: '2024-08-27' },
];

export const mockDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. James Wilson', email: 'j.wilson@medicore.com', phone: '+1 555-2001', specialization: 'Interventional Cardiology', department: 'Cardiology', experience: 15, qualification: 'MD, FACC', availability: 'Available', rating: 4.9, totalPatients: 1240, avatar: 'JW', bio: 'Specialist in interventional cardiology with 15+ years treating complex heart conditions.' },
  { id: 'd2', name: 'Dr. Sarah Chen', email: 's.chen@medicore.com', phone: '+1 555-2002', specialization: 'Neurology', department: 'Neurology', experience: 12, qualification: 'MD, PhD', availability: 'Available', rating: 4.8, totalPatients: 980, avatar: 'SC', bio: 'Board-certified neurologist focused on stroke care and neurodegenerative disorders.' },
  { id: 'd3', name: 'Dr. Michael Brown', email: 'm.brown@medicore.com', phone: '+1 555-2003', specialization: 'Orthopedic Surgery', department: 'Orthopedics', experience: 18, qualification: 'MD, MS Ortho', availability: 'Busy', rating: 4.7, totalPatients: 1560, avatar: 'MB', bio: 'Orthopedic surgeon specializing in joint replacement and sports injuries.' },
  { id: 'd4', name: 'Dr. Jennifer Lee', email: 'j.lee@medicore.com', phone: '+1 555-2004', specialization: 'Pediatrics', department: 'Pediatrics', experience: 10, qualification: 'MD, FAAP', availability: 'Available', rating: 4.9, totalPatients: 2100, avatar: 'JL', bio: 'Dedicated pediatrician providing compassionate care for children of all ages.' },
  { id: 'd5', name: 'Dr. Robert Kim', email: 'r.kim@medicore.com', phone: '+1 555-2005', specialization: 'General Surgery', department: 'Surgery', experience: 20, qualification: 'MD, FACS', availability: 'On Leave', rating: 4.8, totalPatients: 1800, avatar: 'RK', bio: 'Veteran general surgeon with expertise in minimally invasive procedures.' },
  { id: 'd6', name: 'Dr. Maria Garcia', email: 'm.garcia@medicore.com', phone: '+1 555-2006', specialization: 'Dermatology', department: 'Dermatology', experience: 8, qualification: 'MD, FAAD', availability: 'Available', rating: 4.6, totalPatients: 750, avatar: 'MG', bio: 'Dermatologist treating skin conditions and cosmetic dermatology.' },
  { id: 'd7', name: 'Dr. David Park', email: 'd.park@medicore.com', phone: '+1 555-2007', specialization: 'Internal Medicine', department: 'Internal Medicine', experience: 14, qualification: 'MD, FACP', availability: 'Available', rating: 4.7, totalPatients: 1320, avatar: 'DP', bio: 'Internist focused on preventive care and chronic disease management.' },
  { id: 'd8', name: 'Dr. Lisa Anderson', email: 'l.anderson@medicore.com', phone: '+1 555-2008', specialization: 'Obstetrics & Gynecology', department: 'Obstetrics & Gynecology', experience: 16, qualification: 'MD, FACOG', availability: 'Busy', rating: 4.9, totalPatients: 1650, avatar: 'LA', bio: 'OB-GYN providing comprehensive women\'s health services.' },
];

export const mockDepartments: Department[] = [
  { id: 'dep1', name: 'Cardiology', head: 'Dr. James Wilson', description: 'Comprehensive heart and cardiovascular care with state-of-the-art diagnostic and treatment facilities.', totalDoctors: 8, totalBeds: 40, occupiedBeds: 32, location: 'Block A, 3rd Floor', phone: '+1 555-3001', icon: 'HeartPulse' },
  { id: 'dep2', name: 'Neurology', head: 'Dr. Sarah Chen', description: 'Diagnosis and treatment of disorders of the nervous system including stroke and epilepsy.', totalDoctors: 6, totalBeds: 30, occupiedBeds: 21, location: 'Block B, 2nd Floor', phone: '+1 555-3002', icon: 'Brain' },
  { id: 'dep3', name: 'Orthopedics', head: 'Dr. Michael Brown', description: 'Treatment of musculoskeletal injuries and conditions including joint replacement surgery.', totalDoctors: 7, totalBeds: 35, occupiedBeds: 28, location: 'Block C, 1st Floor', phone: '+1 555-3003', icon: 'Bone' },
  { id: 'dep4', name: 'Pediatrics', head: 'Dr. Jennifer Lee', description: 'Specialized medical care for infants, children, and adolescents up to age 18.', totalDoctors: 10, totalBeds: 50, occupiedBeds: 35, location: 'Block D, 4th Floor', phone: '+1 555-3004', icon: 'Baby' },
  { id: 'dep5', name: 'Surgery', head: 'Dr. Robert Kim', description: 'Advanced surgical procedures including general, laparoscopic, and emergency surgery.', totalDoctors: 12, totalBeds: 45, occupiedBeds: 38, location: 'Block A, 1st Floor', phone: '+1 555-3005', icon: 'Stethoscope' },
  { id: 'dep6', name: 'Dermatology', head: 'Dr. Maria Garcia', description: 'Diagnosis and treatment of skin, hair, and nail conditions.', totalDoctors: 4, totalBeds: 15, occupiedBeds: 8, location: 'Block B, 3rd Floor', phone: '+1 555-3006', icon: 'Hand' },
  { id: 'dep7', name: 'Internal Medicine', head: 'Dr. David Park', description: 'Preventive care, diagnosis, and treatment of adult diseases and chronic conditions.', totalDoctors: 9, totalBeds: 40, occupiedBeds: 30, location: 'Block C, 2nd Floor', phone: '+1 555-3007', icon: 'Pill' },
  { id: 'dep8', name: 'Obstetrics & Gynecology', head: 'Dr. Lisa Anderson', description: 'Comprehensive women\'s health, pregnancy care, and reproductive services.', totalDoctors: 8, totalBeds: 35, occupiedBeds: 26, location: 'Block D, 2nd Floor', phone: '+1 555-3008', icon: 'Flower' },
];

export const mockAppointments: Appointment[] = [
  { id: 'a1', patientId: 'p1', patientName: 'Michael Johnson', doctorId: 'd1', doctorName: 'Dr. James Wilson', department: 'Cardiology', date: '2024-08-30', time: '09:00', type: 'Consultation', status: 'Confirmed', reason: 'Chest pain follow-up' },
  { id: 'a2', patientId: 'p2', patientName: 'Emily Davis', doctorId: 'd2', doctorName: 'Dr. Sarah Chen', department: 'Neurology', date: '2024-08-30', time: '09:30', type: 'Follow-up', status: 'In Progress', reason: 'Migraine treatment review' },
  { id: 'a3', patientId: 'p3', patientName: 'Robert Brown', doctorId: 'd3', doctorName: 'Dr. Michael Brown', department: 'Orthopedics', date: '2024-08-30', time: '10:00', type: 'Check-up', status: 'Scheduled', reason: 'Post-surgery check-up' },
  { id: 'a4', patientId: 'p4', patientName: 'Jessica Martinez', doctorId: 'd4', doctorName: 'Dr. Jennifer Lee', department: 'Pediatrics', date: '2024-08-30', time: '10:30', type: 'Consultation', status: 'Scheduled', reason: 'Routine vaccination' },
  { id: 'a5', patientId: 'p6', patientName: 'Olivia Taylor', doctorId: 'd7', doctorName: 'Dr. David Park', department: 'Internal Medicine', date: '2024-08-30', time: '11:00', type: 'Follow-up', status: 'Completed', reason: 'Blood pressure management' },
  { id: 'a6', patientId: 'p7', patientName: 'David Anderson', doctorId: 'd5', doctorName: 'Dr. Robert Kim', department: 'Surgery', date: '2024-08-30', time: '11:30', type: 'Emergency', status: 'In Progress', reason: 'Appendicitis consultation' },
  { id: 'a7', patientId: 'p8', patientName: 'Sophia Thomas', doctorId: 'd1', doctorName: 'Dr. James Wilson', department: 'Cardiology', date: '2024-08-30', time: '13:00', type: 'Check-up', status: 'Scheduled', reason: 'Annual heart check-up' },
  { id: 'a8', patientId: 'p9', patientName: 'Daniel Moore', doctorId: 'd6', doctorName: 'Dr. Maria Garcia', department: 'Dermatology', date: '2024-08-30', time: '13:30', type: 'Consultation', status: 'Cancelled', reason: 'Skin rash evaluation' },
  { id: 'a9', patientId: 'p10', patientName: 'Isabella Lee', doctorId: 'd8', doctorName: 'Dr. Lisa Anderson', department: 'Obstetrics & Gynecology', date: '2024-08-30', time: '14:00', type: 'Check-up', status: 'Confirmed', reason: 'Prenatal check-up' },
  { id: 'a10', patientId: 'p1', patientName: 'Michael Johnson', doctorId: 'd1', doctorName: 'Dr. James Wilson', department: 'Cardiology', date: '2024-08-31', time: '09:00', type: 'Follow-up', status: 'Scheduled', reason: 'Medication review' },
  { id: 'a11', patientId: 'p3', patientName: 'Robert Brown', doctorId: 'd3', doctorName: 'Dr. Michael Brown', department: 'Orthopedics', date: '2024-08-31', time: '10:00', type: 'Consultation', status: 'Scheduled', reason: 'Knee pain assessment' },
  { id: 'a12', patientId: 'p4', patientName: 'Jessica Martinez', doctorId: 'd4', doctorName: 'Dr. Jennifer Lee', department: 'Pediatrics', date: '2024-08-31', time: '11:00', type: 'Follow-up', status: 'Scheduled', reason: 'Growth monitoring' },
];

export const mockQueue: QueueEntry[] = [
  { id: 'q1', tokenNumber: 1, patientName: 'Michael Johnson', patientId: 'p1', doctorName: 'Dr. James Wilson', department: 'Cardiology', priority: 'Normal', status: 'In Consultation', checkInTime: '08:45', estimatedWait: 0 },
  { id: 'q2', tokenNumber: 2, patientName: 'Emily Davis', patientId: 'p2', doctorName: 'Dr. Sarah Chen', department: 'Neurology', priority: 'Normal', status: 'Waiting', checkInTime: '09:00', estimatedWait: 15 },
  { id: 'q3', tokenNumber: 3, patientName: 'David Anderson', patientId: 'p7', doctorName: 'Dr. Robert Kim', department: 'Surgery', priority: 'Emergency', status: 'Waiting', checkInTime: '09:05', estimatedWait: 5 },
  { id: 'q4', tokenNumber: 4, patientName: 'Robert Brown', patientId: 'p3', doctorName: 'Dr. Michael Brown', department: 'Orthopedics', priority: 'Normal', status: 'Waiting', checkInTime: '09:10', estimatedWait: 30 },
  { id: 'q5', tokenNumber: 5, patientName: 'Jessica Martinez', patientId: 'p4', doctorName: 'Dr. Jennifer Lee', department: 'Pediatrics', priority: 'Urgent', status: 'Waiting', checkInTime: '09:15', estimatedWait: 10 },
  { id: 'q6', tokenNumber: 6, patientName: 'Sophia Thomas', patientId: 'p8', doctorName: 'Dr. James Wilson', department: 'Cardiology', priority: 'Normal', status: 'Waiting', checkInTime: '09:20', estimatedWait: 45 },
  { id: 'q7', tokenNumber: 7, patientName: 'Olivia Taylor', patientId: 'p6', doctorName: 'Dr. David Park', department: 'Internal Medicine', priority: 'Normal', status: 'Done', checkInTime: '08:30', estimatedWait: 0 },
];

export const mockPrescriptions: Prescription[] = [
  { id: 'pr1', patientName: 'Michael Johnson', patientId: 'p1', doctorName: 'Dr. James Wilson', date: '2024-08-20', diagnosis: 'Hypertension', status: 'Active', medications: [
    { name: 'Lisinopril', dosage: '10mg', duration: '30 days', instructions: 'Take once daily in the morning' },
    { name: 'Atorvastatin', dosage: '20mg', duration: '30 days', instructions: 'Take once daily at bedtime' },
  ], notes: 'Monitor blood pressure weekly. Follow-up in 4 weeks.' },
  { id: 'pr2', patientName: 'Emily Davis', patientId: 'p2', doctorName: 'Dr. Sarah Chen', date: '2024-08-25', diagnosis: 'Chronic Migraine', status: 'Active', medications: [
    { name: 'Sumatriptan', dosage: '50mg', duration: 'As needed', instructions: 'Take at onset of migraine symptoms' },
    { name: 'Propranolol', dosage: '40mg', duration: '60 days', instructions: 'Take twice daily' },
  ], notes: 'Maintain headache diary. Avoid known triggers.' },
  { id: 'pr3', patientName: 'Robert Brown', patientId: 'p3', doctorName: 'Dr. Michael Brown', date: '2024-08-18', diagnosis: 'Osteoarthritis', status: 'Active', medications: [
    { name: 'Ibuprofen', dosage: '400mg', duration: '14 days', instructions: 'Take with food, every 8 hours' },
    { name: 'Glucosamine', dosage: '1500mg', duration: '90 days', instructions: 'Take once daily' },
  ], notes: 'Physical therapy recommended twice weekly.' },
  { id: 'pr4', patientName: 'Olivia Taylor', patientId: 'p6', doctorName: 'Dr. David Park', date: '2024-08-28', diagnosis: 'Type 2 Diabetes', status: 'Active', medications: [
    { name: 'Metformin', dosage: '500mg', duration: '90 days', instructions: 'Take twice daily with meals' },
    { name: 'Glimepiride', dosage: '2mg', duration: '90 days', instructions: 'Take once daily before breakfast' },
  ], notes: 'Check HbA1c in 3 months. Daily glucose monitoring.' },
  { id: 'pr5', patientName: 'Jessica Martinez', patientId: 'p4', doctorName: 'Dr. Jennifer Lee', date: '2024-08-22', diagnosis: 'Common Cold', status: 'Completed', medications: [
    { name: 'Amoxicillin', dosage: '250mg', duration: '7 days', instructions: 'Take three times daily' },
    { name: 'Acetaminophen', dosage: '500mg', duration: '5 days', instructions: 'Take every 6 hours as needed for fever' },
  ] },
];

export const mockRecords: MedicalRecord[] = [
  { id: 'r1', patientId: 'p1', patientName: 'Michael Johnson', doctorName: 'Dr. James Wilson', date: '2024-08-20', type: 'Lab Report', title: 'Complete Blood Count', description: 'CBC results within normal range. Cholesterol slightly elevated.', attachments: 2, status: 'Under Observation' },
  { id: 'r2', patientId: 'p1', patientName: 'Michael Johnson', doctorName: 'Dr. James Wilson', date: '2024-08-20', type: 'Vitals', title: 'Vital Signs', description: 'BP: 145/92, HR: 78, Temp: 98.6F, RR: 16', status: 'Critical' },
  { id: 'r3', patientId: 'p2', patientName: 'Emily Davis', doctorName: 'Dr. Sarah Chen', date: '2024-08-25', type: 'Imaging', title: 'Brain MRI', description: 'Normal brain MRI. No evidence of structural abnormalities.', attachments: 3, status: 'Normal' },
  { id: 'r4', patientId: 'p3', patientName: 'Robert Brown', doctorName: 'Dr. Michael Brown', date: '2024-08-18', type: 'Imaging', title: 'Knee X-Ray', description: 'Moderate osteoarthritis in right knee. Joint space narrowing observed.', attachments: 1, status: 'Under Observation' },
  { id: 'r5', patientId: 'p2', patientName: 'Emily Davis', doctorName: 'Dr. Sarah Chen', date: '2024-08-25', type: 'Diagnosis', title: 'Migraine Diagnosis', description: 'Chronic migraine without aura. Frequency: 8-10 episodes per month.', status: 'Normal' },
  { id: 'r6', patientId: 'p6', patientName: 'Olivia Taylor', doctorName: 'Dr. David Park', date: '2024-08-28', type: 'Lab Report', title: 'HbA1c Test', description: 'HbA1c: 7.2%. Diabetes control needs improvement.', attachments: 1, status: 'Critical' },
  { id: 'r7', patientId: 'p7', patientName: 'David Anderson', doctorName: 'Dr. Robert Kim', date: '2024-08-30', type: 'Diagnosis', title: 'Acute Appendicitis', description: 'CT scan confirms acute appendicitis. Surgery scheduled.', attachments: 2, status: 'Critical' },
  { id: 'r8', patientId: 'p4', patientName: 'Jessica Martinez', doctorName: 'Dr. Jennifer Lee', date: '2024-08-22', type: 'Treatment', title: 'Vaccination Record', description: 'Routine childhood vaccinations administered. No adverse reactions.', status: 'Normal' },
];

export const mockInvoices: Invoice[] = [
  { id: 'i1', invoiceNumber: 'INV-2024-001', patientName: 'Michael Johnson', patientId: 'p1', date: '2024-08-20', dueDate: '2024-09-20', amount: 850, paidAmount: 850, status: 'Paid', paymentMethod: 'Insurance', items: [
    { description: 'Cardiology Consultation', quantity: 1, unitPrice: 250, total: 250 },
    { description: 'ECG Test', quantity: 1, unitPrice: 300, total: 300 },
    { description: 'Laboratory Tests', quantity: 1, unitPrice: 300, total: 300 },
  ]},
  { id: 'i2', invoiceNumber: 'INV-2024-002', patientName: 'Emily Davis', patientId: 'p2', date: '2024-08-25', dueDate: '2024-09-25', amount: 1200, paidAmount: 600, status: 'Partial', paymentMethod: 'Card', items: [
    { description: 'Neurology Consultation', quantity: 1, unitPrice: 300, total: 300 },
    { description: 'Brain MRI', quantity: 1, unitPrice: 700, total: 700 },
    { description: 'Medications', quantity: 1, unitPrice: 200, total: 200 },
  ]},
  { id: 'i3', invoiceNumber: 'INV-2024-003', patientName: 'Robert Brown', patientId: 'p3', date: '2024-08-18', dueDate: '2024-09-18', amount: 450, paidAmount: 0, status: 'Pending', items: [
    { description: 'Orthopedic Consultation', quantity: 1, unitPrice: 200, total: 200 },
    { description: 'Knee X-Ray', quantity: 1, unitPrice: 150, total: 150 },
    { description: 'Medications', quantity: 1, unitPrice: 100, total: 100 },
  ]},
  { id: 'i4', invoiceNumber: 'INV-2024-004', patientName: 'Olivia Taylor', patientId: 'p6', date: '2024-08-28', dueDate: '2024-09-28', amount: 320, paidAmount: 320, status: 'Paid', paymentMethod: 'Cash', items: [
    { description: 'Internal Medicine Consultation', quantity: 1, unitPrice: 180, total: 180 },
    { description: 'HbA1c Test', quantity: 1, unitPrice: 140, total: 140 },
  ]},
  { id: 'i5', invoiceNumber: 'INV-2024-005', patientName: 'David Anderson', patientId: 'p7', date: '2024-08-30', dueDate: '2024-08-30', amount: 3500, paidAmount: 0, status: 'Overdue', items: [
    { description: 'Emergency Surgery Consultation', quantity: 1, unitPrice: 500, total: 500 },
    { description: 'CT Scan', quantity: 1, unitPrice: 1000, total: 1000 },
    { description: 'Emergency Room Charges', quantity: 1, unitPrice: 2000, total: 2000 },
  ]},
  { id: 'i6', invoiceNumber: 'INV-2024-006', patientName: 'Jessica Martinez', patientId: 'p4', date: '2024-08-22', dueDate: '2024-09-22', amount: 180, paidAmount: 180, status: 'Paid', paymentMethod: 'Online', items: [
    { description: 'Pediatric Consultation', quantity: 1, unitPrice: 150, total: 150 },
    { description: 'Vaccination', quantity: 1, unitPrice: 30, total: 30 },
  ]},
  { id: 'i7', invoiceNumber: 'INV-2024-007', patientName: 'Sophia Thomas', patientId: 'p8', date: '2024-08-26', dueDate: '2024-09-26', amount: 280, paidAmount: 0, status: 'Pending', items: [
    { description: 'Cardiology Consultation', quantity: 1, unitPrice: 250, total: 250 },
    { description: 'ECG Test', quantity: 1, unitPrice: 30, total: 30 },
  ]},
];

export const mockTestimonials: Testimonial[] = [
  { id: 't1', name: 'John Matthews', role: 'Patient', rating: 5, content: 'The care I received at MediCore was exceptional. The doctors were thorough, the staff was compassionate, and the facilities were spotless. I felt in safe hands throughout my treatment.' },
  { id: 't2', name: 'Sarah Williams', role: 'Patient', rating: 5, content: 'From the emergency room to discharge, every step was handled with professionalism. The online appointment system saved me hours of waiting. Truly a modern hospital experience.' },
  { id: 't3', name: 'Robert Chen', role: 'Patient Family', rating: 4, content: 'My mother was admitted for a week, and the nursing staff went above and beyond. The daily updates from the doctor gave our family peace of mind. Thank you MediCore.' },
  { id: 't4', name: 'Amanda Foster', role: 'Patient', rating: 5, content: 'The cardiology team is world-class. Dr. Wilson took the time to explain every detail of my treatment plan. The follow-up care has been outstanding.' },
  { id: 't5', name: 'Michael Stevens', role: 'Patient', rating: 5, content: 'Best hospital experience I have had. Clean, efficient, and genuinely caring staff. The billing was transparent with no surprises.' },
  { id: 't6', name: 'Patricia Lee', role: 'Patient Family', rating: 5, content: 'My son was treated in the pediatric ward and the staff made him feel comfortable and safe. The facilities are designed with families in mind.' },
];

export const mockFacilities: Facility[] = [
  { id: 'f1', name: '24/7 Emergency Care', description: 'Round-the-clock emergency department with rapid response team and trauma care capabilities.', icon: 'Ambulance' },
  { id: 'f2', name: 'Advanced Diagnostic Imaging', description: 'State-of-the-art MRI, CT scan, X-ray, and ultrasound facilities for accurate diagnosis.', icon: 'Scan' },
  { id: 'f3', name: 'Modern Operation Theaters', description: '12 fully equipped surgical suites with advanced laparoscopic and robotic surgery systems.', icon: 'Stethoscope' },
  { id: 'f4', name: 'Intensive Care Unit', description: '30-bed ICU with advanced life support systems and 24/7 critical care specialists.', icon: 'HeartPulse' },
  { id: 'f5', name: 'Laboratory Services', description: 'Full-service pathology and diagnostic laboratory with rapid turnaround times.', icon: 'FlaskConical' },
  { id: 'f6', name: 'Pharmacy', description: 'In-house pharmacy stocked with all essential medications, open 24 hours a day.', icon: 'Pill' },
  { id: 'f7', name: 'Telemedicine', description: 'Virtual consultation platform connecting patients with specialists from anywhere.', icon: 'Video' },
  { id: 'f8', name: 'Patient Rooms', description: 'Comfortable private and semi-private rooms with modern amenities for patient recovery.', icon: 'Bed' },
];

export const hospitalStats = {
  totalPatients: 12480,
  totalDoctors: 64,
  totalDepartments: 8,
  totalBeds: 290,
  satisfactionRate: 98.5,
  yearsOfService: 25,
  monthlyAppointments: 3200,
  emergencyResponse: 4,
};
