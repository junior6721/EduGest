<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inscriptions', function (Blueprint $table) {
            $table->id();
     
            $table->foreignId('etudiant_id')
                  ->constrained('etudiants')
                  ->cascadeOnDelete();
     
            $table->foreignId('formation_id')
                  ->constrained('formations')
                  ->cascadeOnDelete();
     
            $table->date('date_inscription');
            $table->string('statut')->default('en_cours');
     
            $table->timestamps();
     
            $table->unique(['etudiant_id', 'formation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inscriptions');
    }
};
