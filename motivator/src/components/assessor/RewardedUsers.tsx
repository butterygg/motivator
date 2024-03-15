import React from "react";
import {User} from "../../types/data/user";
import ReducedDataUsers from "./ReducedDataUsers";
import {Button} from "../ui/button";

type Props = {
	value: number;
	users: User[];
};

const RewardedUsers = ({value, users}: Props) => {
	const buildUsers = () => {
		return (
			<div className="flex flex-wrap lg:flex-col gap-4">
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
		<section className="p-8 h-full w-fit lg:w-1/4">
			<div className="border rounded p-4">
				<div className="flex justify-between rounded py-2">
					<h1>Summary</h1>
					<div className="flex gap-4">
						<Button>Submit</Button>
						<div>
							<p className="font-extralight pl-1 text-xs">Points</p>
							<p className="font-bold text-right">{value}</p>
						</div>
					</div>
				</div>
				{buildUsers()}
			</div>
		</section>
	);
};

export default RewardedUsers;
