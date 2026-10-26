<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Formation extends Model
{
    protected $fillable = [
        'code',
        'intitule',
        'description',
        'duree_mois',
        'cout',
    ];

    protected function casts(): array
    {
        return [
            'cout' => 'decimal:2',
        ];
    }

    public function inscriptions(): HasMany
    {
        return $this->hasMany(Inscription::class);
    }
}