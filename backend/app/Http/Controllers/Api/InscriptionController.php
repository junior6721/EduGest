<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Inscription::with(['etudiant', 'formation']);

        if ($request->filled('etudiant_id')) $query->where('etudiant_id', $request->input('etudiant_id'));
        if ($request->filled('formation_id')) $query->where('formation_id', $request->input('formation_id'));
        if ($request->filled('statut')) $query->where('statut', $request->input('statut'));
        if ($request->filled('date_debut')) $query->whereDate('date_inscription', '>=', $request->input('date_debut'));
        if ($request->filled('date_fin')) $query->whereDate('date_inscription', '<=', $request->input('date_fin'));

        if ($request->filled('recherche')) {
            $term = trim($request->input('recherche'));
            $query->where(function ($q) use ($term) {
                $q->whereHas('etudiant', function ($studentQuery) use ($term) {
                    $studentQuery->where('nom', 'like', "%{$term}%")
                        ->orWhere('prenom', 'like', "%{$term}%")
                        ->orWhere('matricule', 'like', "%{$term}%");
                })->orWhereHas('formation', function ($formationQuery) use ($term) {
                    $formationQuery->where('intitule', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%");
                });
            });
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        return response()->json($query->orderByDesc('date_inscription')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'etudiant_id' => ['required', 'integer', 'exists:etudiants,id'],
            'formation_id' => ['required', 'integer', 'exists:formations,id'],
            'date_inscription' => ['required', 'date'],
            'statut' => ['required', Rule::in(['en_cours', 'terminee', 'annulee'])],
        ]);

        $duplicate = Inscription::where('etudiant_id', $data['etudiant_id'])
            ->where('formation_id', $data['formation_id'])
            ->where('statut', '!=', 'annulee')
            ->exists();
        if ($duplicate) {
            throw ValidationException::withMessages([
                'formation_id' => ['Cet étudiant possède déjà une inscription active pour cette formation.'],
            ]);
        }

        return response()->json(Inscription::create($data)->load(['etudiant', 'formation']), 201);
    }

    public function show(Inscription $inscription)
    {
        return response()->json($inscription->load(['etudiant', 'formation']));
    }

    public function update(Request $request, Inscription $inscription)
    {
        $data = $request->validate([
            'etudiant_id' => ['required', 'integer', 'exists:etudiants,id'],
            'formation_id' => ['required', 'integer', 'exists:formations,id'],
            'date_inscription' => ['required', 'date'],
            'statut' => ['required', Rule::in(['en_cours', 'terminee', 'annulee'])],
        ]);

        $duplicate = Inscription::where('etudiant_id', $data['etudiant_id'])
            ->where('formation_id', $data['formation_id'])
            ->where('id', '!=', $inscription->id)
            ->where('statut', '!=', 'annulee')
            ->exists();
        if ($duplicate) {
            throw ValidationException::withMessages([
                'formation_id' => ['Cet étudiant possède déjà une inscription active pour cette formation.'],
            ]);
        }

        $inscription->update($data);
        return response()->json($inscription->load(['etudiant', 'formation']));
    }

    public function destroy(Inscription $inscription)
    {
        $inscription->delete();
        return response()->json(['message' => 'Inscription supprimée avec succès.']);
    }
}
