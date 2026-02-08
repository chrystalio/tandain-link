import { Form, Head, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
    Pencil,
    Plus,
    Tags,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/TagController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PaginatedData, SharedData, Tag } from '@/types';

const TAG_COLORS = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#84cc16',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tags',
        href: index.url(),
    },
];

function ColorPicker({
    name,
    defaultValue,
    error,
}: {
    name: string;
    defaultValue?: string | null;
    error?: string;
}) {
    const [color, setColor] = useState(defaultValue ?? '');

    return (
        <div className="grid gap-2">
            <Label>Color</Label>
            <input type="hidden" name={name} value={color} />
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                            !color
                                ? 'border-foreground ring-2 ring-offset-2'
                                : 'border-muted-foreground/30'
                        }`}
                        onClick={() => setColor('')}
                    >
                        <span className="text-xs text-muted-foreground">
                            --
                        </span>
                    </button>
                    {TAG_COLORS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                color === c
                                    ? 'border-foreground ring-2 ring-offset-2'
                                    : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Input
                            type="color"
                            value={color || '#3b82f6'}
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-md border"
                            style={{
                                backgroundColor: color || undefined,
                            }}
                        >
                            {!color && (
                                <span className="text-xs text-muted-foreground">
                                    --
                                </span>
                            )}
                        </div>
                    </div>
                    <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 font-mono text-sm"
                        maxLength={7}
                    />
                </div>
            </div>
            {error && <InputError message={error} />}
        </div>
    );
}

export default function TagsIndex({ tags }: { tags: PaginatedData<Tag> }) {
    const { flash } = usePage<SharedData>().props;
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTag, setDeleteTag] = useState<Tag | null>(null);

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success, { id: 'flash-success' });
        }
        if (flash.error) {
            toast.error(flash.error, { id: 'flash-error' });
        }
    }, [flash.success, flash.error]);

    const handlePageChange = (page: number) => {
        router.get(index.url(), { page, per_page: tags.per_page }, { preserveScroll: true });
    };

    const handlePageSizeChange = (perPage: number) => {
        router.get(index.url(), { per_page: perPage, page: 1 }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />

            <div className="mx-4 my-4 sm:mx-8">
                <div className="my-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5">
                        <Tags className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Tags
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Label your bookmarks with tags for flexible
                            filtering.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {tags.total}{' '}
                                {tags.total === 1 ? 'tag' : 'tags'}
                            </p>
                            <Dialog
                                open={createOpen}
                                onOpenChange={setCreateOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-1 size-4" />
                                        Add Tag
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create tag</DialogTitle>
                                        <DialogDescription>
                                            Add a new tag to label your
                                            bookmarks.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form
                                        {...store.form()}
                                        options={{ preserveScroll: true }}
                                        onSuccess={() => setCreateOpen(false)}
                                        resetOnSuccess
                                        className="space-y-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="create-name">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="create-name"
                                                        name="name"
                                                        required
                                                        placeholder="e.g. javascript"
                                                        maxLength={50}
                                                    />
                                                    <InputError
                                                        message={errors.name}
                                                    />
                                                </div>
                                                <ColorPicker
                                                    name="color"
                                                    error={errors.color}
                                                />
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        disabled={processing}
                                                    >
                                                        Create
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {tags.data.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                                <Tags className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">
                                    No tags yet. Create one to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {tags.data.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="group relative flex items-center gap-3 overflow-hidden rounded-lg border px-4 py-3 transition-shadow hover:shadow-sm"
                                    >
                                        {tag.color && (
                                            <span
                                                className="absolute inset-y-0 left-0 w-1"
                                                style={{
                                                    backgroundColor: tag.color,
                                                }}
                                            />
                                        )}
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                                            style={{
                                                backgroundColor: tag.color
                                                    ? `${tag.color}15`
                                                    : undefined,
                                            }}
                                        >
                                            <Tags
                                                className="h-4 w-4"
                                                style={{
                                                    color:
                                                        tag.color || undefined,
                                                }}
                                            />
                                        </div>
                                        <span className="flex-1 truncate text-sm font-medium">
                                            {tag.name}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-7 w-7 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                                >
                                                    <span className="sr-only">
                                                        Open menu
                                                    </span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setEditingTag(tag)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setDeleteTag(tag)
                                                    }
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}

                        {tags.last_page > 1 && (
                            <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium">
                                        Per page
                                    </p>
                                    <Select
                                        value={`${tags.per_page}`}
                                        onValueChange={(value) =>
                                            handlePageSizeChange(Number(value))
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 20, 30, 50].map((size) => (
                                                <SelectItem
                                                    key={size}
                                                    value={`${size}`}
                                                >
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="text-center text-sm font-medium sm:text-left">
                                    Page {tags.current_page} of{' '}
                                    {tags.last_page}
                                </div>

                                <div className="flex items-center justify-center space-x-2 sm:justify-end">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="hidden size-8 lg:flex"
                                        onClick={() => handlePageChange(1)}
                                        disabled={tags.current_page <= 1}
                                    >
                                        <span className="sr-only">
                                            Go to first page
                                        </span>
                                        <ChevronsLeft />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        onClick={() =>
                                            handlePageChange(
                                                tags.current_page - 1,
                                            )
                                        }
                                        disabled={tags.current_page <= 1}
                                    >
                                        <span className="sr-only">
                                            Go to previous page
                                        </span>
                                        <ChevronLeft />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        onClick={() =>
                                            handlePageChange(
                                                tags.current_page + 1,
                                            )
                                        }
                                        disabled={
                                            tags.current_page >= tags.last_page
                                        }
                                    >
                                        <span className="sr-only">
                                            Go to next page
                                        </span>
                                        <ChevronRight />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="hidden size-8 lg:flex"
                                        onClick={() =>
                                            handlePageChange(tags.last_page)
                                        }
                                        disabled={
                                            tags.current_page >= tags.last_page
                                        }
                                    >
                                        <span className="sr-only">
                                            Go to last page
                                        </span>
                                        <ChevronsRight />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog
                open={!!editingTag}
                onOpenChange={(open) => !open && setEditingTag(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit tag</DialogTitle>
                        <DialogDescription>
                            Update the tag details.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTag && (
                        <Form
                            key={editingTag.id}
                            {...update.form(editingTag.slug)}
                            options={{ preserveScroll: true }}
                            onSuccess={() => setEditingTag(null)}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                            id="edit-name"
                                            name="name"
                                            required
                                            defaultValue={editingTag.name}
                                            maxLength={50}
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <ColorPicker
                                        name="color"
                                        defaultValue={editingTag.color}
                                        error={errors.color}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="secondary">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button disabled={processing}>
                                            Save
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={!!deleteTag}
                onOpenChange={(open) => !open && setDeleteTag(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete tag</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;
                            {deleteTag?.name}&rdquo;? This tag will be removed
                            from all bookmarks.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteTag) {
                                    router.delete(destroy.url(deleteTag.slug), {
                                        preserveScroll: true,
                                        onSuccess: () => setDeleteTag(null),
                                    });
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
