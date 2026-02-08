import { Head, Link, useForm } from '@inertiajs/react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import {
    index,
    update,
} from '@/actions/App/Http/Controllers/BookmarkController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Bookmark, BreadcrumbItem, Category, Tag } from '@/types';

interface EditProps {
    bookmark: Bookmark;
    categories: Category[];
    tags: Tag[];
}

export default function BookmarksEdit({
    bookmark,
    categories,
    tags,
}: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Bookmarks',
            href: index.url(),
        },
        {
            title: 'Edit',
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description ?? '',
        notes: bookmark.notes ?? '',
        category_id: bookmark.category_id ?? '',
        tags: bookmark.tags.map((t) => t.id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update.url(bookmark.id));
    };

    const toggleTag = (tagId: string) => {
        setData(
            'tags',
            data.tags.includes(tagId)
                ? data.tags.filter((id) => id !== tagId)
                : [...data.tags, tagId],
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Bookmark" />

            <div className="mx-auto my-4 max-w-2xl px-4 sm:px-8">
                <div className="my-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5">
                        <BookmarkIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Edit Bookmark
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Update the bookmark details.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                            id="url"
                            type="url"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                            placeholder="https://example.com"
                            required
                        />
                        <InputError message={errors.url} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Page title"
                            required
                            maxLength={255}
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Brief description (optional)"
                            rows={2}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={data.category_id}
                            onValueChange={(value) =>
                                setData(
                                    'category_id',
                                    value === 'none' ? '' : value,
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    No category
                                </SelectItem>
                                {categories.map((category) => (
                                    <SelectItem
                                        key={category.id}
                                        value={category.id}
                                    >
                                        <span className="flex items-center gap-2">
                                            {category.color && (
                                                <span
                                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            category.color,
                                                    }}
                                                />
                                            )}
                                            {category.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.category_id} />
                    </div>

                    {tags.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => {
                                    const isSelected = data.tags.includes(
                                        tag.id,
                                    );
                                    return (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            <Badge
                                                variant={
                                                    isSelected
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                className="cursor-pointer transition-colors"
                                                style={
                                                    isSelected && tag.color
                                                        ? {
                                                              backgroundColor:
                                                                  tag.color,
                                                              borderColor:
                                                                  tag.color,
                                                          }
                                                        : tag.color
                                                          ? {
                                                                borderColor:
                                                                    tag.color,
                                                                color: tag.color,
                                                            }
                                                          : undefined
                                                }
                                            >
                                                {tag.name}
                                            </Badge>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.tags} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Your personal notes (optional)"
                            rows={4}
                        />
                        <InputError message={errors.notes} />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" type="button" asChild>
                            <Link href={index.url()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Bookmark'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
