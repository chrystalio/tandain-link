<?php

use App\Models\Tag;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests cannot access tags', function () {
    $this->get(route('tags.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view their tags', function () {
    $user = User::factory()->create();
    Tag::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('tags.index'));

    $response->assertOk();
});

test('users can create a tag', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('tags.store'), [
            'name' => 'javascript',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('tags', [
        'user_id' => $user->id,
        'name' => 'javascript',
        'slug' => 'javascript',
    ]);
});

test('tag name is required', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('tags.store'), [
            'name' => '',
        ]);

    $response->assertSessionHasErrors('name');
});

test('tag name must be unique per user', function () {
    $user = User::factory()->create();
    Tag::factory()->create(['user_id' => $user->id, 'name' => 'existing']);

    $response = $this->actingAs($user)
        ->post(route('tags.store'), [
            'name' => 'existing',
        ]);

    $response->assertSessionHasErrors('name');
});

test('different users can have the same tag name', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    Tag::factory()->create(['user_id' => $user1->id, 'name' => 'shared']);

    $response = $this->actingAs($user2)
        ->post(route('tags.store'), [
            'name' => 'shared',
        ]);

    $response->assertSessionHasNoErrors()->assertRedirect();

    $this->assertDatabaseHas('tags', [
        'user_id' => $user2->id,
        'name' => 'shared',
    ]);
});

test('users can update their tag', function () {
    $user = User::factory()->create();
    $tag = Tag::factory()->create(['user_id' => $user->id, 'name' => 'old-tag']);

    $response = $this->actingAs($user)
        ->put(route('tags.update', $tag->slug), [
            'name' => 'new-tag',
        ]);

    $response->assertRedirect();

    $tag->refresh();
    expect($tag->name)->toBe('new-tag');
    expect($tag->slug)->toBe('new-tag');
});

test('users cannot update another users tag', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $tag = Tag::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->put(route('tags.update', $tag->slug), [
            'name' => 'hijacked',
        ]);

    $response->assertNotFound();
});

test('users can delete their tag', function () {
    $user = User::factory()->create();
    $tag = Tag::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->delete(route('tags.destroy', $tag->slug));

    $response->assertRedirect();

    $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
});

test('users cannot delete another users tag', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $tag = Tag::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->delete(route('tags.destroy', $tag->slug));

    $response->assertNotFound();

    $this->assertDatabaseHas('tags', ['id' => $tag->id]);
});

test('tag slug is auto-generated from name', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('tags.store'), [
            'name' => 'My Cool Tag',
        ]);

    $this->assertDatabaseHas('tags', [
        'user_id' => $user->id,
        'slug' => 'my-cool-tag',
    ]);
});
