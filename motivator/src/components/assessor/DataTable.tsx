"use client";

import * as React from "react";
import {
	CaretSortIcon,
	ChevronDownIcon,
	DotsHorizontalIcon,
} from "@radix-ui/react-icons";
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
import {Checkbox} from "@/components/ui/checkbox";
import EthLogo from "~/ethereum-eth-logo.svg";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {Label} from "@radix-ui/react-dropdown-menu";

const data: Users[] = [
	{
		id: "m5gr84i9",
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		id: "3u1reuv4",
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		id: "derv1ws0",
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		id: "5kma53ae",
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
	{
		id: "bhqecj4p",
		name: "0xmazout.eth",
		data: {volume: 500, pnl: 30, actions: 40},
	},
];

export type Users = {
	id: string;
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
		cell: ({row}) => (
			<div className="font-bold gap-1 flex items-center">
				<Avatar>
					<AvatarImage src="https://avatars.githubusercontent.com/u/1000000?v=4" />
					<AvatarFallback>?</AvatarFallback>
				</Avatar>
				<p className="">{row.getValue("name")}</p>
			</div>
		),
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
			const payment = row.original;

			return (
				<div className="flex items-center gap-3 border p-1 rounded-lg w-fit">
					<Button variant="secondary" className="rounded-full">
						?
					</Button>
					<Button variant="destructive" className="rounded-full">
						X
					</Button>
					<div className="align-top flex gap-2">
						<Input
							placeholder="Points"
							type="number"
							className="w-10 appearance-none"
						/>
						<Button type="submit">Reward</Button>
					</div>
				</div>
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
		<div className="w-full p-8">
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
