<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookmarkRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'url' => ['required', 'url:http,https', 'max:2048'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:10000'],
            'category_id' => [
                'nullable',
                'ulid',
                Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
            ],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => [
                'ulid',
                Rule::exists('tags', 'id')->where('user_id', $this->user()->id),
            ],
        ];
    }
}
