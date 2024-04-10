/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAccount, useSendTransaction } from 'wagmi'
import { Address, parseEther } from 'viem'
import { handlePayment } from '@/server/actions/payment/handlePayment'
import { useRouter } from 'next/navigation'
import { useGetAssessorSlot } from '../../hooks/assessorSlot/useGetAssessorSlot'
import { useSession } from 'next-auth/react'
import { RoundSpinner } from '@/components/ui/spinner'
import { ethers } from 'ethers'
type Props = {}

const Payment = (props: Props) => {
    // Using wagmi hook to get status of user
    const { address } = useAccount()

    // Using session hook to get status of user
    const [assessorSlotFinded, setAssessorSlotFinded] = useState(false)
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
            setAssessorSlotFinded(true)
            setTimeout(() => {
                push(`/assessor/slot/${assessorSlotID?.res?.id}`)
            }, 2000)
        }
    }, [assessorSlotID])

    const value = process.env.NEXT_PUBLIC_ASSESSOR_VALUE as string
    const { sendTransactionAsync, status: statusTransaction } =
        useSendTransaction({
            mutation: {
                async onSuccess(data, variables, context) {
                    // const transaction = await ethers.providers
                    //     .getDefaultProvider()
                    //     .getTransactionReceipt(data)
                    const assessorSlot = await handlePayment({
                        assessorAddr: address ? (address as Address) : '0x0',
                        hash: data,
                    })
                    // if (
                    //     assessorSlot?.status === 'ok' &&
                    //     assessorSlot.assessorSlot
                    // ) {
                    //     push(
                    //         `/assessor/slot/${assessorSlot.assessorSlot?.id as string}`
                    //     )
                    // }
                },
            },
        })

    const handleOnClick = async () => {
        await sendTransactionAsync({
            to: process.env.NEXT_PUBLIC_ADDRESS_RECEIVER
                ? (process.env.NEXT_PUBLIC_ADDRESS_RECEIVER as Address)
                : '0x0000000000000000000000000000000000000000',
            value: parseEther(value),
        })
    }

    const handleDisplay = () => {
        if (assessorSlotFinded) {
            return (
                <div className="justify-center">
                    <RoundSpinner size="triplexl" />
                    <Label className="font-bold">
                        Assessor slot found, you will be redirected in 2 seconds
                    </Label>
                </div>
            )
        }
        if (statusTransaction === 'pending') {
            return (
                <div className="flex flex-col gap-4 items-center">
                    <RoundSpinner size="triplexl" />
                    <Label className="font-bold">Transaction in progress</Label>
                </div>
            )
        }
        return (
            <div className="border rounded-md p-4">
                <Label className="font-bold">Payment</Label>
                <div className="mt-2 gap-4 items-center flex flex-col">
                    <Label className="font-light">
                        To acquire an assessor slots, you need to pay ${value}{' '}
                        $SETH
                    </Label>
                    <Button
                        onClick={handleOnClick}
                        variant={'submit'}
                        className="w-1/2"
                    >
                        Send ${value} $SETH
                    </Button>
                    {statusTransaction === 'error' && (
                        <Label className="text-orange-500">
                            {' '}
                            Transaction Error ... <br />
                            <Label className="text-black">
                                Retry or contact support on Discord
                            </Label>
                        </Label>
                    )}
                </div>
            </div>
        )
    }

    return <section className="mx-auto w-fit p-12">{handleDisplay()}</section>
}

export default Payment
