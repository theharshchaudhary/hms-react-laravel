<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        ContactMessage::create($data);

        return response()->json([
            'message' => "Thanks for reaching out. We'll get back to you within 24 hours.",
        ], 201);
    }
}
