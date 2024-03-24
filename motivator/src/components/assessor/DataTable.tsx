'use client'

import * as React from 'react'

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Button } from '@/components/ui/button'
import EthLogo from '~/ethereum-eth-logo.svg'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { UserData } from '@/components/assessor/UserData'
import AddrAvatar from '@/components/globals/AddrAvatar'
import { Status } from '@/types/enum/status'
import { Tag } from '@/components/assessor/Tag'
import { AssessorSlot, Reward, Stat } from '../../types/data/assessorSlot'

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
    id: string
    addressName: string
    pnl: number
    stat: Stat
    status?: Status
}

export const columns: ColumnDef<UserDatatable>[] = [
    {
        id: 'id',
        cell: ({ row }) => (
            <>
                <p className="font-bold"># {row.index} </p>
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
        accessorKey: 'volume',
        cell: ({ row }) => {
            const volume = row.getValue(
                'volume'
            ) as UserDatatable['stat']['volume']
            const pnl = row.getValue('pnl') as UserDatatable['pnl']
            const actions = row.getValue(
                'actions'
            ) as UserDatatable['stat']['actions']
            return (
                <div className="flex justify-evenly">
                    <div>
                        <p className="font-extralight pl-1 text-xs">Volume</p>
                        <div className="flex">
                            <EthLogo className="h-4 w-4" />
                            <p className="font-bold">{volume}K</p>
                        </div>
                    </div>

                    <div>
                        <p className="font-extralight pl-1 text-xs">PnL</p>
                        <div className="flex">
                            <EthLogo className="h-4 w-4" />
                            <p className="font-bold">{pnl}K</p>
                        </div>
                    </div>
                    <div>
                        <p className="font-extralight pl-1 text-xs">Actions</p>
                        <div className="flex">
                            <EthLogo className="h-4 w-4" />
                            <p className="font-bold">{actions}K</p>
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'pnl',
        cell: ({ row }) => {
            ;<>
                <p className="font-extralight pl-1 text-xs">pnl</p>
                <div className="flex">
                    <EthLogo className="h-4 w-4" />
                    <p className="font-bold">{row.getValue('pnl')}K</p>
                </div>
            </>
        },
    },
    {
        accessorKey: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const volume = row.getValue(
                'volume'
            ) as UserDatatable['stat']['volume']
            const stat = row.getValue('stat') as UserDatatable['stat']
            const pnl = row.getValue('pnl') as UserDatatable['pnl']
            const actions = row.getValue(
                'actions'
            ) as UserDatatable['stat']['actions']
            return (
                <UserData
                    user={{
                        addressName: row.getValue('addressName'),
                        stat: stat,
                        pnl: pnl,
                        id: row.id,
                        reward: {} as Reward,
                    }}
                    onChainActions={[]}
                    offChainActions={[]}
                ></UserData>
            )
        },
    },
]

export type Props = {
    assessorSlot: AssessorSlot
}

export function DataTable({ assessorSlot }: Props) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({
            columnId3: true,
        })
    const [rowSelection, setRowSelection] = React.useState({})

    const prepareDataForTable = (assessorSlot: AssessorSlot) => {
        const res: UserDatatable[] = []
        assessorSlot.users.forEach((element, index) => {
            res.push({
                id: index.toString(),
                addressName: element,
                pnl: 100,
                stat: assessorSlot.stats.find(
                    (stat) => stat.user_address === element
                ) as Stat,
                status: assessorSlot.rewards.find(
                    (reward) => reward.user_address === element
                )
                    ? Status.Rewarded
                    : Status.Pending,
            })
        })

        return res
    }

    const table = useReactTable({
        data: prepareDataForTable(assessorSlot),
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="lg-max:w-3/4 lg:w-full p-8">
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
