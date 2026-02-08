import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    ArrowUpDown,
    Bookmark as BookmarkIcon,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronsUpDown,
    ExternalLink,
    Filter,
    FolderOpen,
    Globe,
    MoreHorizontal,
    NotepadText,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import {
    archive,
    create,
    destroy,
    edit,
    forceDestroy,
    index,
    restore,
} from '@/actions/App/Http/Controllers/BookmarkController';
import { index as importExportIndex } from '@/actions/App/Http/Controllers/BookmarkImportExportController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon-picker';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type {
    Bookmark,
    BreadcrumbItem,
    Category,
    PaginatedData,
    SharedData,
    Tag,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Bookmarks',
        href: index.url(),
    },
];

function getDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

type FilterTab = 'all' | 'archived' | 'trashed';

interface BookmarksIndexProps {
    bookmarks: PaginatedData<Bookmark>;
    filters: {
        search?: string;
        category?: string;
        tag?: string;
        archived?: string;
        trashed?: string;
        sort?: string;
        direction?: string;
    };
    categories: Category[];
    tags: Tag[];
}

export default function BookmarksIndex({
    bookmarks,
    filters,
    categories,
    tags: availableTags,
}: BookmarksIndexProps) {
    const { flash } = usePage<SharedData>().props;
    const [deleteBookmark, setDeleteBookmark] = useState<Bookmark | null>(null);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [tagOpen, setTagOpen] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const activeTab: FilterTab = filters.trashed
        ? 'trashed'
        : filters.archived
          ? 'archived'
          : 'all';

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success, { id: 'flash-success' });
        }
        if (flash.error) {
            toast.error(flash.error, { id: 'flash-error' });
        }
    }, [flash.success, flash.error]);

    const buildParams = (
        overrides: Record<string, string | number | undefined> = {},
    ) => {
        const params: Record<string, string | number> = {
            per_page: bookmarks.per_page,
        };
        const merged = { ...filters, ...overrides };
        if (merged.search) params.search = merged.search;
        if (merged.category) params.category = merged.category;
        if (merged.tag) params.tag = merged.tag;
        if (merged.archived) params.archived = 1;
        if (merged.trashed) params.trashed = 1;
        return params;
    };

    const debouncedSearch = useDebouncedCallback((value: string) => {
        router.get(
            index.url(),
            buildParams({ search: value || undefined, page: undefined }),
            { preserveState: true, preserveScroll: true },
        );
    }, 300);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

    const clearSearch = () => {
        setSearch('');
        router.get(
            index.url(),
            buildParams({ search: undefined, page: undefined }),
            { preserveState: true, preserveScroll: true },
        );
        searchInputRef.current?.focus();
    };

    const handleTabChange = (tab: FilterTab) => {
        const params: Record<string, string | number> = {
            per_page: bookmarks.per_page,
        };
        if (tab === 'archived') params.archived = 1;
        if (tab === 'trashed') params.trashed = 1;
        if (filters.category) params.category = filters.category;
        if (filters.tag) params.tag = filters.tag;
        if (filters.search) params.search = filters.search;
        router.get(index.url(), params, { preserveScroll: true });
    };

    const handleFilterChange = (
        key: 'category' | 'tag',
        value: string | undefined,
    ) => {
        router.get(
            index.url(),
            buildParams({ [key]: value, page: undefined }),
            { preserveScroll: true },
        );
    };

    const hasActiveFilters =
        !!filters.category || !!filters.tag || !!filters.search;

    const clearFilters = () => {
        setSearch('');
        const params: Record<string, string | number> = {
            per_page: bookmarks.per_page,
        };
        if (filters.archived) params.archived = 1;
        if (filters.trashed) params.trashed = 1;
        router.get(index.url(), params, { preserveScroll: true });
    };

    const handlePageChange = (page: number) => {
        router.get(
            index.url(),
            {
                page,
                per_page: bookmarks.per_page,
                ...filters,
            },
            { preserveScroll: true },
        );
    };

    const handlePageSizeChange = (perPage: number) => {
        router.get(
            index.url(),
            { per_page: perPage, page: 1, ...filters },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bookmarks" />

            <div className="mx-4 my-4 sm:mx-8">
                {/* Header */}
                <div className="my-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5">
                            <BookmarkIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-lg font-semibold tracking-tight">
                                Bookmarks
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Save and organize your favorite links.
                            </p>
                        </div>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                        <Button variant="outline" asChild className="flex-1 sm:flex-none">
                            <Link href={importExportIndex.url()}>
                                <ArrowUpDown className="mr-1 size-4" />
                                Import / Export
                            </Link>
                        </Button>
                        <Button asChild className="flex-1 sm:flex-none">
                            <Link href={create.url()}>
                                <Plus className="mr-1 size-4" />
                                Add Bookmark
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex flex-wrap items-center gap-1 border-b">
                    {(
                        [
                            { key: 'all', label: 'All' },
                            { key: 'archived', label: 'Archived' },
                            { key: 'trashed', label: 'Trash' },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleTabChange(tab.key)}
                            className={`relative px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                                activeTab === tab.key
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.key && (
                                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />
                            )}
                        </button>
                    ))}
                    <div className="ml-auto whitespace-nowrap text-sm text-muted-foreground">
                        {bookmarks.total}{' '}
                        {bookmarks.total === 1 ? 'bookmark' : 'bookmarks'}
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) =>
                                handleSearchChange(e.target.value)
                            }
                            placeholder="Search bookmarks by title, URL, description, or notes..."
                            className="h-9 w-full rounded-md border border-input bg-background px-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Clear search</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Popover
                        open={categoryOpen}
                        onOpenChange={setCategoryOpen}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 justify-between gap-1"
                            >
                                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                {filters.category
                                    ? categories.find(
                                          (c) => c.slug === filters.category,
                                      )?.name ?? 'All categories'
                                    : 'All categories'}
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[200px] p-0"
                            align="start"
                        >
                            <Command>
                                <CommandInput placeholder="Search categories..." />
                                <CommandList>
                                    <CommandEmpty>
                                        No categories found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all-categories"
                                            onSelect={() => {
                                                handleFilterChange(
                                                    'category',
                                                    undefined,
                                                );
                                                setCategoryOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={`mr-2 h-4 w-4 ${!filters.category ? 'opacity-100' : 'opacity-0'}`}
                                            />
                                            All categories
                                        </CommandItem>
                                        {categories.map((cat) => (
                                            <CommandItem
                                                key={cat.id}
                                                value={cat.name}
                                                onSelect={() => {
                                                    handleFilterChange(
                                                        'category',
                                                        filters.category ===
                                                            cat.slug
                                                            ? undefined
                                                            : cat.slug,
                                                    );
                                                    setCategoryOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${filters.category === cat.slug ? 'opacity-100' : 'opacity-0'}`}
                                                />
                                                {cat.color && (
                                                    <span
                                                        className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                cat.color,
                                                        }}
                                                    />
                                                )}
                                                {cat.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Popover open={tagOpen} onOpenChange={setTagOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 justify-between gap-1"
                            >
                                <Tags className="h-3.5 w-3.5 text-muted-foreground" />
                                {filters.tag
                                    ? availableTags.find(
                                          (t) => t.slug === filters.tag,
                                      )?.name ?? 'All tags'
                                    : 'All tags'}
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[200px] p-0"
                            align="start"
                        >
                            <Command>
                                <CommandInput placeholder="Search tags..." />
                                <CommandList>
                                    <CommandEmpty>
                                        No tags found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all-tags"
                                            onSelect={() => {
                                                handleFilterChange(
                                                    'tag',
                                                    undefined,
                                                );
                                                setTagOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={`mr-2 h-4 w-4 ${!filters.tag ? 'opacity-100' : 'opacity-0'}`}
                                            />
                                            All tags
                                        </CommandItem>
                                        {availableTags.map((tag) => (
                                            <CommandItem
                                                key={tag.id}
                                                value={tag.name}
                                                onSelect={() => {
                                                    handleFilterChange(
                                                        'tag',
                                                        filters.tag ===
                                                            tag.slug
                                                            ? undefined
                                                            : tag.slug,
                                                    );
                                                    setTagOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${filters.tag === tag.slug ? 'opacity-100' : 'opacity-0'}`}
                                                />
                                                {tag.color && (
                                                    <span
                                                        className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                tag.color,
                                                        }}
                                                    />
                                                )}
                                                {tag.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                            onClick={clearFilters}
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Bookmark Grid */}
                {bookmarks.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-12 text-center">
                        <BookmarkIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">
                            {activeTab === 'trashed'
                                ? 'Trash is empty.'
                                : activeTab === 'archived'
                                  ? 'No archived bookmarks.'
                                  : 'No bookmarks yet. Add one to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {bookmarks.data.map((bookmark) => (
                            <div
                                key={bookmark.id}
                                className="group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
                            >
                                {/* Top row: favicon + domain + actions */}
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <span className="flex-1 truncate text-xs text-muted-foreground">
                                        {getDomain(bookmark.url)}
                                    </span>
                                    {bookmark.category && (
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 gap-1 text-[10px]"
                                            style={{
                                                borderColor:
                                                    bookmark.category.color ??
                                                    undefined,
                                                color:
                                                    bookmark.category.color ??
                                                    undefined,
                                            }}
                                        >
                                            {bookmark.category.icon ? (
                                                <Icon
                                                    name={bookmark.category.icon as IconName}
                                                    className="h-2.5 w-2.5"
                                                />
                                            ) : (
                                                <FolderOpen className="h-2.5 w-2.5" />
                                            )}
                                            {bookmark.category.name}
                                        </Badge>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-7 w-7 shrink-0 p-0"
                                            >
                                                <span className="sr-only">
                                                    Actions
                                                </span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {activeTab === 'trashed' ? (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            router.post(
                                                                restore.url(
                                                                    bookmark.id,
                                                                ),
                                                                {},
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Restore
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setDeleteBookmark(
                                                                bookmark,
                                                            )
                                                        }
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete permanently
                                                    </DropdownMenuItem>
                                                </>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <a
                                                            href={bookmark.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Open link
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={edit.url(
                                                                bookmark.id,
                                                            )}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            router.patch(
                                                                archive.url(
                                                                    bookmark.id,
                                                                ),
                                                                {},
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {bookmark.is_archived ? (
                                                            <>
                                                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                                                Unarchive
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Archive className="mr-2 h-4 w-4" />
                                                                Archive
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setDeleteBookmark(
                                                                bookmark,
                                                            )
                                                        }
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Title */}
                                <a
                                    href={bookmark.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
                                >
                                    {bookmark.title}
                                </a>

                                {/* Description */}
                                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                    {bookmark.description || 'No description available.'}
                                </p>

                                {/* Tags */}
                                {bookmark.tags.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Tags className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        {bookmark.tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                                className="text-[10px]"
                                                style={{
                                                    backgroundColor: tag.color
                                                        ? `${tag.color}15`
                                                        : undefined,
                                                    color:
                                                        tag.color ?? undefined,
                                                }}
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Footer: timestamp + notes indicator */}
                                <div className="mt-auto flex items-center gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                                    <span>
                                        {timeAgo(bookmark.created_at)}
                                    </span>
                                    {bookmark.notes && (
                                        <span className="flex items-center gap-1" title="Has notes">
                                            <NotepadText className="h-3 w-3" />
                                            Notes
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {bookmarks.last_page > 1 && (
                    <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Per page</p>
                            <Select
                                value={`${bookmarks.per_page}`}
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
                            Page {bookmarks.current_page} of{' '}
                            {bookmarks.last_page}
                        </div>

                        <div className="flex items-center justify-center space-x-2 sm:justify-end">
                            <Button
                                variant="outline"
                                size="icon"
                                className="hidden size-8 lg:flex"
                                onClick={() => handlePageChange(1)}
                                disabled={bookmarks.current_page <= 1}
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
                                        bookmarks.current_page - 1,
                                    )
                                }
                                disabled={bookmarks.current_page <= 1}
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
                                        bookmarks.current_page + 1,
                                    )
                                }
                                disabled={
                                    bookmarks.current_page >=
                                    bookmarks.last_page
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
                                    handlePageChange(bookmarks.last_page)
                                }
                                disabled={
                                    bookmarks.current_page >=
                                    bookmarks.last_page
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
            </div>

            {/* Delete/Force Delete Dialog */}
            <Dialog
                open={!!deleteBookmark}
                onOpenChange={(open) => !open && setDeleteBookmark(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {activeTab === 'trashed'
                                ? 'Permanently delete bookmark'
                                : 'Delete bookmark'}
                        </DialogTitle>
                        <DialogDescription>
                            {activeTab === 'trashed'
                                ? 'This action cannot be undone. The bookmark will be permanently removed.'
                                : `Move "${deleteBookmark?.title}" to trash? You can restore it later.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteBookmark) {
                                    if (activeTab === 'trashed') {
                                        router.delete(
                                            forceDestroy.url(deleteBookmark.id),
                                            {
                                                preserveScroll: true,
                                                onSuccess: () =>
                                                    setDeleteBookmark(null),
                                            },
                                        );
                                    } else {
                                        router.delete(
                                            destroy.url(deleteBookmark.id),
                                            {
                                                preserveScroll: true,
                                                onSuccess: () =>
                                                    setDeleteBookmark(null),
                                            },
                                        );
                                    }
                                }
                            }}
                        >
                            {activeTab === 'trashed'
                                ? 'Delete permanently'
                                : 'Move to trash'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
