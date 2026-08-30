<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['handled' => 'boolean'];
    }
}
