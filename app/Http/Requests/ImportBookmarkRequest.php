<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportBookmarkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:html,htm,txt', 'max:10240'],
            'map_folders' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Please select a bookmark file to import.',
            'file.mimes' => 'The file must be an HTML or TXT file.',
            'file.max' => 'The file must not be larger than 10MB.',
        ];
    }
}
