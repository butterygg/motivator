import React from 'react'
import { Card, CardContent, CardHeader } from '../ui/card'
import { ConnectButton } from '@rainbow-me/rainbowkit'

type Props = {}

const ConnectWalletCard = (props: Props) => {
    return (
        <Card className="items-center p-4 rounded-lg mx-auto">
            <CardHeader>Welcome to Motivator</CardHeader>
            <CardContent>Connect the same wallet you're using on testnet to start Motivating</CardContent>
            <div className="flex m-auto">
                <ConnectButton />
            </div>
        </Card>
    )
}

export default ConnectWalletCard
