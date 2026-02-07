import type { ColumnDef } from '@tanstack/react-table';
import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon, type IconName } from '@/components/ui/icon-picker';
import type { Category } from '@/types';

interface GetColumnsProps {
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

export function getColumns({
    onEdit,
    onDelete,
}: GetColumnsProps): ColumnDef<Category>[] {
    return [
        {
            accessorKey: 'name',
            header: 'Category',
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{
                                backgroundColor: category.color
                                    ? `${category.color}20`
                                    : undefined,
                            }}
                        >
                            {category.icon ? (
                                <Icon
                                    name={category.icon as IconName}
                                    className="h-4 w-4"
                                    style={{
                                        color: category.color || undefined,
                                    }}
                                />
                            ) : (
                                <Folder
                                    className="h-4 w-4"
                                    style={{
                                        color: category.color || undefined,
                                    }}
                                />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">{category.name}</span>
                            {category.description && (
                                <span className="text-xs text-muted-foreground">
                                    {category.description}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'color',
            header: 'Color',
            cell: ({ row }) => {
                const category = row.original;
                if (!category.color) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                            {category.color}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(category)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(category)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
}
