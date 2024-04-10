'use server'
import { config, publicClient, alchemySettings } from '@/utils/Web3Provider'
import {
    getAccount,
    getTransactionConfirmations,
    getTransaction,
} from '@wagmi/core'
import { Address, parseEther } from 'viem'
import { randomizeAssessorSlot } from '../randomize/randomizeAssessorSlot'
import { generateAssessorSlot } from '../assessor/generateAssessorSlot'
import { ethers } from 'ethers'
import { Network, Alchemy } from 'alchemy-sdk'

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
    const alchemySettings = {
        apiKey: 'A23FM2MPsnG3CCpDqiDetU2HyIFtIwpb',
        network: Network.ETH_SEPOLIA,
    }
    console.log('STILL NOT WORKING ')
    const alchemy = new Alchemy(alchemySettings)

    // Get the latest block
    const transaction = await alchemy.core.getTransaction(hash)
    // const transaction = await ethers.providers
    //     .getDefaultProvider()
    //     .getTransactionReceipt(hash)

    // const provider = new AlchemyProvider();
    // const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/A23FM2MPsnG3CCpDqiDetU2HyIFtIwpb');
    console.log(transaction)
    // const transaction = await provider.getTransaction(hash)
    // tx.

    // const transaction = await publicClient.getTransaction({
    //     blockHash: hash,
    //     index: 0,
    // })
    // const transaction = await getTransaction(config, {
    //     hash: hash,
    // })

    if (transaction?.from !== assessorAddr) {
        return {
            status: 'failed',
            message: 'Transaction is not from the right address',
        }
    }

    if (
        transaction?.value.toBigInt() !==
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
