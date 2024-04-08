/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAccount } from 'wagmi'
import ConnectWalletCard from '@/components/signup/connectWalletCard'
import StartAssessmentSlot from '@/components/signup/startAssessmentSlot'
import { useGetAssessorSlotID } from '../hooks/assessorSlot/useGetAssessorSlotID'
import { useGetNumberAssessorSlotAvailable } from '../hooks/assessorSlot/useGetNumberAssessorSlotAvailable'
import { useRouter } from 'next/navigation'
import { useGetAssessorSlot } from '../hooks/assessorSlot/useGetAssessorSlot'
type Props = {}

const Signup = (props: Props) => {
    // Using wagmi hook to get status of user
    const { status: walletStatus, address } = useAccount()

    // Using session hook to get status of user
    const { status: authenticationStatus } = useSession()

    // Fetch slotsAvailable from API
    const [slotsAvailable, setSlotsAvailable] = useState(0)

    const {
        data: assessorSlotID,
        refetch,
        status,
    } = useGetAssessorSlot({
        assessorAddr: address ? address : '',
    })
    const { push } = useRouter()
    useEffect(() => {
        if (refetch) {
            refetch()
        }
    }, [address, status])

    useEffect(() => {
        if (assessorSlotID?.res?.id) {
            push(`/assessor/slot/${assessorSlotID?.res?.id}`)
        }
    }, [assessorSlotID])

    const weekNumber = Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)
    const weekMax = Number(process.env.NEXT_PUBLIC_WEEK_MAX)

    // TODO : Rework this it's blocking the rendering
    // const { data: assessorSlotsAvailable } = useGetNumberAssessorSlotAvailable()

    const ComponentToDisplay = () => {
        if (walletStatus === 'connected') {
            if (authenticationStatus === 'authenticated')
                return (
                    <StartAssessmentSlot
                        week={weekNumber}
                        slotsAvailable={0}
                        weekmax={weekMax}
                    />
                )
        } else if (walletStatus === 'disconnected') {
            return <ConnectWalletCard />
        }
    }

    // Fetch API to have status of user
    return <div className="flex m-auto">{ComponentToDisplay()}</div>
}

export default Signup
