import { Form, Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/CategoryController';
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

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedCategories {
    data: Category[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: index().url,
    },
];

export default function CategoriesIndex({
    categories,
}: {
    categories: PaginatedCategories;
}) {
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Categories"
                        description="Organize your bookmarks into categories"
                    />
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-1 size-4" />
                                New category
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create category</DialogTitle>
                                <DialogDescription>
                                    Add a new category to organize your
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
                                                placeholder="e.g. Development"
                                                maxLength={100}
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="create-description">
                                                Description{' '}
                                                <span className="text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                id="create-description"
                                                name="description"
                                                placeholder="A short description"
                                                maxLength={500}
                                            />
                                            <InputError
                                                message={errors.description}
                                            />
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

                {categories.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <p className="text-muted-foreground">
                            No categories yet. Create one to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {categories.data.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium">
                                        {category.name}
                                    </p>
                                    {category.description && (
                                        <p className="truncate text-sm text-muted-foreground">
                                            {category.description}
                                        </p>
                                    )}
                                </div>
                                <div className="ml-4 flex items-center gap-1">
                                    <Dialog
                                        open={
                                            editingCategory?.id === category.id
                                        }
                                        onOpenChange={(open) =>
                                            setEditingCategory(
                                                open ? category : null,
                                            )
                                        }
                                    >
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="size-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Edit category
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Update the category details.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form
                                                {...update.form(category.slug)}
                                                options={{
                                                    preserveScroll: true,
                                                }}
                                                onSuccess={() =>
                                                    setEditingCategory(null)
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
                                                                    category.name
                                                                }
                                                                maxLength={100}
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors.name
                                                                }
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-description">
                                                                Description{' '}
                                                                <span className="text-muted-foreground">
                                                                    (optional)
                                                                </span>
                                                            </Label>
                                                            <Input
                                                                id="edit-description"
                                                                name="description"
                                                                defaultValue={
                                                                    category.description ??
                                                                    ''
                                                                }
                                                                maxLength={500}
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors.description
                                                                }
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <DialogClose
                                                                asChild
                                                            >
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

                                    <DeleteCategoryButton category={category} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function DeleteCategoryButton({ category }: { category: Category }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete category</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &ldquo;{category.name}
                        &rdquo;? Bookmarks in this category will become
                        uncategorized.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            router.delete(destroy.url(category.slug), {
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
