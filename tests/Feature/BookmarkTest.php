<?php

use App\Models\Bookmark;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests cannot access bookmarks', function () {
    $this->get(route('bookmarks.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view their bookmarks', function () {
    $this->withoutVite();
    $user = User::factory()->create();
    Bookmark::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('bookmarks.index'));

    $response->assertOk();
});

test('users can create a bookmark', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com',
            'title' => 'Example Site',
        ]);

    $response->assertRedirect(route('bookmarks.index'));

    $this->assertDatabaseHas('bookmarks', [
        'user_id' => $user->id,
        'url' => 'https://example.com',
        'title' => 'Example Site',
    ]);
});

test('bookmark url is required', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'title' => 'No URL',
        ]);

    $response->assertSessionHasErrors('url');
});

test('bookmark url must be http or https', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'javascript:alert(1)',
            'title' => 'XSS Attempt',
        ]);

    $response->assertSessionHasErrors('url');
});

test('bookmark title is required', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com',
            'title' => '',
        ]);

    $response->assertSessionHasErrors('title');
});

test('users can create a bookmark with category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com',
            'title' => 'Example',
            'category_id' => $category->id,
        ]);

    $response->assertRedirect(route('bookmarks.index'));

    $this->assertDatabaseHas('bookmarks', [
        'user_id' => $user->id,
        'category_id' => $category->id,
    ]);
});

test('users cannot assign another users category', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com',
            'title' => 'Example',
            'category_id' => $category->id,
        ]);

    $response->assertSessionHasErrors('category_id');
});

test('users can create a bookmark with tags', function () {
    $user = User::factory()->create();
    $tags = Tag::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com',
            'title' => 'Example',
            'tags' => $tags->pluck('id')->all(),
        ]);

    $response->assertRedirect(route('bookmarks.index'));

    $bookmark = Bookmark::where('user_id', $user->id)->first();
    expect($bookmark->tags)->toHaveCount(3);
});

test('users cannot assign another users tags', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $tag = Tag::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com',
            'title' => 'Example',
            'tags' => [$tag->id],
        ]);

    $response->assertSessionHasErrors('tags.0');
});

test('users can update their bookmark', function () {
    $user = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->put(route('bookmarks.update', $bookmark), [
            'url' => 'https://updated.com',
            'title' => 'Updated Title',
        ]);

    $response->assertRedirect();

    $bookmark->refresh();
    expect($bookmark->url)->toBe('https://updated.com');
    expect($bookmark->title)->toBe('Updated Title');
});

test('users cannot update another users bookmark', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->put(route('bookmarks.update', $bookmark), [
            'url' => 'https://hijacked.com',
            'title' => 'Hijacked',
        ]);

    $response->assertNotFound();
});

test('users can soft delete their bookmark', function () {
    $user = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->delete(route('bookmarks.destroy', $bookmark));

    $response->assertRedirect();

    $this->assertSoftDeleted('bookmarks', ['id' => $bookmark->id]);
});

test('users cannot delete another users bookmark', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->delete(route('bookmarks.destroy', $bookmark));

    $response->assertNotFound();
});

test('users can restore a trashed bookmark', function () {
    $user = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $user->id]);
    $bookmark->delete();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.restore', $bookmark));

    $response->assertRedirect();

    $bookmark->refresh();
    expect($bookmark->deleted_at)->toBeNull();
});

test('users can permanently delete a trashed bookmark', function () {
    $user = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $user->id]);
    $bookmark->delete();

    $response = $this->actingAs($user)
        ->delete(route('bookmarks.force-destroy', $bookmark));

    $response->assertRedirect();

    $this->assertDatabaseMissing('bookmarks', ['id' => $bookmark->id]);
});

test('users can toggle archive status', function () {
    $user = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $user->id, 'is_archived' => false]);

    $this->actingAs($user)
        ->patch(route('bookmarks.archive', $bookmark));

    $bookmark->refresh();
    expect($bookmark->is_archived)->toBeTrue();

    $this->actingAs($user)
        ->patch(route('bookmarks.archive', $bookmark));

    $bookmark->refresh();
    expect($bookmark->is_archived)->toBeFalse();
});

test('bookmark url is normalized on create', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com/page?utm_source=twitter&ref=docs',
            'title' => 'Example',
        ]);

    $this->assertDatabaseHas('bookmarks', [
        'user_id' => $user->id,
        'url' => 'https://example.com/page?ref=docs',
    ]);
});

test('bookmark notes are optional', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('bookmarks.store'), [
            'url' => 'https://example.com',
            'title' => 'Example',
            'notes' => 'Some notes here',
        ]);

    $response->assertRedirect(route('bookmarks.index'));

    $this->assertDatabaseHas('bookmarks', [
        'user_id' => $user->id,
        'notes' => 'Some notes here',
    ]);
});

test('tag sync replaces all tags on update', function () {
    $user = User::factory()->create();
    $bookmark = Bookmark::factory()->create(['user_id' => $user->id]);
    $oldTags = Tag::factory()->count(2)->create(['user_id' => $user->id]);
    $newTags = Tag::factory()->count(2)->create(['user_id' => $user->id]);
    $bookmark->tags()->sync($oldTags->pluck('id'));

    $this->actingAs($user)
        ->put(route('bookmarks.update', $bookmark), [
            'url' => $bookmark->url,
            'title' => $bookmark->title,
            'tags' => $newTags->pluck('id')->all(),
        ]);

    $bookmark->refresh();
    expect($bookmark->tags->pluck('id')->sort()->values()->all())
        ->toBe($newTags->pluck('id')->sort()->values()->all());
});
