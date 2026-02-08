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

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}
