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
import DaiLogo from '~/dai.svg'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import AddrAvatar from '@/components/globals/AddrAvatar'
import { Status } from '@/types/enum/status'

import {
    AssessorSlot,
    Reward,
    Statistics,
    Totals,
} from '../../types/data/assessorSlot'
import { DialogUserData } from './DialogUserData'

import InputReward from '../globals/InputReward'
import { Address } from 'viem'
import { DialogConfirmSubmit } from './DialogConfirmSubmit'
import { useGetAssessorSlotIDFromURL } from '../../hooks/global/useGetAssessorSlotIDFromURL'
import TotalPoints from './TotalPoints'
import { useRouter } from 'next/navigation'
import { transformNumberK } from '../../utils/utils'

export type UserDatatable = {
    id: { id: string; assessorSlotId: string }
    addressName: string
    pnl: number
    stat: {
        totals: Totals
        stats: Statistics[]
    }
    reward?: {
        reward: Reward | undefined
        status: Status
    }
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
        cell: ({ row }) => {
            const reward = row.getValue('reward') as UserDatatable['reward']
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
        accessorKey: 'stat',
        cell: ({ row }) => {
            const stat = row.getValue('stat') as UserDatatable['stat']
            const pnl = row.getValue('pnl') as UserDatatable['pnl']

            return (
                <div className="flex gap-6 items-center justify-evenly">
                    {/* <div className="items-center flex-col flex">
                        <p className="font-extralight text-center text-xs">
                            PnL
                        </p>
                        <div className="flex items-center gap-1">
                            <DaiLogo className="h-4 w-4" />
                            <p className="font-bold">
                                {transformNumberK(Number(stat.totals.totalPnl))}
                            </p>
                        </div>
                    </div> */}
                    <div className="flex items-center">
                        {' '}
                        <p className="[writing-mode:vertical-lr] rotate-180">
                            Volume
                        </p>
                        <div className="flex flex-col">
                            <div className="items-center flex-col flex">
                                <p className="font-extralight text-center text-xs">
                                    Pool ETH
                                </p>
                                <div className="flex items-center gap-1">
                                    <EthLogo className="h-4 w-4" />
                                    <p className="font-bold">
                                        {transformNumberK(
                                            Number(
                                                stat.totals.totalVolumePoolETH
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="items-center flex-col flex">
                                <p className="font-extralight text-center text-xs">
                                    Pool Dai
                                </p>
                                <div className="flex items-center gap-1">
                                    <DaiLogo className="h-4 w-4" />
                                    <p className="font-bold">
                                        {transformNumberK(
                                            Number(
                                                stat.totals.totalVolumePoolDai
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="items-center flex-col flex">
                        <p className="font-extralight text-center text-xs">
                            Actions
                        </p>
                        <div className="flex items-center">
                            {/* <EthLogo className="h-4 w-4" /> */}
                            <p className="font-bold">
                                {Number(stat.totals.totalActions)}
                            </p>
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
            const reward = row.getValue('reward') as UserDatatable['reward']
            // const stat = {
            //     volume: 50,
            //     actions: 50,
            //     user_address: '0xEdC0aa5A93992965EaeF1efeEE3c424F304ff102',
            // }

            return (
                <DialogUserData
                    user={{
                        addressName: stat.totals.user_address,
                        stat: stat,
                        pnl: pnl,
                        id: row.index.toString(),
                        reward: reward?.reward,
                        status: reward?.status,
                    }}
                />
            )
        },
    },
    {
        accessorKey: 'reward',
        enableHiding: true,
        cell: ({ row }) => {
            const reward = row.getValue('reward') as UserDatatable['reward']
            const id = row.getValue('id') as UserDatatable['id']
            const userAddr = row.getValue('addressName') as Address
            return (
                <InputReward
                    val={reward?.reward?.amount as number}
                    userAddr={userAddr}
                    assessorSlot={id.assessorSlotId}
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
    const assessorSlotID = useGetAssessorSlotIDFromURL()
    // Prevent loading of the page if the user come to an assessor slot already done using url
    // if (users.length === 0) {
    //     push(`/`)
    // }
    return (
        <div className="lg-max:w-fit mx-auto lg:w-fit p-8">
            <div className="flex p-4 w-full justify-between">
                <DialogConfirmSubmit
                    assessorSlotId={assessorSlotID as string}
                />
                <TotalPoints />
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
