import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import Web3Provider from "../utils/Web3Provider";
import NavBar from "../components/globals/NavBar";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
	title: "Motivator",
	description: "Powered by Butter",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<Web3Provider>
					<NavBar />
					{children}
				</Web3Provider>
			</body>
		</html>
	);
}
