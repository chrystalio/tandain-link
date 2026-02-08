<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Response;

class TagController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 20);
        $tags = $request->user()
            ->tags()
            ->latest()
            ->paginate($perPage);

        return inertia('tags/index', [
            'tags' => $tags,
        ]);
    }

    public function store(StoreTagRequest $request): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request): void {
                $request->user()->tags()->create($request->validated());
            });

            return back()->with('success', 'Tag created successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to create tag.');
        }
    }

    public function update(UpdateTagRequest $request, Tag $tag): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request, $tag): void {
                $tag->update([
                    ...$request->validated(),
                    'slug' => Str::slug($request->validated('name')),
                ]);
            });

            return back()->with('success', 'Tag updated successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to update tag.');
        }
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        try {
            DB::transaction(function () use ($tag): void {
                $tag->delete();
            });

            return back()->with('success', 'Tag deleted successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete tag.');
        }
    }
}
