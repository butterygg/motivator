'use client'

import * as React from 'react'
import { AiOutlineAudit } from 'react-icons/ai'
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

import { Address } from 'viem'
import { useGetAssessorSlotIDFromURL } from '@/hooks/global/useGetAssessorSlotIDFromURL'
import Link from 'next/link'
import { Grade } from '@/types/enum/grade'

export type AssessorsSlotsDatatable = {
    id: string
    assessorSlotID: string
    assessorAddress: Address
    audit: {
        auditGrade: Grade
        auditorAddress: Address
    }
}

export const columns: ColumnDef<AssessorsSlotsDatatable>[] = [
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
        accessorKey: 'assessorAddress',
        header: 'assessorAddress',
        cell: ({ row }) => {
            const assessorAddress = row.getValue(
                'assessorAddress'
            ) as AssessorsSlotsDatatable['assessorAddress']
            return (
                <div className="flex gap-6 items-center">
                    <AddrAvatar
                        addressName={assessorAddress}
                        isDatatableStyle
                    />
                </div>
            )
        },
    },

    {
        accessorKey: 'assessorSlotID',
        cell: ({ row }) => {
            const assessorSlotID = row.getValue(
                'assessorSlotID'
            ) as AssessorsSlotsDatatable['assessorSlotID']
            return (
                <div className="flex gap-6 items-center justify-evenly">
                    <div className="flex flex-col">
                        <Link href={`/audit/${assessorSlotID}`}>
                            <div className="items-center flex-col flex">
                                <p className="font-extralight text-center text-xs">
                                    Assessor Slot ID
                                </p>
                                <div className="flex items-center gap-1">
                                    <AiOutlineAudit className="h-4 w-4" />
                                    <p className="font-bold">
                                        {assessorSlotID}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'audit',
        enableHiding: true,
        cell: ({ row }) => {
            const audit = row.getValue(
                'audit'
            ) as AssessorsSlotsDatatable['audit']
            return (
                <div className="flex-col">
                    <div className="items-center flex">
                        <p className="font-extralight text-center text-xs">
                            Grade
                        </p>
                        <div className="flex items-center gap-1">
                            <p className="font-bold">{audit.auditGrade}</p>
                        </div>
                    </div>
                    <div className="items-center flex">
                        <p className="font-extralight text-center text-xs">
                            Auditor
                        </p>
                        <div className="flex items-center gap-1">
                            <p className="font-bold">{audit.auditorAddress}</p>
                        </div>
                    </div>
                </div>
            )
        },
    },
]

export type Props = {
    users: AssessorsSlotsDatatable[]
}

export function DataTableAssessorSlot({ users }: Props) {
    const [rowSelection, setRowSelection] = React.useState({})
    const table = useReactTable({
        data: users,
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
                                    <Link
                                        href={`/audit/${row.getValue('assessorSlotID')}`}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </Link>
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
