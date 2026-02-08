<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Bookmark>
 */
class BookmarkFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'url' => fake()->url(),
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->sentence(),
            'notes' => fake()->optional()->paragraph(),
        ];
    }

    public function withCategory(?Category $category = null): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $category?->id ?? Category::factory()->create(['user_id' => $attributes['user_id']])->id,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn () => [
            'is_archived' => true,
        ]);
    }
}
