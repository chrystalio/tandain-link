<?php

use App\Models\Category;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests cannot access categories', function () {
    $this->get(route('categories.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view their categories', function () {
    $user = User::factory()->create();
    Category::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('categories.index'));

    $response->assertOk();
});

test('users can create a category', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'Development',
            'description' => 'Dev resources',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('categories', [
        'user_id' => $user->id,
        'name' => 'Development',
        'slug' => 'development',
        'description' => 'Dev resources',
    ]);
});

test('category name is required', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('categories.store'), [
            'name' => '',
        ]);

    $response->assertSessionHasErrors('name');
});

test('category name must be unique per user', function () {
    $user = User::factory()->create();
    Category::factory()->create(['user_id' => $user->id, 'name' => 'Existing']);

    $response = $this->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'Existing',
        ]);

    $response->assertSessionHasErrors('name');
});

test('different users can have the same category name', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    Category::factory()->create(['user_id' => $user1->id, 'name' => 'Shared Name']);

    $response = $this->actingAs($user2)
        ->post(route('categories.store'), [
            'name' => 'Shared Name',
        ]);

    $response->assertSessionHasNoErrors()->assertRedirect();

    $this->assertDatabaseHas('categories', [
        'user_id' => $user2->id,
        'name' => 'Shared Name',
    ]);
});

test('users can update their category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id, 'name' => 'Old Name']);

    $response = $this->actingAs($user)
        ->put(route('categories.update', $category->slug), [
            'name' => 'New Name',
            'description' => 'Updated description',
        ]);

    $response->assertRedirect();

    $category->refresh();
    expect($category->name)->toBe('New Name');
    expect($category->slug)->toBe('new-name');
    expect($category->description)->toBe('Updated description');
});

test('users cannot update another users category', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->put(route('categories.update', $category->slug), [
            'name' => 'Hijacked',
        ]);

    $response->assertNotFound();
});

test('users can delete their category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->delete(route('categories.destroy', $category->slug));

    $response->assertRedirect();

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

test('users cannot delete another users category', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($user)
        ->delete(route('categories.destroy', $category->slug));

    $response->assertNotFound();

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});

test('category slug is auto-generated from name', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'My Cool Category',
        ]);

    $this->assertDatabaseHas('categories', [
        'user_id' => $user->id,
        'slug' => 'my-cool-category',
    ]);
});

test('category description is optional', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'No Description',
        ]);

    $response->assertSessionHasNoErrors()->assertRedirect();

    $this->assertDatabaseHas('categories', [
        'user_id' => $user->id,
        'name' => 'No Description',
        'description' => null,
    ]);
});
