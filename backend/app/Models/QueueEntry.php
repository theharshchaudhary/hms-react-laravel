<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QueueEntry extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'token_number' => 'integer',
            'estimated_wait' => 'integer',
        ];
    }
}
