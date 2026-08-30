<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('head')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('total_doctors')->default(0);
            $table->unsignedInteger('total_beds')->default(0);
            $table->unsignedInteger('occupied_beds')->default(0);
            $table->string('location')->nullable();
            $table->string('phone')->nullable();
            $table->string('icon')->default('Stethoscope');
            $table->timestamps();
        });

        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_code')->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->enum('gender', ['Male', 'Female', 'Other'])->default('Other');
            $table->unsignedTinyInteger('age')->default(0);
            $table->string('blood_group', 5)->nullable();
            $table->string('address')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->enum('status', ['Active', 'Inactive', 'Admitted'])->default('Active');
            // Admitting department (set when status becomes "Admitted").
            $table->string('department')->nullable();
            $table->date('registered_date');
            $table->date('last_visit')->nullable();
            $table->timestamps();
            $table->index('name');
            $table->index('status');
        });

        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('specialization')->nullable();
            $table->string('department')->nullable();
            $table->unsignedTinyInteger('experience')->default(0);
            $table->string('qualification')->nullable();
            $table->enum('availability', ['Available', 'On Leave', 'Busy'])->default('Available');
            $table->decimal('rating', 3, 2)->default(5);
            $table->unsignedInteger('total_patients')->default(0);
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->timestamps();
            $table->index('name');
            $table->index('department');
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_name');
            $table->string('doctor_name');
            $table->string('department')->nullable();
            $table->date('date');
            $table->string('time', 5);
            $table->enum('type', ['Consultation', 'Follow-up', 'Emergency', 'Check-up', 'Surgery'])->default('Consultation');
            $table->enum('status', ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'])->default('Scheduled');
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['date', 'time']);
            $table->index('status');
        });

        Schema::create('queue_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('token_number');
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_name');
            $table->string('doctor_name')->nullable();
            $table->string('department')->nullable();
            $table->enum('priority', ['Normal', 'Urgent', 'Emergency'])->default('Normal');
            $table->enum('status', ['Waiting', 'In Consultation', 'Done', 'Skipped'])->default('Waiting');
            $table->string('check_in_time', 5);
            $table->unsignedInteger('estimated_wait')->default(0);
            $table->timestamps();
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_name');
            $table->string('doctor_name');
            $table->date('date');
            $table->json('medications');
            $table->string('diagnosis')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['Active', 'Completed', 'Expired'])->default('Active');
            $table->boolean('refill_requested')->default(false);
            $table->timestamp('refill_requested_at')->nullable();
            $table->timestamps();
        });

        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_name');
            $table->string('doctor_name');
            $table->date('date');
            $table->enum('type', ['Lab Report', 'Diagnosis', 'Treatment', 'Imaging', 'Vitals'])->default('Diagnosis');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('attachments')->default(0);
            $table->enum('status', ['Normal', 'Critical', 'Under Observation'])->default('Normal');
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_name');
            $table->date('date');
            $table->date('due_date');
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->enum('status', ['Paid', 'Pending', 'Overdue', 'Partial'])->default('Pending');
            $table->enum('payment_method', ['Cash', 'Card', 'Insurance', 'Online'])->nullable();
            $table->json('items');
            $table->timestamps();
            $table->index('status');
        });

        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role')->default('Patient');
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('content');
            $table->string('avatar')->nullable();
            $table->timestamps();
        });

        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->default('Stethoscope');
            $table->timestamps();
        });

        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->text('message');
            $table->boolean('handled')->default(false);
            $table->timestamps();
        });

        // Now that "patients" / "doctors" exist, wire the users foreign keys.
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('patient_id')->references('id')->on('patients')->nullOnDelete();
            $table->foreign('doctor_id')->references('id')->on('doctors')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['patient_id']);
            $table->dropForeign(['doctor_id']);
        });

        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('facilities');
        Schema::dropIfExists('testimonials');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('medical_records');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('queue_entries');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('patients');
        Schema::dropIfExists('departments');
    }
};
