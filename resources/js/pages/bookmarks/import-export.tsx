import { Head, useForm, usePage } from '@inertiajs/react';
import {
    ArrowUpFromLine,
    ArrowDownToLine,
    CheckCircle2,
    FileCode,
    FileJson,
    FolderUp,
    Info,
    Upload,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

import {
    importMethod,
    exportHtml,
    exportJson,
} from '@/actions/App/Http/Controllers/BookmarkImportExportController';
import { index } from '@/actions/App/Http/Controllers/BookmarkController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Bookmarks', href: index.url() },
    { title: 'Import / Export', href: '#' },
];

interface ImportExportProps {
    categories: Pick<Category, 'id' | 'name' | 'slug'>[];
}

export default function ImportExport({ categories }: ImportExportProps) {
    const { flash } = usePage<SharedData>().props;
    const [exportCategory, setExportCategory] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{
        file: File | null;
        map_folders: boolean;
    }>({
        file: null,
        map_folders: true,
    });

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        post(importMethod.url(), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
            setData('file', file);
        }
    };

    const getExportUrl = (type: 'html' | 'json') => {
        const exportFn = type === 'html' ? exportHtml : exportJson;
        if (exportCategory && exportCategory !== 'all') {
            return exportFn.url({ query: { category: exportCategory } });
        }
        return exportFn.url();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import / Export Bookmarks" />

            <div className="mx-4 my-4 sm:mx-8">
                {/* Header */}
                <div className="my-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5">
                        <ArrowUpFromLine className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Import / Export
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Import bookmarks from your browser or export your collection.
                        </p>
                    </div>
                </div>

                {/* Flash messages */}
                {flash.success && (
                    <div className="mb-6 flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="mb-6 flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <XCircle className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Two-column layout */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Import Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <Upload className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Import Bookmarks</h3>
                                    <p className="text-xs text-muted-foreground">
                                        From Chrome, Firefox, Safari, or Edge
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleImport} className="space-y-4">
                                {/* Drop zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                                        dragOver
                                            ? 'border-primary bg-primary/5'
                                            : data.file
                                              ? 'border-green-500/30 bg-green-500/5'
                                              : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                                    }`}
                                >
                                    {data.file ? (
                                        <>
                                            <FolderUp className="mb-2 h-8 w-8 text-green-400" />
                                            <p className="text-sm font-medium">{data.file.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {(data.file.size / 1024).toFixed(1)} KB
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setData('file', null)}
                                                className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
                                            >
                                                Remove file
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpFromLine className="mb-2 h-8 w-8 text-muted-foreground/40" />
                                            <p className="text-sm text-muted-foreground">
                                                Drag and drop your bookmark file here
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground/60">
                                                or
                                            </p>
                                            <label
                                                htmlFor="file"
                                                className="mt-2 cursor-pointer text-sm font-medium text-primary hover:underline"
                                            >
                                                Browse files
                                            </label>
                                            <input
                                                id="file"
                                                type="file"
                                                accept=".html,.htm"
                                                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                                className="sr-only"
                                            />
                                        </>
                                    )}
                                </div>
                                <InputError message={errors.file} />

                                {/* Options */}
                                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2.5">
                                    <Checkbox
                                        id="map_folders"
                                        checked={data.map_folders}
                                        onCheckedChange={(checked) => setData('map_folders', checked === true)}
                                    />
                                    <Label htmlFor="map_folders" className="cursor-pointer text-sm font-normal">
                                        Create categories from bookmark folders
                                    </Label>
                                </div>

                                <Button type="submit" variant="default" className="w-full" disabled={processing || !data.file}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {processing ? 'Importing...' : 'Import Bookmarks'}
                                </Button>
                            </form>

                            {/* Supported formats hint */}
                            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>
                                    Accepts Netscape Bookmark HTML files (.html, .htm). Duplicate URLs are automatically skipped.
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Export Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <ArrowDownToLine className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Export Bookmarks</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Download your collection as a file
                                    </p>
                                </div>
                            </div>

                            {/* Category filter */}
                            {categories.length > 0 && (
                                <div className="mb-5 grid gap-2">
                                    <Label className="text-xs text-muted-foreground">
                                        Filter by Category
                                    </Label>
                                    <Select value={exportCategory} onValueChange={setExportCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All bookmarks" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All bookmarks</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.slug}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Export format cards */}
                            <div className="space-y-3">
                                <a
                                    href={getExportUrl('html')}
                                    download
                                    className="group flex items-center gap-4 rounded-lg border border-transparent bg-muted/50 px-4 py-3.5 transition-colors hover:border-primary/20 hover:bg-primary/5"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-orange-500/10">
                                        <FileCode className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">HTML Format</p>
                                        <p className="text-xs text-muted-foreground">
                                            Netscape bookmark file — importable by any browser
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                                        .html
                                    </Badge>
                                </a>

                                <a
                                    href={getExportUrl('json')}
                                    download
                                    className="group flex items-center gap-4 rounded-lg border border-transparent bg-muted/50 px-4 py-3.5 transition-colors hover:border-primary/20 hover:bg-primary/5"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                                        <FileJson className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">JSON Format</p>
                                        <p className="text-xs text-muted-foreground">
                                            Structured data with categories, tags, and notes
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                                        .json
                                    </Badge>
                                </a>
                            </div>

                            {/* Info hint */}
                            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>
                                    Exports include all non-archived, non-trashed bookmarks. Use category filter to export a subset.
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
