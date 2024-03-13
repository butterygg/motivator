import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const YourApp = () => {
  return;
};
type Props = {};

const NavBar = (props: Props) => {
  return (
    <div
      className=" w-full
        p-4"
    >
      <p>NavBar</p>
      <ConnectButton />
    </div>
  );
};

export default NavBar;
