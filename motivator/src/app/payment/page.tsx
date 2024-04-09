'use client'
import React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAccount, useSendTransaction } from 'wagmi'
import { Address, parseEther } from 'viem'
import { handlePayment } from '@/server/actions/payment/handlePayment'
import { useRouter } from 'next/navigation'
type Props = {}

const Payment = (props: Props) => {
    const { address } = useAccount()
    const { push } = useRouter()
    const value = process.env.NEXT_PUBLIC_ASSESSOR_VALUE as string
    const { sendTransactionAsync } = useSendTransaction({
        mutation: {
            async onSuccess(data, variables, context) {
                const assessorSlot = await handlePayment({
                    assessorAddr: address ? (address as Address) : '0x0',
                    hash: data,
                })
                if (
                    assessorSlot?.status === 'ok' &&
                    assessorSlot.assessorSlot
                ) {
                    push(
                        `/assessor/slot/${assessorSlot.assessorSlot?.id as string}`
                    )
                }
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

    return (
        <section className="mx-auto w-fit p-12">
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
                </div>
            </div>
        </section>
    )
}

export default Payment
