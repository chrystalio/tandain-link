import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/CategoryController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Category } from '@/types';
import { Icon, IconPicker, type IconName } from '@/components/ui/icon-picker';
import { Textarea } from '@/components/ui/textarea';

interface CategoryFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
}

export function CategoryFormModal({
    open,
    onOpenChange,
    category,
}: CategoryFormModalProps) {
    const isEditing = !!category;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: category?.name ?? '',
        description: category?.description ?? '',
        color: category?.color ?? '#3b82f6',
        icon: category?.icon ?? '',
    });

    useEffect(() => {
        if (open) {
            setData({
                name: category?.name ?? '',
                description: category?.description ?? '',
                color: category?.color ?? '#3b82f6',
                icon: category?.icon ?? '',
            });
        }
    }, [open, category, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(update.url(category.slug), {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post(store.url(), {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Category' : 'Add Category'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the category details below.'
                            : 'Fill in the details to create a new category.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Enter category name"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Short description (max 100 characters)"
                                maxLength={100}
                                rows={2}
                            />
                            <p className="text-xs text-muted-foreground">
                                {data.description.length}/100 characters
                            </p>
                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        '#ef4444',
                                        '#f97316',
                                        '#f59e0b',
                                        '#eab308',
                                        '#84cc16',
                                        '#22c55e',
                                        '#10b981',
                                        '#14b8a6',
                                        '#06b6d4',
                                        '#0ea5e9',
                                        '#3b82f6',
                                        '#6366f1',
                                        '#8b5cf6',
                                        '#a855f7',
                                        '#d946ef',
                                        '#ec4899',
                                    ].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                                data.color === color
                                                    ? 'border-foreground ring-2 ring-offset-2'
                                                    : 'border-transparent'
                                            }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() =>
                                                setData('color', color)
                                            }
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={data.color}
                                            onChange={(e) =>
                                                setData('color', e.target.value)
                                            }
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                        <div
                                            className="flex h-9 w-9 items-center justify-center rounded-md border"
                                            style={{
                                                backgroundColor: data.color,
                                            }}
                                        />
                                    </div>
                                    <Input
                                        value={data.color}
                                        onChange={(e) =>
                                            setData('color', e.target.value)
                                        }
                                        placeholder="#000000"
                                        className="flex-1 font-mono text-sm"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            {errors.color && (
                                <p className="text-sm text-destructive">
                                    {errors.color}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Icon</Label>
                            <IconPicker
                                value={data.icon as IconName | undefined}
                                onValueChange={(value) =>
                                    setData('icon', value)
                                }
                                triggerPlaceholder="Select an icon"
                                modal={true}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    {data.icon ? (
                                        <>
                                            <Icon
                                                name={data.icon as IconName}
                                                className="mr-2 h-4 w-4"
                                            />
                                            {data.icon}
                                        </>
                                    ) : (
                                        'Select an icon'
                                    )}
                                </Button>
                            </IconPicker>
                            {errors.icon && (
                                <p className="text-sm text-destructive">
                                    {errors.icon}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update Category'
                                    : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
