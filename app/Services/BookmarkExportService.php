<?php

namespace App\Services;

use App\Models\User;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookmarkExportService
{
    public function __construct(private User $user) {}

    public function exportHtml(?string $categorySlug = null): StreamedResponse
    {
        return response()->streamDownload(function () use ($categorySlug): void {
            $query = $this->user->bookmarks()->with(['category', 'tags']);

            if ($categorySlug !== null) {
                $query->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
            }

            echo "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n";
            echo "<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n";
            echo "<TITLE>Bookmarks</TITLE>\n";
            echo "<H1>Bookmarks</H1>\n";
            echo "<DL><p>\n";

            $currentCategory = null;
            $inFolder = false;

            $query->orderBy('category_id')->latest()->lazy(100)->each(function ($bookmark) use (&$currentCategory, &$inFolder): void {
                $categoryName = $bookmark->category?->name;

                if ($categoryName !== $currentCategory) {
                    if ($inFolder) {
                        echo "    </DL><p>\n";
                        $inFolder = false;
                    }

                    if ($categoryName !== null) {
                        echo '    <DT><H3>'.htmlspecialchars($categoryName, ENT_QUOTES, 'UTF-8')."</H3>\n";
                        echo "    <DL><p>\n";
                        $inFolder = true;
                    }

                    $currentCategory = $categoryName;
                }

                $indent = $inFolder ? '        ' : '    ';
                $addDate = $bookmark->created_at->timestamp;
                $url = htmlspecialchars($bookmark->url, ENT_QUOTES, 'UTF-8');
                $title = htmlspecialchars($bookmark->title, ENT_QUOTES, 'UTF-8');

                echo "{$indent}<DT><A HREF=\"{$url}\" ADD_DATE=\"{$addDate}\">{$title}</A>\n";

                if ($bookmark->description) {
                    $desc = htmlspecialchars($bookmark->description, ENT_QUOTES, 'UTF-8');
                    echo "{$indent}<DD>{$desc}\n";
                }
            });

            if ($inFolder) {
                echo "    </DL><p>\n";
            }

            echo "</DL><p>\n";
        }, 'bookmarks.html', ['Content-Type' => 'text/html']);
    }

    public function exportJson(?string $categorySlug = null): StreamedResponse
    {
        return response()->streamDownload(function () use ($categorySlug): void {
            $query = $this->user->bookmarks()->with(['category', 'tags']);

            if ($categorySlug !== null) {
                $query->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
            }

            echo '[';
            $first = true;

            $query->latest()->lazy(100)->each(function ($bookmark) use (&$first): void {
                if (! $first) {
                    echo ',';
                }

                echo json_encode([
                    'url' => $bookmark->url,
                    'title' => $bookmark->title,
                    'description' => $bookmark->description,
                    'notes' => $bookmark->notes,
                    'category' => $bookmark->category?->name,
                    'tags' => $bookmark->tags->pluck('name')->all(),
                    'is_archived' => $bookmark->is_archived,
                    'created_at' => $bookmark->created_at->toIso8601String(),
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

                $first = false;
            });

            echo ']';
        }, 'bookmarks.json', ['Content-Type' => 'application/json']);
    }
}
