<?php

return [
    'import' => [
        'max_file_size' => 10 * 1024 * 1024, // 10 MB
        'max_bookmarks' => 5000,
        'allowed_mimes' => ['text/html', 'text/plain']
    ],

    'metadata' => [
        'timeout' => 10, // seconds
        'max_redirects' => 3,
        'max_image_size' => 5 * 1024 * 1024, // 5 MB
        'image_max_dimensions' => 1200, // [width, height]
        'thumbnail_size' => '300',
        'allowed_image_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ]
];
