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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Search } from "lucide-react";
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
  enableMinEntriesFilter?: boolean;
  minEntriesOptions?: number[];
  defaultMinEntries?: number;
  onMinEntriesChange?: (value: number) => void;
  /** Function to extract entries count from a row for min entries filtering */
  getRowEntries?: (row: TData) => number;
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
  enableMinEntriesFilter = false,
  minEntriesOptions = [5, 25, 50, 100],
  defaultMinEntries = 5,
  onMinEntriesChange,
  getRowEntries,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilterValue, setGlobalFilterValue] = React.useState("");
  const [minEntries, setMinEntries] = React.useState(defaultMinEntries);

  // Update parent when minEntries changes
  React.useEffect(() => {
    onMinEntriesChange?.(minEntries);
  }, [minEntries, onMinEntriesChange]);

  // Update local state when defaultMinEntries changes
  React.useEffect(() => {
    setMinEntries(defaultMinEntries);
  }, [defaultMinEntries]);

  // Filter data based on minimum entries
  const filteredData = React.useMemo(() => {
    if (!enableMinEntriesFilter || !getRowEntries) return data;
    return data.filter((item) => {
      const entries = getRowEntries(item);
      return entries >= minEntries;
    });
  }, [data, enableMinEntriesFilter, minEntries, getRowEntries]);

  const table = useReactTable({
    data: filteredData,
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
    <div className="space-y-3">
      {(enableFiltering || enableMinEntriesFilter) && (
        <div className="flex items-center gap-3 flex-wrap">
          {enableFiltering && globalFilter && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search..."
                value={globalFilterValue}
                onChange={(event) => setGlobalFilterValue(event.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {enableFiltering && filterableColumns.map((columnId) => {
            const column = table.getColumn(columnId);
            return (
              column && (
                <Input
                  key={columnId}
                  placeholder={`Filter ${column.columnDef.header as string}...`}
                  value={(column.getFilterValue() as string) ?? ""}
                  onChange={(event) => column.setFilterValue(event.target.value)}
                  className="w-[200px]"
                />
              )
            );
          })}
          {enableMinEntriesFilter && (
            <div className="flex items-center gap-2 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-help">
                    <Info className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Min entries</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  Filters cards with fewer tournament appearances for more reliable statistics.
                </TooltipContent>
              </Tooltip>
              <Select
                value={minEntries.toString()}
                onValueChange={(value) => setMinEntries(Number(value))}
              >
                <SelectTrigger className="w-[72px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {minEntriesOptions.map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const size = header.column.columnDef.size;
                  return (
                    <TableHead
                      key={header.id}
                      className={index === 0 ? "pl-4" : undefined}
                      style={size ? { width: size } : undefined}
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