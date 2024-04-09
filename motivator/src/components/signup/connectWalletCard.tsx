import React from 'react'
import { Card, CardContent, CardHeader } from '../ui/card'
import { ConnectButton } from '@rainbow-me/rainbowkit'

type Props = {}

const ConnectWalletCard = (props: Props) => {
    return (
        <Card className="flex flex-col items-center p-4 rounded-lg mx-auto">
            <CardHeader className="font-bold text-2xl">
                Welcome to Motivator
            </CardHeader>
            <CardContent>Sign in to participate as an Assessor</CardContent>
            <div className="flex justify-center ">
                <ConnectButton />
            </div>
        </Card>
    )
}

export default ConnectWalletCard
