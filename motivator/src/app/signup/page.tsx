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

    // Fetch slotsAvailable from API
    const [slotsAvailable, setSlotsAvailable] = useState(0)

    const weekNumber = Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)
    const weekMax = Number(process.env.NEXT_PUBLIC_WEEK_MAX)

    const ComponentToDisplay = () => {
        if (walletStatus === 'connected') {
            if (authenticationStatus === 'authenticated')
                return (
                    <StartAssessmentSlot
                        week={weekNumber}
                        slotsAvailable={slotsAvailable}
                        weekmax={weekMax}
                    />
                )
        } else if (walletStatus === 'disconnected') {
            return <ConnectWalletCard />
        }
    }

    // Fetch API to have status of user
    return <div className="flex">{ComponentToDisplay()}</div>
}

export default Signup
