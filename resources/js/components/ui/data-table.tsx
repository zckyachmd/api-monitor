'use client';

import * as React from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    storageKey?: string; // persist pageSize and sorting
    bordered?: boolean; // show border around table
    pageSizeOptions?: number[]; // options for rows per page
    defaultPageSize?: number;
}
type ColumnMeta = { thClassName?: string; tdClassName?: string };
export function DataTable<TData, TValue>({
    columns,
    data,
    storageKey,
    bordered = false,
    pageSizeOptions = [5, 10, 20, 50, 100],
    defaultPageSize = 10,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>(() => {
        if (!storageKey) return [];
        try {
            const raw = localStorage.getItem(`${storageKey}:sorting`);
            return raw ? (JSON.parse(raw) as SortingState) : [];
        } catch {
            return [];
        }
    });
    const uid = React.useId();
    const [pageSize, setPageSize] = React.useState<number>(() => {
        if (!storageKey) return defaultPageSize;
        try {
            const raw = localStorage.getItem(`${storageKey}:pageSize`);
            const val = raw ? parseInt(raw, 10) : defaultPageSize;
            return Number.isFinite(val) && val > 0 ? val : defaultPageSize;
        } catch {
            return defaultPageSize;
        }
    });

    const table = useReactTable({
        data,
        columns,
        state: { sorting, pagination: { pageIndex: 0, pageSize } },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    React.useEffect(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(`${storageKey}:sorting`, JSON.stringify(sorting));
        } catch {
            // ignore
        }
    }, [sorting, storageKey]);

    React.useEffect(() => {
        table.setPageSize(pageSize);
        if (!storageKey) return;
        try {
            localStorage.setItem(`${storageKey}:pageSize`, String(pageSize));
        } catch {
            // ignore
        }
    }, [pageSize, storageKey, table]);

    const selectId = storageKey
        ? `rows-per-page-${String(storageKey).replace(/[^a-zA-Z0-9_-]/g, '-')}`
        : `rows-per-page-${uid}`;

    return (
        <div>
            <div className={'overflow-x-auto rounded-md min-h-48 ' + (bordered ? 'border' : '')}>
                <Table className="text-sm">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className={
                                            (header.column.columnDef.meta as ColumnMeta | undefined)
                                                ?.thClassName
                                        }
                                    >
                                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                            <button
                                                type="button"
                                                onClick={header.column.getToggleSortingHandler()}
                                                className="inline-flex items-center gap-1 select-none hover:text-foreground"
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                                {header.column.getIsSorted() ? (
                                                    header.column.getIsSorted() === 'asc' ? (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                                )}
                                            </button>
                                        ) : (
                                            flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={
                                                (
                                                    cell.column.columnDef.meta as
                                                        | ColumnMeta
                                                        | undefined
                                                )?.tdClassName
                                            }
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
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
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2 text-xs">
                    <label htmlFor={selectId}>Rows per page</label>
                    <select
                        id={selectId}
                        className="h-8 rounded-md border border-input bg-background px-2"
                        value={pageSize}
                        onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                    >
                        {pageSizeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-xs text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
