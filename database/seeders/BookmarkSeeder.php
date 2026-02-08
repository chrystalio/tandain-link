<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class BookmarkSeeder extends Seeder
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

        $categories = $user->categories()->pluck('id', 'name');
        $tags = $user->tags()->pluck('id', 'name');

        $bookmarks = [
            [
                'url' => 'https://laravel.com/docs',
                'title' => 'Laravel Documentation',
                'description' => 'Official Laravel framework documentation.',
                'category' => 'Development',
                'tags' => ['laravel', 'php'],
            ],
            [
                'url' => 'https://react.dev',
                'title' => 'React Documentation',
                'description' => 'The library for web and native user interfaces.',
                'category' => 'Development',
                'tags' => ['react', 'javascript'],
            ],
            [
                'url' => 'https://www.typescriptlang.org/docs',
                'title' => 'TypeScript Handbook',
                'description' => 'Learn TypeScript from the official documentation.',
                'category' => 'Learning',
                'tags' => ['typescript', 'tutorial'],
            ],
            [
                'url' => 'https://tailwindcss.com',
                'title' => 'Tailwind CSS',
                'description' => 'A utility-first CSS framework for rapid UI development.',
                'category' => 'Design',
                'tags' => ['css'],
            ],
            [
                'url' => 'https://github.com',
                'title' => 'GitHub',
                'description' => 'Where the world builds software.',
                'category' => 'Tools',
                'tags' => ['open-source'],
            ],
            [
                'url' => 'https://pestphp.com',
                'title' => 'Pest PHP Testing Framework',
                'description' => 'An elegant PHP testing framework.',
                'category' => 'Development',
                'tags' => ['php', 'reference'],
            ],
        ];

        foreach ($bookmarks as $data) {
            $bookmark = $user->bookmarks()->create([
                'url' => $data['url'],
                'title' => $data['title'],
                'description' => $data['description'],
                'category_id' => $categories->get($data['category']),
            ]);

            $tagIds = collect($data['tags'])
                ->map(fn (string $name) => $tags->get($name))
                ->filter()
                ->values()
                ->all();

            $bookmark->tags()->sync($tagIds);
        }
    }
}
