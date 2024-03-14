import React from "react";
import {User} from "../../types/data/user";
import ReducedDataUsers from "./ReducedDataUsers";

type Props = {
	value: number;
	users: User[];
};

const RewardedUsers = ({value, users}: Props) => {
	const buildUsers = () => {
		return (
			<div>
				{users.map((user, index) => (
					<ReducedDataUsers
						key={index}
						addressName={user.addressName}
						actions={user.actions}
						pnl={user.pnl}
						volume={user.volume}
						id={user.id}
					/>
				))}
			</div>
		);
	};
	return (
		<section className="p-8 h-full w-1/4">
			<div className="border rounded p-4">
				<div className="flex justify-between rounded py-2">
					<h1>Summary</h1>
					<div>
						<p className="font-extralight pl-1 text-xs">Points</p>
						<p className="font-bold text-right">{value}</p>
					</div>
				</div>
				{buildUsers()}
			</div>
		</section>
	);
};

export default RewardedUsers;
