import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import React from "react";
import {User} from "@/types/data/user";
import AddrAvatar from "@/components/globals/AddrAvatar";

const ReducedDataUsers = (props: User) => {
	return (
		<div className="border w-full p-4 rounded-md">
			<AddrAvatar addressName={props.addressName} />
			<div className="flex flex-col xl:flex-row justify-between">
				<p>Volume: {props.volume}</p>
				<p>Pnl: {props.pnl}</p>
				<p>Actions: {props.actions}</p>
			</div>
		</div>
	);
};

export default ReducedDataUsers;
