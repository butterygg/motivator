'use client'
import React, { useState } from 'react'
import { Card } from '../../components/ui/card'
import { useSession } from 'next-auth/react'
import { useAccount } from 'wagmi'
import ConnectWalletCard from '../../components/signup/connectWalletCard'
import StartAssessmentSlot from '../../components/signup/startAssessmentSlot'

type Props = {}

const Signup = (props: Props) => {
    // Using wagmi hook to get status of user
    const { status: walletStatus } = useAccount()

    // Using session hook to get status of user
    const { status: authenticationStatus } = useSession()

    // Fetch API to know if user is signed in DB
    const [signed, setSigned] = useState(false)

    //  Fetch API to know if user is signed has already an assessor slot
    const [hasAssessorSlot, setHasAssessorSlot] = useState(false)

    const ComponentToDisplay = () => {
        if (walletStatus === 'connected') {
            if (authenticationStatus === 'unauthenticated')
                return <Card>Signup</Card>
            if (authenticationStatus === 'authenticated')
                return <StartAssessmentSlot week={0} slotsAvailable={0} />
        } else if (walletStatus === 'disconnected') {
            return <ConnectWalletCard />
        } else {
            return <Card>Wallet loading</Card>
        }
    }

    // Fetch API to have status of user
    return <div className="flex">{ComponentToDisplay()}</div>
}

export default Signup
