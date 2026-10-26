
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\Etudiant;
use App\Models\Formation;
use App\Models\Inscription;
use App\Http\Controllers\Api\EtudiantController;
use App\Http\Controllers\Api\FormationController;
use App\Http\Controllers\Api\InscriptionController;

Route::apiResource('etudiants', EtudiantController::class);
Route::apiResource('formations', FormationController::class);
Route::apiResource('inscriptions', InscriptionController::class);

Route::get('/dashboard', function () {
    $inscriptionsParFormation = Inscription::query()
        ->join('formations', 'inscriptions.formation_id', '=', 'formations.id')
        ->select(
            'formations.id',
            'formations.intitule',
            DB::raw('COUNT(inscriptions.id) as total')
        )
        ->groupBy('formations.id', 'formations.intitule')
        ->orderByDesc('total')
        ->get();

    $inscriptionsParStatut = Inscription::query()
        ->select('statut', DB::raw('COUNT(*) as total'))
        ->groupBy('statut')
        ->get();

    $inscriptionsParMois = Inscription::query()
        ->select(
            DB::raw('DATE_FORMAT(date_inscription, "%Y-%m") as mois'),
            DB::raw('COUNT(*) as total')
        )
        ->whereNotNull('date_inscription')
        ->groupBy('mois')
        ->orderBy('mois')
        ->get();

    return response()->json([
        'total_etudiants' => Etudiant::count(),
        'total_formations' => Formation::count(),
        'total_inscriptions' => Inscription::count(),
        'inscriptions_en_cours' => Inscription::where('statut', 'en_cours')->count(),

        'inscriptions_par_formation' => $inscriptionsParFormation,
        'inscriptions_par_statut' => $inscriptionsParStatut,
        'inscriptions_par_mois' => $inscriptionsParMois,
    ]);
});
