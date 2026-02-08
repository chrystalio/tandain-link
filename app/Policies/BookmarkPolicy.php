<?php

namespace App\Policies;

use App\Concerns\VerifiesOwnership;
use App\Models\Bookmark;
use App\Models\User;

class BookmarkPolicy
{
    use VerifiesOwnership;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Bookmark $bookmark): bool
    {
        return $this->ownsModel($user, $bookmark);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Bookmark $bookmark): bool
    {
        return $this->ownsModel($user, $bookmark);
    }

    public function delete(User $user, Bookmark $bookmark): bool
    {
        return $this->ownsModel($user, $bookmark);
    }

    public function restore(User $user, Bookmark $bookmark): bool
    {
        return $this->ownsModel($user, $bookmark);
    }

    public function forceDelete(User $user, Bookmark $bookmark): bool
    {
        return $this->ownsModel($user, $bookmark);
    }
}
