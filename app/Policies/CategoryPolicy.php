<?php

namespace App\Policies;

use App\Concerns\VerifiesOwnership;
use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    use VerifiesOwnership;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Category $category): bool
    {
        return $this->ownsModel($user, $category);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Category $category): bool
    {
        return $this->ownsModel($user, $category);
    }

    public function delete(User $user, Category $category): bool
    {
        return $this->ownsModel($user, $category);
    }
}
