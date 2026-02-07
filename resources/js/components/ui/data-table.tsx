"use client"

import * as React from "react"
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnFiltersState,
    getFilteredRowModel,
    getPaginationRowModel,
    OnChangeFn,
    getSortedRowModel,
    getExpandedRowModel,
    ExpandedState,
    Row,
    PaginationState,
} from '@tanstack/react-table';

import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    columnFilters?: ColumnFiltersState
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
    renderSubComponent?: (row: Row<TData>) => React.ReactElement;
    // Server-side pagination props
    pageCount?: number
    currentPage?: number
    pageSize?: number
    onPageChange?: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
}


export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                             columnFilters,
                                             onColumnFiltersChange,
                                             renderSubComponent,
                                             pageCount,
                                             currentPage = 1,
                                             pageSize: propPageSize = 10,
                                             onPageChange,
                                             onPageSizeChange,
                                         }: DataTableProps<TData, TValue>) {
    const [internalFilters, setInternalFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [expanded, setExpanded] = React.useState<ExpandedState>({})

    const isServerSide = pageCount !== undefined

    // For client-side pagination
    const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Use server props directly in server-side mode, internal state for client-side
    const pagination: PaginationState = isServerSide
        ? { pageIndex: currentPage - 1, pageSize: propPageSize }
        : internalPagination

    const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
        const newPagination = typeof updater === 'function' ? updater(pagination) : updater

        if (isServerSide) {
            if (newPagination.pageIndex !== pagination.pageIndex && onPageChange) {
                onPageChange(newPagination.pageIndex + 1)
            }
            if (newPagination.pageSize !== pagination.pageSize && onPageSizeChange) {
                onPageSizeChange(newPagination.pageSize)
            }
        } else {
            setInternalPagination(newPagination)
        }
    }

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onPaginationChange: handlePaginationChange,
        ...(isServerSide && {
            manualPagination: true,
            pageCount,
        }),
        state: {
            sorting,
            expanded,
            pagination,
            columnFilters: columnFilters ?? internalFilters,
        },
        onExpandedChange: setExpanded,
        getExpandedRowModel: getExpandedRowModel(),
        onColumnFiltersChange:
            onColumnFiltersChange ??
            ((updater) =>
                typeof updater === "function"
                    ? setInternalFilters(updater(internalFilters))
                    : setInternalFilters(updater)),
    })

    return (
        <div>
            <Table className="w-full">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <React.Fragment key={row.id}>
                                <TableRow data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                {row.getIsExpanded() && renderSubComponent && (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="p-0">
                                            {renderSubComponent(row)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <DataTablePagination table={table} />
        </div>
    )
}
