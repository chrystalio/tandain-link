export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    flash: {
        success: string | null;
        error: string | null;
    };
    [key: string]: unknown;
};

export interface Category {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    created_at: string;
    updated_at: string;
}

export interface Tag {
    id: string;
    slug: string;
    name: string;
    color: string | null;
    created_at: string;
    updated_at: string;
}

export interface Bookmark {
    id: string;
    url: string;
    title: string;
    description: string | null;
    og_image_path: string | null;
    favicon_path: string | null;
    notes: string | null;
    is_archived: boolean;
    category_id: string | null;
    category: Category | null;
    tags: Tag[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}
