<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();

        if (! $user) {
            return;
        }

        $categories = [
            ['name' => 'Development', 'description' => 'Programming and software development resources'],
            ['name' => 'Design', 'description' => 'UI/UX design inspiration and tools'],
            ['name' => 'Articles', 'description' => 'Blog posts and articles to read'],
            ['name' => 'Tools', 'description' => 'Useful online tools and services'],
            ['name' => 'Learning', 'description' => 'Tutorials and educational content'],
        ];

        foreach ($categories as $category) {
            $user->categories()->create($category);
        }
    }
}
