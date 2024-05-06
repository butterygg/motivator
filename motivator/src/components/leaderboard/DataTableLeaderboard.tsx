'use client'

import * as React from 'react'

import {
    ColumnDef,
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

import SearchBar from '../globals/SearchBar'

export type LeaderboardDatatable = {
    id: { id: string; assessorSlotId: string }
    addressName: string
    slotsSubmitted: number
    isTestnetMember: boolean
}

export const columns: ColumnDef<LeaderboardDatatable>[] = [
    {
        accessorKey: 'id',
        id: 'id',
        cell: ({ row }) => (
            <>
                <p className="font-bold"># {row.index + 1} </p>
            </>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'addressName',
        header: 'addressName',
        cell: ({ row }) => {
            return (
                <div className="flex gap-6 items-center">
                    <AddrAvatar
                        addressName={row.getValue('addressName')}
                        isDatatableStyle
                    />
                </div>
            )
        },
    },

    {
        accessorKey: 'slotsSubmitted',
        cell: ({ row }) => {
            const slotsSubmitted = row.getValue(
                'slotsSubmitted'
            ) as LeaderboardDatatable['slotsSubmitted']

            return (
                <div className="flex items-center ">
                    <div className="flex flex-col">
                        <div className="items-center flex-col flex">
                            <p className="font-extralight text-center text-xs">
                                Slots Submitted
                            </p>
                            <div className="flex items-center gap-1">
                                <p className="font-bold">{slotsSubmitted}</p>
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
            const isTestnetMember = row.getValue(
                'stat'
            ) as LeaderboardDatatable['isTestnetMember']

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
    assessors: LeaderboardDatatable[]
}

export function DataTableLeaderboard({ assessors }: Props) {
    const [rowSelection, setRowSelection] = React.useState({})
    const table = useReactTable({
        data: assessors,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
        },
    })

    return (
        <div className="lg-max:w-fit mx-auto lg:w-fit p-8">
            <div className="flex p-4 w-full justify-between">
                <SearchBar />
            </div>
            <div className="rounded-md border">
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
