import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Address, parseEther } from 'viem'
import {
    useAccount,
    useSendTransaction,
    useWaitForTransactionReceipt,
    useTransaction,
} from 'wagmi'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'
import { handlePayment } from '@/server/actions/payment/handlePayment'
import { DisplayPayment } from '@/components/payment/DisplayPayment'

type Props = {}

const PaymentContainer = (props: Props) => {
    // Using wagmi hook to get status of user
    const { address, isConnected } = useAccount()

    // Using session hook to get status of user
    const [assessorSlotFinded, setAssessorSlotFinded] = useState(false)

    const [isPurchaseReady, setIsPurchaseReady] = useState(isConnected)

    const {
        data: assessorSlot,
        refetch,
        status: statusAssessorSlot,
    } = useGetAssessorSlot({
        assessorSlotAddr: address ? address : '',
    })
    const { push } = useRouter()
    useEffect(() => {
        if (refetch) {
            refetch()
        }
    }, [address, statusAssessorSlot])

    useEffect(() => {
        console.log('isConnected', isConnected)
        console.log('statusAssessorSlot', statusAssessorSlot)
        console.log('isPurchaseReady', isPurchaseReady)
        if (
            isConnected &&
            statusAssessorSlot == 'success' &&
            !isPurchaseReady
        ) {
            setIsPurchaseReady(true)
        } else {
            setIsPurchaseReady(false)
        }
    }, [isConnected, statusAssessorSlot])

    useEffect(() => {
        if (assessorSlot?.res?.assessorSlotCore.id) {
            setAssessorSlotFinded(true)
            setTimeout(() => {
                push(`/assessor/slot/${assessorSlot?.res?.assessorSlotCore.id}`)
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

    const { data: DataTransaction } = useTransaction({
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
    return (
        <div>
            <DisplayPayment
                assessorSlotFinded={assessorSlotFinded}
                statusTransaction={statusTransaction}
                transactionReceipt={undefined}
                value={0}
                isPurchaseReady={false}
                handleOnClick={handleOnClick}
            />
        </div>
    )
}

export default PaymentContainer
