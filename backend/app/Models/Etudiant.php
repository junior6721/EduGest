<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Etudiant extends Model
{
    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'email',
        'telephone',
        'date_naissance',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
        ];
    }

    public function inscriptions(): HasMany
    {
        return $this->hasMany(Inscription::class);
    }
}