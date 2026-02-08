<?php

use App\Models\Bookmark;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function bookmarkFixture(): UploadedFile
{
    return new UploadedFile(
        base_path('tests/fixtures/bookmarks.html'),
        'bookmarks.html',
        'text/html',
        null,
        true
    );
}

// Access tests

test('guests cannot access import export page', function () {
    $this->get(route('bookmarks.import-export'))
        ->assertRedirect(route('login'));
});

test('users can view the import export page', function () {
    $this->withoutVite();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('bookmarks.import-export'))
        ->assertOk();
});

// Import tests

test('users can import bookmarks from html file', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => bookmarkFixture(),
            'map_folders' => true,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect($user->bookmarks()->count())->toBe(4);
    $this->assertDatabaseHas('bookmarks', [
        'user_id' => $user->id,
        'url' => 'https://laravel.com/docs',
        'title' => 'Laravel Documentation',
    ]);
});

test('import skips duplicate urls', function () {
    $user = User::factory()->create();

    Bookmark::factory()->create([
        'user_id' => $user->id,
        'url' => 'https://github.com',
    ]);

    $response = $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => bookmarkFixture(),
            'map_folders' => false,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect($user->bookmarks()->count())->toBe(4);
    expect(session('success'))->toContain('Skipped 1');
});

test('import creates categories from folders when enabled', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => bookmarkFixture(),
            'map_folders' => true,
        ]);

    expect($user->categories()->count())->toBe(2);
    $this->assertDatabaseHas('categories', [
        'user_id' => $user->id,
        'name' => 'Development',
    ]);
    $this->assertDatabaseHas('categories', [
        'user_id' => $user->id,
        'name' => 'News',
    ]);

    $laravelBookmark = $user->bookmarks()->where('url', 'https://laravel.com/docs')->first();
    expect($laravelBookmark->category->name)->toBe('Development');
});

test('import does not create categories when disabled', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => bookmarkFixture(),
            'map_folders' => false,
        ]);

    expect($user->categories()->count())->toBe(0);
    expect($user->bookmarks()->whereNotNull('category_id')->count())->toBe(0);
});

test('import reuses existing categories by name match', function () {
    $user = User::factory()->create();
    $category = $user->categories()->create([
        'name' => 'Development',
        'slug' => 'development',
    ]);

    $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => bookmarkFixture(),
            'map_folders' => true,
        ]);

    expect($user->categories()->count())->toBe(2);

    $laravelBookmark = $user->bookmarks()->where('url', 'https://laravel.com/docs')->first();
    expect($laravelBookmark->category_id)->toBe($category->id);
});

test('import validates file type', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('bookmarks.pdf', 100, 'application/pdf');

    $response = $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => $file,
        ]);

    $response->assertSessionHasErrors('file');
});

test('import validates file is required', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.import'), []);

    $response->assertSessionHasErrors('file');
});

test('import handles malformed html gracefully', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->createWithContent('bookmarks.html', '<html><body>Not a bookmark file</body></html>');

    $response = $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => $file,
        ]);

    $response->assertRedirect();
    expect($user->bookmarks()->count())->toBe(0);
});

test('import extracts descriptions from dd elements', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => bookmarkFixture(),
            'map_folders' => false,
        ]);

    $bookmark = $user->bookmarks()->where('url', 'https://laravel.com/docs')->first();
    expect($bookmark->description)->toBe('Official Laravel framework documentation');
});

test('import sets created at from add date', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => bookmarkFixture(),
            'map_folders' => false,
        ]);

    $bookmark = $user->bookmarks()->where('url', 'https://laravel.com/docs')->first();
    expect($bookmark->created_at->timestamp)->toBe(1700000001);
});

test('import skips non http urls', function () {
    $user = User::factory()->create();
    $html = <<<'HTML'
    <!DOCTYPE NETSCAPE-Bookmark-file-1>
    <DL><p>
        <DT><A HREF="javascript:alert(1)">XSS</A>
        <DT><A HREF="ftp://files.example.com">FTP</A>
        <DT><A HREF="https://valid.example.com">Valid</A>
    </DL><p>
    HTML;

    $file = UploadedFile::fake()->createWithContent('bookmarks.html', $html);

    $this->actingAs($user)
        ->post(route('bookmarks.import'), [
            'file' => $file,
        ]);

    expect($user->bookmarks()->count())->toBe(1);
    expect($user->bookmarks()->first()->url)->toContain('valid.example.com');
});

// Export tests

test('users can export bookmarks as html', function () {
    $user = User::factory()->create();
    Bookmark::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-html'));

    $response->assertOk();
    $response->assertDownload('bookmarks.html');
});

test('users can export bookmarks as json', function () {
    $user = User::factory()->create();
    Bookmark::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-json'));

    $response->assertOk();
    $response->assertDownload('bookmarks.json');
});

test('exported html contains bookmark data', function () {
    $user = User::factory()->create();
    Bookmark::factory()->create([
        'user_id' => $user->id,
        'url' => 'https://test.example.com',
        'title' => 'Test Bookmark',
    ]);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-html'));

    $content = $response->streamedContent();
    expect($content)->toContain('NETSCAPE-Bookmark-file-1');
    expect($content)->toContain('https://test.example.com');
    expect($content)->toContain('Test Bookmark');
});

test('exported json contains bookmark data', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id, 'name' => 'Work']);
    Bookmark::factory()->create([
        'user_id' => $user->id,
        'url' => 'https://test.example.com',
        'title' => 'Test Bookmark',
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-json'));

    $data = json_decode($response->streamedContent(), true);
    expect($data)->toHaveCount(1);
    expect($data[0]['url'])->toBe('https://test.example.com');
    expect($data[0]['title'])->toBe('Test Bookmark');
    expect($data[0]['category'])->toBe('Work');
});

test('export filters by category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);
    Bookmark::factory()->create(['user_id' => $user->id, 'category_id' => $category->id]);
    Bookmark::factory()->create(['user_id' => $user->id, 'category_id' => null]);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-json', ['category' => $category->slug]));

    $data = json_decode($response->streamedContent(), true);
    expect($data)->toHaveCount(1);
});

test('export with no bookmarks returns empty', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-json'));

    $data = json_decode($response->streamedContent(), true);
    expect($data)->toHaveCount(0);
});

test('export does not leak other users bookmarks', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    Bookmark::factory()->create(['user_id' => $user->id, 'title' => 'My Bookmark']);
    Bookmark::factory()->create(['user_id' => $other->id, 'title' => 'Other Bookmark']);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-json'));

    $data = json_decode($response->streamedContent(), true);
    expect($data)->toHaveCount(1);
    expect($data[0]['title'])->toBe('My Bookmark');
});

test('exported html groups bookmarks by category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id, 'name' => 'Work']);
    Bookmark::factory()->create(['user_id' => $user->id, 'category_id' => $category->id, 'title' => 'Work Bookmark']);
    Bookmark::factory()->create(['user_id' => $user->id, 'category_id' => null, 'title' => 'Uncategorized Bookmark']);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.export-html'));

    $content = $response->streamedContent();
    expect($content)->toContain('<H3>Work</H3>');
    expect($content)->toContain('Work Bookmark');
    expect($content)->toContain('Uncategorized Bookmark');
});
