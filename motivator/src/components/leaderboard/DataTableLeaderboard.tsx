'use client'

import * as React from 'react'

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import AddrAvatar from '@/components/globals/AddrAvatar'
import { SlCheck, SlClose } from 'react-icons/sl'

import SearchBar from '@/components/globals/SearchBar'
import { Label } from '@/components/ui/label'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

export type LeaderboardDatatable = {
    id: string
    addressName: string
    rewardsReceived: {
        audit: number
        rewards: number
    }
    total: number
    isTestnetMember: boolean
}

export const columns: ColumnDef<LeaderboardDatatable>[] = [
    {
        accessorKey: 'id',
        id: 'id',
        cell: ({ row }) => {
            return (
                <div className="w-6">
                    <p className="font-bold"># {row.index + 1} </p>
                </div>
            )
        },
    },
    {
        accessorKey: 'addressName',
        header: 'addressName',
        cell: ({ row }) => {
            const addr = row?.original?.addressName
            return (
                <div className="flex gap-6 items-center">
                    <AddrAvatar addressName={addr} isDatatableStyle />
                </div>
            )
        },
    },

    {
        accessorKey: 'rewardsReceived',
        cell: ({ row }) => {
            // const rewardsReceived = row.getValue(
            //     'rewardsReceived'
            // ) as LeaderboardDatatable['rewardsReceived']

            const rewardsReceived = row?.original?.rewardsReceived

            return (
                <div className="flex items-center ">
                    <div className="flex flex-col">
                        <div className="items-center flex-col flex">
                            <p className="font-extralight text-center text-md">
                                Rewards Received
                            </p>
                            <div className="flex items-center gap-1">
                                <Label className="font-extralight text-center text-xs">
                                    Motivator:
                                </Label>
                                <p className="font-bold">
                                    {rewardsReceived?.rewards
                                        ? rewardsReceived?.rewards
                                        : 0}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Label className="font-extralight text-center text-xs">
                                    {' '}
                                    Audit:
                                </Label>
                                <p className="font-bold">
                                    {rewardsReceived?.audit
                                        ? rewardsReceived?.audit
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'rewardsReceived',
        cell: ({ row }) => {
            // const rewardsReceived = row.getValue(
            //     'rewardsReceived'
            // ) as LeaderboardDatatable['rewardsReceived']
            const rewardsReceived = row?.original?.rewardsReceived
            const total = rewardsReceived?.rewards + rewardsReceived?.audit
            return (
                <div className="flex items-center ">
                    <div className="flex flex-col">
                        <div className="items-center flex-col flex">
                            <Label className="font-extralight text-center text-xs">
                                Total
                            </Label>
                            <div className="flex items-center gap-1">
                                <p className="font-bold">{total ? total : 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'isTestnetMember',
        enableHiding: false,
        cell: ({ row }) => {
            // const isTestnetMember = row.getValue(
            //     'stat'
            // ) as LeaderboardDatatable['isTestnetMember']
            const isTestnetMember = row?.original?.isTestnetMember
            return (
                <div className="flex items-center ">
                    <div className="flex flex-col">
                        <div className="items-center flex-col flex">
                            <p className="font-extralight text-center text-xs">
                                TestnetMember
                            </p>
                            <div className="flex items-center gap-1">
                                {isTestnetMember ? <SlCheck /> : <SlClose />}
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
    },
]

export type Props = {
    users: LeaderboardDatatable[]
}

export function DataTableLeaderboard({ users }: Props) {
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])
    const table = useReactTable({
        data: users,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
            columnFilters,
            pagination: {
                pageIndex: 0,
                // ! Just to avoid to do a pagination for now , we will change this later
                // ! And setup a pagination on bottom of the table
                pageSize: 500,
            },
        },
    })

    return (
        <div className="lg-max:w-fit mx-auto lg:w-fit p-8">
            <Label>Top 500 Leaderboard</Label>
            <div className="rounded-md border">
                <div className="flex justify-between">
                    <div className="flex p-4  justify-between">
                        <Input
                            placeholder="Filter user"
                            value={
                                (table
                                    .getColumn('addressName')
                                    ?.getFilterValue() as string) ?? ''
                            }
                            onChange={(event) =>
                                table
                                    .getColumn('addressName')
                                    ?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                    </div>
                    <div className="flex items-center justify-end space-x-2 p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
                <Table>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
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
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}