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

import { Address } from 'viem'
import Link from 'next/link'
import { Grade } from '@/types/enum/grade'
import GradeAudit from './GradeAudit'

export type AuditAssessorsSlotsDatatable = {
    id: string
    assessorSlotID: {
        id: string
        week: number
    }
    assessorAddress: string
    rewardsSent: number
    audit: {
        auditGrade?: Grade
        auditorAddress?: Address
    }
}

export const columns: ColumnDef<AuditAssessorsSlotsDatatable>[] = [
    {
        accessorKey: 'id',
        id: 'id',
        cell: ({ row }) => (
            <>
                <Link href={`/assessor/slot/${row.original.assessorSlotID.id}`}>
                    <p className="font-bold"># {row.index + 1} </p>
                </Link>
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
            ) as AuditAssessorsSlotsDatatable['assessorAddress']
            return (
                <div className="flex flex-col items-center">
                    <Link
                        href={`/assessor/slot/${row.original.assessorSlotID.id}`}
                    >
                        {/* <p className="font-extralight text-center text-xs">
                        Assessor Addr
                    </p> */}
                        <AddrAvatar
                            addressName={assessorAddress}
                            isDatatableStyle
                        />
                    </Link>
                </div>
            )
        },
    },

    {
        accessorKey: 'assessorSlotID',
        cell: ({ row }) => {
            const assessorSlotID = row.getValue(
                'assessorSlotID'
            ) as AuditAssessorsSlotsDatatable['assessorSlotID']
            return (
                <div className="flex gap-6 items-center justify-evenly">
                    <div className="flex flex-col">
                        <Link
                            href={`/assessor/slot/${row.original.assessorSlotID.id}`}
                        >
                            <div className="items-center flex-col flex">
                                <div>
                                    <p className="font-extralight text-center text-xs">
                                        Assessor Slot ID
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {/* <AiOutlineAudit className="h-4 w-4" /> */}
                                        <p className="font-bold">
                                            {assessorSlotID.id}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-extralight text-center text-xs">
                                    Week {assessorSlotID.week}
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'rewardsSent',
        cell: ({ row }) => {
            const rewardsSent = row.getValue(
                'rewardsSent'
            ) as AuditAssessorsSlotsDatatable['rewardsSent']

            return (
                <div className="flex gap-6 items-center justify-evenly">
                    <Link
                        href={`/assessor/slot/${row.original.assessorSlotID.id}`}
                    >
                        <div className="flex flex-col">
                            <div className="items-center flex-col flex">
                                <p className="font-extralight text-center text-xs">
                                    Rewards attributed
                                </p>
                                <div className="flex items-center gap-1">
                                    <p className="font-bold">
                                        {rewardsSent} pts
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
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
            ) as AuditAssessorsSlotsDatatable['audit']
            const assessorSlotID = row.original.assessorSlotID.id
            return (
                <div className="flex-col">
                    <div className="items-center flex">
                        {/* INSERT SELECT GRADE COMPONENT */}
                        <div className="flex items-center gap-1">
                            <GradeAudit
                                auditor={audit.auditorAddress as string}
                                grade={audit.auditGrade as Grade}
                                assessorSlotID={assessorSlotID as string}
                            />
                        </div>
                    </div>
                </div>
            )
        },
    },
]

export type Props = {
    users: AuditAssessorsSlotsDatatable[]
}

export function DataTableAuditAssessorSlot({ users }: Props) {
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
            pagination: {
                pageIndex: 0,
                // ! Just to avoid to do a pagination for now , we will change this later
                // ! And setup a pagination on bottom of the table
                pageSize: 5000,
            },
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
                                    {/* <Link
                                        href={`/assessor/slot/${row.getValue('assessorSlotID')}`}
                                    > */}
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                    {/* </Link> */}
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
