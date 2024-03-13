"use client";
import {RainbowKitProvider, getDefaultConfig} from "@rainbow-me/rainbowkit";
import config from "next/config";
import React, {ReactNode} from "react";
import {WagmiProvider} from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import {sepolia} from "wagmi/chains";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

type Props = {};

const Web3Provider = ({
	children,
}: Readonly<{
	children: ReactNode;
}>) => {
	const queryClient = new QueryClient();
	const config = getDefaultConfig({
		appName: "Motivator",
		projectId: "b23989a1ad4b5577b68f70805a34eef6",
		chains: [sepolia],
		ssr: true, // If your dApp uses server side rendering (SSR)
	});
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>{children}</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};

export default Web3Provider;
