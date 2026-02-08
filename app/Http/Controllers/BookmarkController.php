<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookmarkRequest;
use App\Http\Requests\UpdateBookmarkRequest;
use App\Models\Bookmark;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Response;

class BookmarkController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->query('per_page', 20), 50);
        $search = $request->string('search')->trim()->substr(0, 200)->toString();

        if ($search !== '') {
            $key = 'bookmark-search:'.$request->user()->id;
            if (RateLimiter::tooManyAttempts($key, 30)) {
                abort(429, 'Too many search requests.');
            }
            RateLimiter::hit($key, 60);
        }

        $query = $request->user()
            ->bookmarks()
            ->with(['category', 'tags']);

        if ($search !== '') {
            if (DB::getDriverName() === 'mysql') {
                $query->whereFullText(['title', 'url', 'description', 'notes'], $search);
            } else {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%");
                });
            }
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->query('category')));
        }

        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $request->query('tag')));
        }

        if ($request->boolean('archived')) {
            $query->where('is_archived', true);
        } elseif ($request->boolean('trashed')) {
            $query->onlyTrashed();
        } else {
            $query->where('is_archived', false);
        }

        $sortField = in_array($request->query('sort'), ['created_at', 'title', 'url']) ? $request->query('sort') : 'created_at';
        $sortDirection = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $sortDirection);

        $bookmarks = $query->paginate($perPage);

        return inertia('bookmarks/index', [
            'bookmarks' => $bookmarks,
            'filters' => $request->only(['search', 'category', 'tag', 'archived', 'trashed', 'sort', 'direction']),
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'slug', 'color', 'icon']),
            'tags' => $request->user()->tags()->orderBy('name')->get(['id', 'name', 'slug', 'color']),
        ]);
    }

    public function create(Request $request): Response
    {
        return inertia('bookmarks/create', [
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'slug', 'color', 'icon']),
            'tags' => $request->user()->tags()->orderBy('name')->get(['id', 'name', 'slug', 'color']),
        ]);
    }

    public function store(StoreBookmarkRequest $request): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request): void {
                $bookmark = $request->user()->bookmarks()->create(
                    $request->safe()->except('tags')
                );

                if ($request->validated('tags')) {
                    $bookmark->tags()->sync($request->validated('tags'));
                }
            });

            return redirect()->route('bookmarks.index')
                ->with('success', 'Bookmark created successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to create bookmark.');
        }
    }

    public function edit(Request $request, Bookmark $bookmark): Response
    {
        $bookmark->load(['category', 'tags']);

        return inertia('bookmarks/edit', [
            'bookmark' => $bookmark,
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'slug', 'color', 'icon']),
            'tags' => $request->user()->tags()->orderBy('name')->get(['id', 'name', 'slug', 'color']),
        ]);
    }

    public function update(UpdateBookmarkRequest $request, Bookmark $bookmark): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request, $bookmark): void {
                $bookmark->update($request->safe()->except('tags'));

                $bookmark->tags()->sync($request->validated('tags') ?? []);
            });

            return redirect()->route('bookmarks.index')
                ->with('success', 'Bookmark updated successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to update bookmark.');
        }
    }

    public function destroy(Bookmark $bookmark): RedirectResponse
    {
        try {
            $bookmark->delete();

            return back()->with('success', 'Bookmark moved to trash.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete bookmark.');
        }
    }

    public function restore(Bookmark $bookmark): RedirectResponse
    {
        try {
            $bookmark->restore();

            return back()->with('success', 'Bookmark restored.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to restore bookmark.');
        }
    }

    public function forceDestroy(Bookmark $bookmark): RedirectResponse
    {
        try {
            DB::transaction(function () use ($bookmark): void {
                $bookmark->tags()->detach();
                $bookmark->forceDelete();
            });

            return back()->with('success', 'Bookmark permanently deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to permanently delete bookmark.');
        }
    }

    public function archive(Bookmark $bookmark): RedirectResponse
    {
        try {
            $bookmark->update(['is_archived' => ! $bookmark->is_archived]);

            $message = $bookmark->is_archived ? 'Bookmark archived.' : 'Bookmark unarchived.';

            return back()->with('success', $message);
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to update archive status.');
        }
    }
}
