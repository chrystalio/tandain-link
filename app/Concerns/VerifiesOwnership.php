<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait VerifiesOwnership
{
    protected function ownsModel(User $user, Model $model): bool
    {
        return $user->id === $model->user_id;
    }
}
