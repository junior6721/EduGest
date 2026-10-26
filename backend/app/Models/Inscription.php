<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inscription extends Model
{
    protected $fillable = [
        'etudiant_id',
        'formation_id',
        'date_inscription',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'date_inscription' => 'date',
        ];
    }

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class);
    }

    public function formation(): BelongsTo
    {
        return $this->belongsTo(Formation::class);
    }
}