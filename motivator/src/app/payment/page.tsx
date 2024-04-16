/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAccount, useSendTransaction, useTransaction } from 'wagmi'
import { Address, parseEther } from 'viem'
import { handlePayment } from '@/server/actions/payment/handlePayment'
import { useRouter } from 'next/navigation'
import { useGetAssessorSlot } from '../../hooks/assessorSlot/useGetAssessorSlot'
import { useSession } from 'next-auth/react'
import { RoundSpinner, SpokeSpinner } from '@/components/ui/spinner'
import { ethers } from 'ethers'
import { waitForTransactionReceipt } from '@wagmi/core'
import { useWaitForTransactionReceipt } from 'wagmi'
import { SpokeCheck } from '../../components/ui/check'
import { Card } from '../../components/ui/card'
type Props = {}

const Payment = (props: Props) => {
    // Using wagmi hook to get status of user
    const { address } = useAccount()

    // Using session hook to get status of user
    const [assessorSlotFinded, setAssessorSlotFinded] = useState(false)

    const {
        data: assessorSlot,
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
        if (assessorSlot?.res?.id) {
            setAssessorSlotFinded(true)
            setTimeout(() => {
                push(`/assessor/slot/${assessorSlot?.res?.id}`)
            }, 2000)
        }
    }, [assessorSlot])
    const value = process.env.NEXT_PUBLIC_ASSESSOR_VALUE as string
    const {
        sendTransactionAsync,
        status: statusTransaction,
        data: hashTransaction,
    } = useSendTransaction()
    const {
        refetch: refetchReceipt,
        data: transactionReceipt,
        status: statusReceipt,
    } = useWaitForTransactionReceipt({
        hash: hashTransaction,
        pollingInterval: 3000,
    })

    const {
        data: DataTransaction,
        refetch: RefetchTransaction,
        status: statusGetTransaction,
    } = useTransaction({
        hash: hashTransaction,
    })
    const handleOnClick = async () => {
        await sendTransactionAsync({
            to: process.env.NEXT_PUBLIC_ADDRESS_RECEIVER
                ? (process.env.NEXT_PUBLIC_ADDRESS_RECEIVER as Address)
                : '0x0000000000000000000000000000000000000000',
            value: parseEther(value),
        })
    }

    const managePayment = async () => {
        const assessorSlot = await handlePayment({
            assessorAddr: address ? (address as Address) : '0x0',
            hash: hashTransaction ? (hashTransaction as Address) : '0x0',
        })
        if (assessorSlot?.status === 'ok' && assessorSlot.assessorSlot) {
            push(`/assessor/slot/${assessorSlot.assessorSlot?.id as string}`)
        }
    }

    useEffect(() => {
        if (transactionReceipt?.status === 'success') {
            console.log('Transaction Receipt success', transactionReceipt)
            managePayment()
        }
        refetchReceipt()
    }, [
        transactionReceipt,
        refetchReceipt,
        statusTransaction,
        statusReceipt,
        DataTransaction,
        hashTransaction,
    ])

    const handleDisplay = () => {
        if (assessorSlotFinded) {
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
        if (
            statusTransaction === 'pending' ||
            statusTransaction === 'success'
        ) {
            return (
                <div className="flex flex-col gap-4 items-center">
                    <div className="flex gap-2 items-center">
                        {statusTransaction === 'pending' ? (
                            <>
                                <Label className="font-bold">
                                    Waiting Validation
                                </Label>
                                <RoundSpinner size="xl" />
                            </>
                        ) : (
                            <>
                                <Label className="font-bold">
                                    Transaction sent
                                </Label>
                                <SpokeCheck color="green" size="xl" />
                            </>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        {transactionReceipt?.status != 'success' ? (
                            <>
                                <Label className="font-bold">
                                    Transaction sent waiting for confirmation
                                </Label>
                                <RoundSpinner size="xl" />
                            </>
                        ) : (
                            <>
                                <Label className="font-bold">
                                    Transaction confirmed
                                </Label>
                                <SpokeCheck color="green" size="xl" />
                            </>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <Label className="font-bold">
                            Redirection incoming ...
                        </Label>
                        <RoundSpinner size="xl" />
                    </div>
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
