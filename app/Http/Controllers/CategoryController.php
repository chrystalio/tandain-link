<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 10);
        $categories = Category::query()->where('user_id', $request->user()->id)
            ->latest()
            ->paginate($perPage);

        return inertia('categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request): void {
                $request->user()->categories()->create($request->validated());
            });

            return back()->with('success', 'Category created successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to create category.');
        }
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request, $category): void {
                $category->update([
                    ...$request->validated(),
                    'slug' => Str::slug($request->validated('name')),
                ]);
            });

            return back()->with('success', 'Category updated successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to update category.');
        }
    }

    public function destroy(Category $category): RedirectResponse
    {
        try {
            DB::transaction(function () use ($category): void {
                $category->delete();
            });

            return back()->with('success', 'Category deleted successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete category.');
        }
    }
}
