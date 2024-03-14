"use client";

import * as React from "react";

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
} from "@tanstack/react-table";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

import {Button} from "@/components/ui/button";
import EthLogo from "~/ethereum-eth-logo.svg";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {UserData} from "./UserData";
import AddrAvatar from "../globals/AddrAvatar";

const data: Users[] = [
	{
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
];

export type Users = {
	name: string;
	data: {
		volume: number;
		pnl: number;
		actions: number;
	};
};

export const columns: ColumnDef<Users>[] = [
	{
		id: "id",
		cell: ({row}) => (
			<>
				<p className="font-bold"># {row.index} </p>
			</>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: "name",
		cell: ({row}) => <AddrAvatar addressName={row.getValue("name")} />,
	},
	{
		accessorKey: "data",
		cell: ({row}) => {
			const data = row.getValue("data") as Users["data"];
			const volume = data.volume;
			const pnl = data.pnl;
			const actions = data.actions;
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
			);
		},
	},
	{
		accessorKey: "pnl",
		cell: ({row}) => {
			<>
				<p className="font-extralight pl-1 text-xs">pnl</p>
				<div className="flex">
					<EthLogo className="h-4 w-4" />
					<p className="font-bold">{row.getValue("pnl")}K</p>
				</div>
			</>;
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({row}) => {
			const data = row.getValue("data") as Users["data"];
			const volume = data.volume;
			const pnl = data.pnl;
			const actions = data.actions;
			return (
				<UserData
					user={{
						addressName: row.getValue("name"),
						volume: volume,
						pnl: pnl,
						actions: actions,
					}}
					onChainActions={[]}
					offChainActions={[]}
				></UserData>
			);
		},
	},
];

export function DataTable() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	const table = useReactTable({
		data,
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
	});

	return (
		<div className="w-3/4 p-8">
			<div className="rounded-md border">
				<Table>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
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
	);
}
