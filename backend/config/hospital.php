<?php

// Seller details printed on every invoice and pharmacy receipt.
return [
    'name' => env('HOSPITAL_NAME', 'MediCore Hospital'),
    'pharmacy_name' => env('HOSPITAL_PHARMACY_NAME', 'MediCore Pharmacy'),
    'address' => env('HOSPITAL_ADDRESS', '123 Healthcare Blvd, Springfield, IL 62704'),
    'phone' => env('HOSPITAL_PHONE', '+1 (555) 123-4567'),
    'tax_label' => env('HOSPITAL_TAX_LABEL', 'PAN/VAT No.'),
    'tax_number' => env('HOSPITAL_TAX_NUMBER'),
];
