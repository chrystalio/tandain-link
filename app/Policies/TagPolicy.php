<?php

namespace App\Policies;

use App\Concerns\VerifiesOwnership;
use App\Models\Tag;
use App\Models\User;

class TagPolicy
{
    use VerifiesOwnership;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Tag $tag): bool
    {
        return $this->ownsModel($user, $tag);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Tag $tag): bool
    {
        return $this->ownsModel($user, $tag);
    }

    public function delete(User $user, Tag $tag): bool
    {
        return $this->ownsModel($user, $tag);
    }
}
