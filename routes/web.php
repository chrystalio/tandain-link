<?php

use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\BookmarkImportExportController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TagController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('categories', CategoryController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::resource('tags', TagController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::get('bookmarks/import-export', [BookmarkImportExportController::class, 'index'])
        ->name('bookmarks.import-export');
    Route::post('bookmarks/import', [BookmarkImportExportController::class, 'import'])
        ->name('bookmarks.import');
    Route::get('bookmarks/export/html', [BookmarkImportExportController::class, 'exportHtml'])
        ->name('bookmarks.export-html');
    Route::get('bookmarks/export/json', [BookmarkImportExportController::class, 'exportJson'])
        ->name('bookmarks.export-json');

    Route::resource('bookmarks', BookmarkController::class)
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);

    Route::post('bookmarks/{bookmark}/restore', [BookmarkController::class, 'restore'])
        ->withTrashed()
        ->name('bookmarks.restore');

    Route::delete('bookmarks/{bookmark}/force', [BookmarkController::class, 'forceDestroy'])
        ->withTrashed()
        ->name('bookmarks.force-destroy');

    Route::patch('bookmarks/{bookmark}/archive', [BookmarkController::class, 'archive'])
        ->name('bookmarks.archive');
});

require __DIR__.'/settings.php';
