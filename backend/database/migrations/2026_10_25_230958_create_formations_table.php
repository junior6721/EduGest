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
        Schema::create('formations', function (Blueprint $table) {
             $table->id();
             $table->string('code')->unique();
             $table->string('intitule');
             $table->text('description')->nullable();
             $table->unsignedSmallInteger('duree_mois')->nullable();
             $table->decimal('cout', 12, 2)->default(0);
             $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formations');
    }
};
