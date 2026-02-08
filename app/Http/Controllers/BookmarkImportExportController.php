<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportBookmarkRequest;
use App\Services\BookmarkExportService;
use App\Services\BookmarkImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookmarkImportExportController extends Controller
{
    public function index(Request $request): Response
    {
        return inertia('bookmarks/import-export', [
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function import(ImportBookmarkRequest $request): RedirectResponse
    {
        try {
            $html = $request->file('file')->get();
            $mapFolders = $request->boolean('map_folders', true);

            $service = new BookmarkImportService($request->user(), $mapFolders);
            $result = $service->import($html);

            $message = "Imported {$result['imported']} bookmarks.";
            if ($result['skipped'] > 0) {
                $message .= " Skipped {$result['skipped']} duplicates.";
            }
            if (count($result['errors']) > 0) {
                $message .= ' '.count($result['errors']).' failed.';
            }

            return back()->with('success', $message);
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to import bookmarks.');
        }
    }

    public function exportHtml(Request $request): StreamedResponse
    {
        $categorySlug = $request->query('category');
        $service = new BookmarkExportService($request->user());

        return $service->exportHtml($categorySlug);
    }

    public function exportJson(Request $request): StreamedResponse
    {
        $categorySlug = $request->query('category');
        $service = new BookmarkExportService($request->user());

        return $service->exportJson($categorySlug);
    }
}
