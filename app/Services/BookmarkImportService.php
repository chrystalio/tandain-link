<?php

namespace App\Services;

use App\Models\Bookmark;
use App\Models\User;
use DOMDocument;
use DOMNode;
use DOMXPath;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookmarkImportService
{
    /** @var array<string, string> */
    private array $categoryMap = [];

    public function __construct(
        private User $user,
        private bool $mapFolders = true
    ) {}

    /**
     * @return array{total: int, imported: int, skipped: int, errors: string[]}
     */
    public function import(string $html): array
    {
        $parsed = $this->parseHtml($html);

        $maxBookmarks = config('tandainlink.import.max_bookmarks', 5000);
        if (count($parsed) > $maxBookmarks) {
            return [
                'total' => count($parsed),
                'imported' => 0,
                'skipped' => 0,
                'errors' => ["File contains more than {$maxBookmarks} bookmarks."],
            ];
        }

        return $this->processBookmarks($parsed);
    }

    /**
     * @return list<array{url: string, title: string, description: string|null, folder: string|null, add_date: int|null}>
     */
    private function parseHtml(string $html): array
    {
        $dom = new DOMDocument;
        @$dom->loadHTML($html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);

        $xpath = new DOMXPath($dom);
        $bookmarks = [];

        $links = $xpath->query('//a[@href]');

        if ($links === false) {
            return [];
        }

        foreach ($links as $link) {
            $url = $link->getAttribute('href');

            if (! str_starts_with($url, 'http://') && ! str_starts_with($url, 'https://')) {
                continue;
            }

            $title = trim($link->textContent);
            if ($title === '') {
                $title = $url;
            }

            $addDate = $link->getAttribute('add_date') ?: null;

            $description = $this->extractDescription($link);

            $folder = $this->extractFolderName($link);

            $bookmarks[] = [
                'url' => $url,
                'title' => Str::limit($title, 255, ''),
                'description' => $description ? Str::limit($description, 2000, '') : null,
                'folder' => $folder,
                'add_date' => $addDate ? (int) $addDate : null,
            ];
        }

        return $bookmarks;
    }

    private function extractDescription(DOMNode $linkNode): ?string
    {
        $dt = $linkNode->parentNode;
        if ($dt === null) {
            return null;
        }

        $next = $dt->nextSibling;

        while ($next !== null) {
            if ($next->nodeType === XML_TEXT_NODE) {
                $next = $next->nextSibling;

                continue;
            }

            if ($next->nodeName === 'dd') {
                $text = trim($next->textContent);

                return $text !== '' ? $text : null;
            }

            break;
        }

        return null;
    }

    private function extractFolderName(DOMNode $linkNode): ?string
    {
        $node = $linkNode->parentNode;

        while ($node !== null) {
            if ($node->nodeName === 'dl') {
                $prev = $node->previousSibling;

                while ($prev !== null) {
                    if ($prev->nodeType === XML_TEXT_NODE) {
                        $prev = $prev->previousSibling;

                        continue;
                    }

                    if ($prev->nodeName === 'dt') {
                        $h3 = null;
                        foreach ($prev->childNodes as $child) {
                            if ($child->nodeName === 'h3') {
                                $h3 = $child;
                                break;
                            }
                        }

                        if ($h3 !== null) {
                            $name = trim($h3->textContent);

                            return $name !== '' ? $name : null;
                        }
                    }

                    break;
                }
            }

            $node = $node->parentNode;
        }

        return null;
    }

    /**
     * @param  list<array{url: string, title: string, description: string|null, folder: string|null, add_date: int|null}>  $parsed
     * @return array{total: int, imported: int, skipped: int, errors: string[]}
     */
    private function processBookmarks(array $parsed): array
    {
        $imported = 0;
        $skipped = 0;
        $errors = [];

        $existingUrls = $this->user->bookmarks()
            ->pluck('url')
            ->map(fn (string $url) => Bookmark::normalizeUrl($url))
            ->flip()
            ->all();

        DB::transaction(function () use ($parsed, &$imported, &$skipped, &$errors, $existingUrls): void {
            foreach ($parsed as $item) {
                try {
                    $normalizedUrl = Bookmark::normalizeUrl($item['url']);

                    if (isset($existingUrls[$normalizedUrl])) {
                        $skipped++;

                        continue;
                    }

                    $categoryId = null;
                    if ($this->mapFolders && $item['folder'] !== null) {
                        $categoryId = $this->resolveCategory($item['folder']);
                    }

                    $bookmark = $this->user->bookmarks()->make([
                        'url' => $item['url'],
                        'title' => $item['title'],
                        'description' => $item['description'],
                        'category_id' => $categoryId,
                    ]);

                    if ($item['add_date']) {
                        $bookmark->created_at = date('Y-m-d H:i:s', $item['add_date']);
                    }

                    $bookmark->save();

                    $existingUrls[$normalizedUrl] = true;
                    $imported++;
                } catch (\Throwable $e) {
                    $errors[] = "Failed to import: {$item['url']}";
                }
            }
        });

        return [
            'total' => count($parsed),
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    private function resolveCategory(string $folderName): string
    {
        $key = mb_strtolower($folderName);

        if (isset($this->categoryMap[$key])) {
            return $this->categoryMap[$key];
        }

        $category = $this->user->categories()
            ->whereRaw('LOWER(name) = ?', [$key])
            ->first();

        if ($category === null) {
            $category = $this->user->categories()->create([
                'name' => Str::limit($folderName, 100, ''),
                'slug' => Str::slug($folderName),
            ]);
        }

        $this->categoryMap[$key] = $category->id;

        return $category->id;
    }
}
