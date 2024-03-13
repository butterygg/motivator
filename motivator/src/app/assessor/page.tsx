import React from "react";
import {DataTable} from "@/components/assessor/DataTable";
import RewardedUsers from "@/components/assessor/RewardedUsers";
import {User} from "@/types/data/users";

type Props = {};

const HomeAssessor = (props: Props) => {
	const users: User[] = [
		{
			addressName: "User 1",
			volume: 100,
			pnl: 100,
			actions: 100,
		},
		{
			addressName: "User 2",
			volume: 100,
			pnl: 100,
			actions: 100,
		},
		{
			addressName: "User 3",
			volume: 100,
			pnl: 100,
			actions: 100,
		},
	];
	return (
		<main className="flex">
			<DataTable />
			<RewardedUsers value={0} users={users} />
		</main>
	);
};

export default HomeAssessor;
