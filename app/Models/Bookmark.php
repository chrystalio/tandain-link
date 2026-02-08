<?php

namespace App\Models;

use Database\Factories\BookmarkFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bookmark extends Model
{
    /** @use HasFactory<BookmarkFactory> */
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'url',
        'title',
        'description',
        'og_image_path',
        'favicon_path',
        'notes',
        'is_archived',
        'category_id',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Bookmark $bookmark): void {
            $bookmark->url = self::normalizeUrl($bookmark->url);
        });

        static::updating(function (Bookmark $bookmark): void {
            if ($bookmark->isDirty('url')) {
                $bookmark->url = self::normalizeUrl($bookmark->url);
            }
        });
    }

    public static function normalizeUrl(string $url): string
    {
        $parsed = parse_url($url);

        if ($parsed === false) {
            return $url;
        }

        $removeParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

        if (isset($parsed['query'])) {
            parse_str($parsed['query'], $params);
            $params = array_diff_key($params, array_flip($removeParams));
            $parsed['query'] = empty($params) ? null : http_build_query($params);
        }

        return rtrim(self::buildUrl($parsed), '/');
    }

    /**
     * @param  array<string, mixed>  $parts
     */
    private static function buildUrl(array $parts): string
    {
        $url = '';

        if (isset($parts['scheme'])) {
            $url .= $parts['scheme'].'://';
        }

        if (isset($parts['user'])) {
            $url .= $parts['user'];
            if (isset($parts['pass'])) {
                $url .= ':'.$parts['pass'];
            }
            $url .= '@';
        }

        if (isset($parts['host'])) {
            $url .= $parts['host'];
        }

        if (isset($parts['port'])) {
            $url .= ':'.$parts['port'];
        }

        if (isset($parts['path'])) {
            $url .= $parts['path'];
        }

        if (! empty($parts['query'])) {
            $url .= '?'.$parts['query'];
        }

        return $url;
    }

    public function resolveRouteBinding($value, $field = null): ?self
    {
        return auth()->user()->bookmarks()->where($field ?? 'id', $value)->firstOrFail();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }
}
