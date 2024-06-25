'use client'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import React from 'react'
import { WagmiProvider } from 'wagmi'
import '@rainbow-me/rainbowkit/styles.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import {
    RainbowKitSiweNextAuthProvider,
    GetSiweMessageOptions,
} from '@rainbow-me/rainbowkit-siwe-next-auth'
import { createConfig } from '@wagmi/core'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { Network, Alchemy } from 'alchemy-sdk'
type Props = {}

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

export const alchemySettings = {
    apiKey: 'A23FM2MPsnG3CCpDqiDetU2HyIFtIwpb',
    network: Network.ETH_SEPOLIA,
}

export const defaultConfig = getDefaultConfig({
    appName: 'Motivator',
    projectId: 'b23989a1ad4b5577b68f70805a34eef6',
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(
            // 'https://sepolia.infura.io/v3/e210bca124a44fa881d3242e3394ada6'
            process.env.NEXT_PUBLIC_INFURA_URL
        ),
    },
    ssr: true, // If your dApp uses server side rendering (SSR)
})

export const config = createConfig({
    chains: [sepolia],
    transports: { [sepolia.id]: http() },
})

const Web3Provider = ({
    children,
}: Readonly<{
    children: React.ReactNode
}>) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {},
        },
    })
    const getSiweMessageOptions: GetSiweMessageOptions = () => ({
        statement: 'Sign in to The Motivator App',
    })
    return (
        <WagmiProvider config={defaultConfig}>
            <SessionProvider>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitSiweNextAuthProvider
                        getSiweMessageOptions={getSiweMessageOptions}
                    >
                        <RainbowKitProvider>{children}</RainbowKitProvider>
                    </RainbowKitSiweNextAuthProvider>
                </QueryClientProvider>
            </SessionProvider>
        </WagmiProvider>
    )
}

export default Web3Provider
