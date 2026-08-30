<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

/**
 * Admin inbox for landing-page contact submissions.
 */
class ContactMessageController extends Controller
{
    public function index(Request $request)
    {
        $query = ContactMessage::query()->latest('id');

        if ($request->has('handled')) {
            $query->where('handled', $request->boolean('handled'));
        }

        return ContactMessageResource::collection($query->get());
    }

    public function update(Request $request, ContactMessage $message)
    {
        $data = $request->validate(['handled' => ['required', 'boolean']]);
        $message->update($data);

        return new ContactMessageResource($message);
    }

    public function destroy(ContactMessage $message)
    {
        $message->delete();

        return response()->noContent();
    }
}
