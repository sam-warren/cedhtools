"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from "@tanstack/react-table";

import { DataTableViewOptions } from "@/components/ui/column-toggle";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React from "react";

/**
 * Props interface for the DataTable component.
 * @template TData - The type of data being displayed in the table
 * @template TValue - The type of values in the table cells
 */
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableRowSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableColumnVisibility?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  globalFilter?: boolean;
  filterableColumns?: string[];
}

/**
 * A flexible and feature-rich data table component built on top of TanStack Table.
 * 
 * @example
 * ```tsx
 * // Basic usage with minimal props
 * <DataTable
 *   columns={columns}
 *   data={data}
 * />
 * 
 * // Advanced usage with all features enabled
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   enableRowSelection={true}
 *   enableSorting={true}
 *   enableFiltering={true}
 *   enablePagination={true}
 *   enableColumnVisibility={true}
 *   defaultPageSize={10}
 *   pageSizeOptions={[5, 10, 20, 30]}
 *   globalFilter={true}
 *   filterableColumns={['name', 'status']}
 * />
 * ```
 * 
 * @features
 * - Sorting: Click column headers to sort data
 * - Filtering: Global search and per-column filtering
 * - Pagination: Navigate through data with customizable page sizes
 * - Column Visibility: Toggle column visibility
 * - Row Selection: Enable checkbox selection of rows
 * - Responsive Design: Adapts to different screen sizes
 * 
 * @template TData - The type of data being displayed in the table
 * @template TValue - The type of values in the table cells
 * @param props - Component props of type DataTableProps<TData, TValue>
 * @returns A fully featured data table component
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnVisibility = true,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 30, 40, 50],
  globalFilter = true,
  filterableColumns = []
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilterValue, setGlobalFilterValue] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize: defaultPageSize
      }
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: globalFilter ? globalFilterValue : undefined
    }
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-4 sm:gap-2">
        {enableFiltering && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {globalFilter && (
              <Input
                placeholder="Search all..."
                value={globalFilterValue}
                onChange={(event) => setGlobalFilterValue(event.target.value)}
                className="w-full sm:w-[300px]"
              />
            )}
            {filterableColumns.map((columnId) => {
              const column = table.getColumn(columnId);
              return (
                column && (
                  <Input
                    key={columnId}
                    placeholder={`Filter ${column.columnDef.header as string}...`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) => column.setFilterValue(event.target.value)}
                    className="w-full sm:w-[200px]"
                  />
                )
              );
            })}
          </div>
        )}
        {enableColumnVisibility && <DataTableViewOptions table={table} />}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
      {enablePagination && (
        <DataTablePagination 
          table={table} 
          showRowSelection={enableRowSelection} 
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
