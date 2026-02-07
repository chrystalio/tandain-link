import { Head, router, usePage } from '@inertiajs/react';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { Folder, FolderOpen, PlusCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    index,
} from '@/actions/App/Http/Controllers/CategoryController';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { CategoryFormModal } from '@/pages/categories/category-form-modal';
import { getColumns } from '@/pages/categories/columns';
import type {
    BreadcrumbItem,
    Category,
    PaginatedData,
    SharedData,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: index.url(),
    },
];

interface CategoriesIndexProps {
    categories: PaginatedData<Category>;
}

export default function Index({ categories }: CategoriesIndexProps) {
    const { flash } = usePage<SharedData>().props;
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null,
    );
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleCreate = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = useCallback((category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback((category: Category) => {
        setDeletingCategory(category);
        setDeleteConfirmText('');
        setIsDeleteDialogOpen(true);
    }, []);

    const confirmDelete = () => {
        if (deletingCategory && deleteConfirmText === deletingCategory.name) {
            router.delete(destroy.url(deletingCategory.slug), {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setDeletingCategory(null);
                    setDeleteConfirmText('');
                },
            });
        }
    };

    const canDelete =
        deletingCategory && deleteConfirmText === deletingCategory.name;

    const columns = useMemo(
        () => getColumns({ onEdit: handleEdit, onDelete: handleDelete }),
        [handleEdit, handleDelete],
    );

    const handlePageChange = (page: number) => {
        router.get(index.url(), { page }, { preserveScroll: true });
    };

    const handlePageSizeChange = (pageSize: number) => {
        router.get(
            index.url(),
            { per_page: pageSize, page: 1 },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <div className="mx-8 my-4">
                <div className="my-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5">
                        <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your categories here.
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter by category name..."
                                value={
                                    (columnFilters.find((f) => f.id === 'name')
                                        ?.value as string) ?? ''
                                }
                                onChange={(e) =>
                                    setColumnFilters([
                                        { id: 'name', value: e.target.value },
                                    ])
                                }
                                className="w-full sm:w-64"
                            />
                            <Button
                                className="w-full sm:w-auto"
                                onClick={handleCreate}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
                        </div>

                        <div className="grid">
                            <div className="overflow-x-auto">
                                <DataTable
                                    data={categories.data}
                                    columns={columns}
                                    columnFilters={columnFilters}
                                    onColumnFiltersChange={setColumnFilters}
                                    pageCount={categories.last_page}
                                    currentPage={categories.current_page}
                                    pageSize={categories.per_page}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CategoryFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                category={editingCategory}
            />

            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    This action cannot be undone. This will
                                    permanently delete the category
                                    <span className="font-semibold">
                                        {' '}
                                        {deletingCategory?.name}
                                    </span>
                                    .
                                </p>
                                <p className="text-foreground">
                                    Please type{' '}
                                    <span className="font-semibold">
                                        {deletingCategory?.name}
                                    </span>{' '}
                                    to confirm.
                                </p>
                                <Input
                                    value={deleteConfirmText}
                                    onChange={(e) =>
                                        setDeleteConfirmText(e.target.value)
                                    }
                                    placeholder="Type category name to confirm"
                                    className="mt-2 bg-background"
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={!canDelete}
                            className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
