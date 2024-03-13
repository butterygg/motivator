import React from "react";
import {Avatar, AvatarFallback, AvatarImage} from "../ui/avatar";

type Props = {
	src?: string;
	addressName: string;
};

const AddrAvatar = ({
	addressName = "0xMazout.eth",
	src = "https://avatars.githubusercontent.com/u/1000000?v=4",
}: Props) => {
	return (
		<div className="flex flex-col lg:flex-row font-bold gap-2 items-center">
			<Avatar>
				<AvatarImage src={src} />
				<AvatarFallback>?</AvatarFallback>
			</Avatar>
			<p className="">{addressName}</p>
		</div>
	);
};

export default AddrAvatar;
