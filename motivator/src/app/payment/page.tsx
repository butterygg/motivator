'use client'
import React from 'react'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { useSendTransaction } from 'wagmi'
import { Address, parseEther } from 'viem'
type Props = {}

const Payment = (props: Props) => {
    const { sendTransactionAsync } = useSendTransaction({
        mutation: {
            onSuccess(data, variables, context) {
                console.log('onSuccess')
            },
        },
    })

    const handleOnClick = async () => {
        await sendTransactionAsync({
            to: process.env.NEXT_PUBLIC_ADDRESS_RECEIVER
                ? (process.env.NEXT_PUBLIC_ADDRESS_RECEIVER as Address)
                : '0x0000000000000000000000000000000000000000',
            value: parseEther('0.1'),
        })
    }

    const value = 0.1
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
