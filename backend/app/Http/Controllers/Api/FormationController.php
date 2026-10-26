<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Formation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FormationController extends Controller
{
    public function index(Request $request)
    {
        $query = Formation::query();

        if ($request->filled('recherche')) {
            $term = trim($request->input('recherche'));
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', "%{$term}%")
                    ->orWhere('intitule', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%");
            });
        }

        if ($request->filled('duree_min')) $query->where('duree_mois', '>=', $request->input('duree_min'));
        if ($request->filled('duree_max')) $query->where('duree_mois', '<=', $request->input('duree_max'));
        if ($request->filled('cout_min')) $query->where('cout', '>=', $request->input('cout_min'));
        if ($request->filled('cout_max')) $query->where('cout', '<=', $request->input('cout_max'));

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        return response()->json($query->orderBy('intitule')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:formations,code'],
            'intitule' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'duree_mois' => ['nullable', 'integer', 'min:1'],
            'cout' => ['required', 'numeric', 'min:0'],
        ]);

        return response()->json(Formation::create($data), 201);
    }

    public function show(Formation $formation)
    {
        return response()->json($formation);
    }

    public function update(Request $request, Formation $formation)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('formations', 'code')->ignore($formation->id)],
            'intitule' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'duree_mois' => ['nullable', 'integer', 'min:1'],
            'cout' => ['required', 'numeric', 'min:0'],
        ]);

        $formation->update($data);
        return response()->json($formation);
    }

    public function destroy(Formation $formation)
    {
        try {
            $formation->delete();
            return response()->json(['message' => 'Formation supprimée avec succès.']);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'Impossible de supprimer cette formation car elle possède des inscriptions.'], 409);
        }
    }
}
