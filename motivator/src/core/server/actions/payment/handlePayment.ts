'use server'

import { Address, parseEther } from 'viem'
import { randomizeAssessorSlot } from '@/server/actions/randomize/randomizeAssessorSlot'
import { generateAssessorSlot } from '@/server/actions/assessor/generateAssessorSlot'
import { InfuraProvider } from 'ethers'

/** handle Payment coming from front end
 * @param {string} assessorAddr
 * @param {Address} hash
 * @returns {Promise<{status: string, message: string, assessorSlot: AssessorSlot}>}
 *
 */
export async function handlePayment({
    assessorAddr,
    hash,
}: {
    assessorAddr: string
    hash: Address
}) {
    // Connect to mainnet with a Project ID and Project Secret
    const provider = new InfuraProvider(
        'sepolia',
        process.env.INFURA_PROJECT_ID,
        process.env.INFURA_SECRET
    )

    const tx = await provider.getTransaction(hash)

    if (tx?.from !== assessorAddr) {
        return {
            status: 'failed',
            message: 'Transaction is not from the right address',
        }
    }

    if (
        tx?.value !==
        parseEther(process.env.NEXT_PUBLIC_ASSESSOR_VALUE as string)
    ) {
        return {
            status: 'failed',
            message: 'Transaction value is not the right value',
        }
    }

    if (tx?.blockNumber == null) {
        return {
            status: 'failed',
            message: 'Transaction is not confirmed',
        }
    }

    const listToInsertInAssessor = await randomizeAssessorSlot({ assessorAddr })

    const assessorSlot = await generateAssessorSlot({
        assessorAddr,
        userList: listToInsertInAssessor,
    })

    if (assessorSlot.status === 'ok') {
        return {
            status: 'ok',
            message: 'Assessor Slot generated',
            assessorSlot: assessorSlot.assessorSlot,
        }
    }
}
