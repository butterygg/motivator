import React from "react";
import {ConnectButton} from "@rainbow-me/rainbowkit";

export const YourApp = () => {
	return;
};
type Props = {};

const NavBar = (props: Props) => {
	return (
		<div className=" w-full p-8 justify-between flex">
			<div>
				<h1 className="font-bold text-2xl">Motivator</h1>
				<h2 className="font-semibold text-xl">A Buttery Good Game</h2>
			</div>
			<ConnectButton />
		</div>
	);
};

export default NavBar;
