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
import EthLogo from '~/ethereum-eth-logo.svg'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import AddrAvatar from '@/components/globals/AddrAvatar'
import { Status } from '@/types/enum/status'
import { Tag } from '@/components/assessor/Tag'
import { AssessorSlot, Reward, Stat } from '../../types/data/assessorSlot'
import { UserData } from './UserData'
import { useHomeAssessorData } from '../../hooks/dataComponents/useHomeAssessorData'
import { useGetAssessorSlot } from '../../hooks/assessorSlot/useGetAssessorSlot'

// const data: User[] = [
//     {
//         addressName: '0xmazout.eth',
//         volume: 500,
//         pnl: 30,
//         actions: 40,
//         id: '1',
//         status: Status.Pending,
//     },
//     {
//         addressName: '0xEdC0aa5A93992965EaeF1efeEE3c424F304ff102',
//         volume: 500,
//         pnl: 30,
//         actions: 40,
//         id: '2',
//         status: Status.Rewarded,
//     },
//     {
//         addressName: '0xmazout.eth',
//         volume: 500,
//         pnl: 30,
//         actions: 40,
//         id: '3',
//         status: Status.Pending,
//     },
//     {
//         addressName: '0xmazout.eth',
//         volume: 500,
//         pnl: 30,
//         actions: 40,
//         id: '4',
//         status: Status.NullReward,
//     },
//     {
//         addressName: '0xEdC0aa5A93992965EaeF1efeEE3c424F304ff102',
//         volume: 500,
//         pnl: 30,
//         actions: 40,
//         id: '5',
//         status: Status.Pending,
//     },
// ]

export type UserDatatable = {
    id: { id: string; assessorSlotId: string }
    addressName: string
    pnl: number
    stat: Stat
    status?: Status
}

export const columns: ColumnDef<UserDatatable>[] = [
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
        cell: ({ row }) => (
            <div className="flex gap-6 items-center">
                <AddrAvatar
                    addressName={row.getValue('addressName')}
                    isDatatableStyle
                />
                <div className="w-fit">
                    <Tag value={row.getValue('status')} />
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'status',
        enableHiding: true,
        cell: () => {
            ;<></>
        },
    },
    {
        accessorKey: 'stat',
        cell: ({ row }) => {
            const stat = row.getValue('stat') as UserDatatable['stat']
            const pnl = row.getValue('pnl') as UserDatatable['pnl']

            return (
                <div className="flex justify-evenly">
                    <div className="items-center flex-col flex">
                        <p className="font-extralight text-center text-xs">
                            Volume
                        </p>
                        <div className="flex">
                            <EthLogo className="h-4 w-4" />
                            <p className="font-bold">{stat.volume}</p>
                        </div>
                    </div>

                    <div className="items-center flex-col flex">
                        <p className="font-extralight text-center text-xs">
                            PnL
                        </p>
                        <div className="flex">
                            <p className="font-bold">{pnl}K$</p>
                        </div>
                    </div>
                    <div className="items-center flex-col flex">
                        <p className="font-extralight text-center text-xs">
                            Actions
                        </p>
                        <div className="flex items-center">
                            {/* <EthLogo className="h-4 w-4" /> */}
                            <p className="font-bold">{stat.actions}</p>
                        </div>
                    </div>
                </div>
            )
        },
    },
    // {
    //     accessorKey: 'pnl',
    //     cell: ({ row }) => {
    //         ;<>
    //             {/* <p className="font-extralight pl-1 text-xs">pnl</p>
    //             <div className="flex">
    //                 <EthLogo className="h-4 w-4" />
    //                 <p className="font-bold">{row.getValue('pnl')}K</p>
    //             </div> */}
    //         </>
    //     },
    // },
    {
        accessorKey: 'pnl',
        enableHiding: false,
        cell: ({ row }) => {
            const stat = row.getValue('stat') as UserDatatable['stat']
            const pnl = row.getValue('pnl') as UserDatatable['pnl']
            const id = row.getValue('id') as UserDatatable['id']
            // const stat = {
            //     volume: 50,
            //     actions: 50,
            //     user_address: '0xEdC0aa5A93992965EaeF1efeEE3c424F304ff102',
            // }

            return (
                <UserData
                    user={{
                        addressName: stat.user_address,
                        stat: stat,
                        pnl: pnl,
                        id: row.index.toString(),
                    }}
                    assessorSlotId={id.assessorSlotId}
                />
            )
        },
    },
]

export type Props = {
    users: UserDatatable[]
}

export function DataTable({ users }: Props) {
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
        <div className="lg-max:w-fit lg:w-full p-8">
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
