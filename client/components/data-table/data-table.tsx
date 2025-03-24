"use client";

import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/data-table/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
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
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  globalFilter?: boolean;
  filterableColumns?: string[];
  onRowSelectionChange?: (updatedSelection: RowSelectionState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  defaultPageSize = 10,
  globalFilter = true,
  filterableColumns = [],
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilterValue, setGlobalFilterValue] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updatedSelection) => {
      setRowSelection(updatedSelection);
      onRowSelectionChange?.(updatedSelection as RowSelectionState);
    },
    enableRowSelection,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: globalFilter ? globalFilterValue : undefined,
    },
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
                    placeholder={`Filter ${
                      column.columnDef.header as string
                    }...`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      column.setFilterValue(event.target.value)
                    }
                    className="w-full sm:w-[200px]"
                  />
                )
              );
            })}
          </div>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={index === 0 ? "pl-4" : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={index === 0 ? "pl-4" : undefined}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center pl-4"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination && <DataTablePagination table={table} />}
    </div>
  );
}
