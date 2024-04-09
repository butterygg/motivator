'use server'
import { config } from '@/utils/Web3Provider'
import {
    getAccount,
    getTransactionConfirmations,
    getTransaction,
} from '@wagmi/core'
import { Address, parseEther } from 'viem'
import { randomizeAssessorSlot } from '../randomisation/randomizeAssessorSlot'
/** handle Payment coming from front end
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function handlePayment({
    assessorAddr,
    hash,
    value,
}: {
    assessorAddr: string
    hash: Address
    value: string
}) {
    const { address } = getAccount(config)
    const transaction = await getTransaction(config, {
        hash: hash,
    })

    if (transaction.from !== address) {
        return {
            status: 'failed',
            message: 'Transaction is not from the right address',
        }
    }

    if (
        transaction.value !==
        parseEther(process.env.NEXT_PUBLIC_ASSESSOR_VALUE as string)
    ) {
        return {
            status: 'failed',
            message: 'Transaction value is not the right value',
        }
    }

    const isTransactionConfirmed = await getTransactionConfirmations(config, {
        hash: hash,
    })

    if (Number(isTransactionConfirmed) == 0) {
        return {
            status: 'failed',
            message: 'Transaction is not confirmed',
        }
    }

    return await randomizeAssessorSlot({ assessorAddr })

    /**
     * Get Number Actions and Total Volume for each Users
     * Use ponderation to get the total score of each user
     * Normalize Score
     */
}
