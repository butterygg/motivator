import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ConnectButton } from '@rainbow-me/rainbowkit'

/**
 *  Component to display a card to connect the wallet
 * @returns
 */
const ConnectWalletCard = () => {
    return (
        <Card className="flex flex-col items-center p-4 rounded-lg mx-auto">
            <CardHeader className="font-bold text-2xl">
                Welcome to Motivator
            </CardHeader>
            <CardContent>
                Connect the wallet you’re using on the testnet to start
                Motivating
            </CardContent>
            <div className="flex justify-center ">
                <ConnectButton />
            </div>
        </Card>
    )
}

export default ConnectWalletCard
