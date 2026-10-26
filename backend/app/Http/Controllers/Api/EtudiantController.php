<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Etudiant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EtudiantController extends Controller
{
    public function index(Request $request)
    {
        $query = Etudiant::query();

        foreach (['nom', 'prenom', 'matricule', 'email'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, 'like', '%' . trim($request->input($field)) . '%');
            }
        }

        if ($request->filled('recherche')) {
            $term = trim($request->input('recherche'));
            $query->where(function ($q) use ($term) {
                $q->where('nom', 'like', "%{$term}%")
                    ->orWhere('prenom', 'like', "%{$term}%")
                    ->orWhere('matricule', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('telephone', 'like', "%{$term}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        return response()->json($query->orderBy('nom')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'matricule' => ['required', 'string', 'max:50', 'unique:etudiants,matricule'],
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:etudiants,email'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'date_naissance' => ['nullable', 'date'],
        ]);

        return response()->json(Etudiant::create($data), 201);
    }

    public function show(Etudiant $etudiant)
    {
        return response()->json($etudiant);
    }

    public function update(Request $request, Etudiant $etudiant)
    {
        $data = $request->validate([
            'matricule' => ['required', 'string', 'max:50', Rule::unique('etudiants', 'matricule')->ignore($etudiant->id)],
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('etudiants', 'email')->ignore($etudiant->id)],
            'telephone' => ['nullable', 'string', 'max:30'],
            'date_naissance' => ['nullable', 'date'],
        ]);

        $etudiant->update($data);
        return response()->json($etudiant);
    }

    public function destroy(Etudiant $etudiant)
    {
        try {
            $etudiant->delete();
            return response()->json(['message' => 'Étudiant supprimé avec succès.']);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'Impossible de supprimer cet étudiant car il possède des inscriptions.'], 409);
        }
    }
}
