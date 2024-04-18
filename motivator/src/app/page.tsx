/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAccount } from 'wagmi'
import ConnectWalletCard from '@/components/signup/connectWalletCard'
import StartAssessmentSlot from '@/components/signup/startAssessmentSlot'
import { useRouter } from 'next/navigation'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'
import { RoundSpinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import { Card } from '../components/ui/card'
type Props = {}

const Signup = (props: Props) => {
    // Using wagmi hook to get status of user
    const { status: walletStatus, address } = useAccount()

    // Using session hook to get status of user
    const { status: authenticationStatus } = useSession()

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
        setTimeout(() => {
            if (assessorSlotID?.res?.id) {
                push(`/assessor/slot/${assessorSlotID?.res?.id}`)
            }
        }, 2000)
    }, [assessorSlotID])

    const weekNumber = Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)
    const weekMax = Number(process.env.NEXT_PUBLIC_WEEK_MAX)

    // TODO : Rework this it's blocking the rendering
    // const { data: assessorSlotsAvailable } = useGetNumberAssessorSlotAvailable()

    const ComponentToDisplay = () => {
        if (assessorSlotID?.res?.id) {
            return (
                <Card className="w-96 items-center p-4 rounded-lg mx-auto">
                    <div className=" flex flex-col gap-4 items-center justify-center">
                        <RoundSpinner size="triplexl" />
                        <Label className="font-bold">
                            Assessor slot found, you will be redirected quickly.
                        </Label>
                    </div>
                </Card>
            )
        }
        if (walletStatus === 'connected') {
            if (authenticationStatus === 'authenticated')
                return (
                    <StartAssessmentSlot week={weekNumber} weekmax={weekMax} />
                )
        } else if (walletStatus === 'disconnected') {
            return <ConnectWalletCard />
        }
    }

    // Fetch API to have status of user
    return <div className="flex m-auto">{ComponentToDisplay()}</div>
}

export default Signup
