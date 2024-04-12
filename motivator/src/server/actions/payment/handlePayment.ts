'use server'
import { config, publicClient, alchemySettings } from '@/utils/Web3Provider'

import { Address, parseEther } from 'viem'
import { randomizeAssessorSlot } from '../randomize/randomizeAssessorSlot'
import { generateAssessorSlot } from '../assessor/generateAssessorSlot'
import { InfuraProvider, ethers } from 'ethers'
// import { Network, Alchemy } from 'alchemy-sdk'

/** handle Payment coming from front end
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
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

    // const isTransactionConfirmed = await getTransactionConfirmations(config, {
    //     hash: hash,
    // })

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

    /**
     * Get Number Actions and Total Volume for each Users
     * Use ponderation to get the total score of each user
     * Normalize Score
     */
}
