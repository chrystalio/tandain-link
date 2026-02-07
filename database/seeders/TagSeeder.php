<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
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

        $tags = ['laravel', 'react', 'typescript', 'php', 'css', 'javascript', 'tutorial', 'reference', 'open-source'];

        foreach ($tags as $tag) {
            $user->tags()->create(['name' => $tag]);
        }
    }
}
