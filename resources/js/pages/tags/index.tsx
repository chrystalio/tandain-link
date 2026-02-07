import { Form, Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/TagController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tag {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

interface PaginatedTags {
    data: Tag[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tags',
        href: index().url,
    },
];

export default function TagsIndex({ tags }: { tags: PaginatedTags }) {
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Tags"
                        description="Label your bookmarks with tags for flexible filtering"
                    />
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-1 size-4" />
                                New tag
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create tag</DialogTitle>
                                <DialogDescription>
                                    Add a new tag to label your bookmarks.
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
                                            <InputError message={errors.name} />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="secondary">
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button disabled={processing}>
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
                        <p className="text-muted-foreground">
                            No tags yet. Create one to get started.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.data.map((tag) => (
                            <div
                                key={tag.id}
                                className="flex items-center gap-1 rounded-lg border px-3 py-2"
                            >
                                <span className="text-sm font-medium">
                                    {tag.name}
                                </span>
                                <Dialog
                                    open={editingTag?.id === tag.id}
                                    onOpenChange={(open) =>
                                        setEditingTag(open ? tag : null)
                                    }
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6"
                                        >
                                            <Pencil className="size-3" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit tag</DialogTitle>
                                            <DialogDescription>
                                                Update the tag name.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <Form
                                            {...update.form(tag.slug)}
                                            options={{ preserveScroll: true }}
                                            onSuccess={() =>
                                                setEditingTag(null)
                                            }
                                            className="space-y-4"
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="edit-name">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            id="edit-name"
                                                            name="name"
                                                            required
                                                            defaultValue={
                                                                tag.name
                                                            }
                                                            maxLength={50}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.name
                                                            }
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">
                                                                Cancel
                                                            </Button>
                                                        </DialogClose>
                                                        <Button
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Save
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>

                                <DeleteTagButton tag={tag} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function DeleteTagButton({ tag }: { tag: Tag }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6">
                    <Trash2 className="size-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete tag</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &ldquo;{tag.name}
                        &rdquo;? This tag will be removed from all bookmarks.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            router.delete(destroy.url(tag.slug), {
                                preserveScroll: true,
                                onSuccess: () => setOpen(false),
                            });
                        }}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
