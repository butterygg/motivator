import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import React from "react";
import {User} from "../../types/data/users";

const ReducedDataUsers = (props: User) => {
	return (
		<div className="border w-full p-4 rounded-md">
			<div className="font-bold gap-1 flex items-center">
				<Avatar>
					<AvatarImage src="https://avatars.githubusercontent.com/u/1000000?v=4" />
					<AvatarFallback>?</AvatarFallback>
				</Avatar>
				<p className="">{props.addressName}</p>
			</div>
			<div className="flex justify-between">
				<p>Volume: {props.volume}</p>
				<p>Pnl: {props.pnl}</p>
				<p>Actions: {props.actions}</p>
			</div>
		</div>
	);
};

export default ReducedDataUsers;
