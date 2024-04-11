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
    // const alchemySettings = {
    //     apiKey: 'A23FM2MPsnG3CCpDqiDetU2HyIFtIwpb',
    //     network: Network.ETH_SEPOLIA,
    // }

    // const wsProvider = new ethers.providers.WebSocketProvider(
    //     'wss://eth-sepolia.g.alchemy.com/v2/A23FM2MPsnG3CCpDqiDetU2HyIFtIwpb',
    //     Network.ETH_SEPOLIA
    // )
    // wsProvider.perform('alchemy_getTransactionByHash', [hash])
    // console.log('STILL NOT WORKING ')
    // const alchemy = new Alchemy(alchemySettings)

    // Get the latest block
    // const transaction = await alchemy.core.getTransaction(hash)

    // const provider = new ethers.providers.InfuraProvider('sepolia')

    // Connect to mainnet with a Project ID (these are equivalent)
    // const provider = new ethers.providers.InfuraProvider(
    //     'sepolia',
    //     'e210bca124a44fa881d3242e3394ada6'
    // )

    // Connect to mainnet with a Project ID and Project Secret
    const provider = new InfuraProvider(
        'sepolia',
        'e210bca124a44fa881d3242e3394ada6',
        'ILWXBT5yyWXGOHmR0o5UNc2EF/xjLnDHQ3pkE9bpVyyRGxO68Jx3qA'
    )

    // // Connect to the INFURA WebSocket endpoints with a WebSocketProvider
    // provider = InfuraProvider.getWebSocketProvider()
    // console.log('provider', provider)
    // const providerX = new ethers.providers.JsonRpcProvider(
    //     'https://sepolia.infura.io/v3/e210bca124a44fa881d3242e3394ada6',
    //     ethers.providers.getNetwork('sepolia')
    // )
    // const provider = new ethers.JsonRpcProvider(
    //     process.env.NEXT_PUBLIC_RPC_PROVIDER
    //   );
    const tx = await provider.getTransaction(hash)
    console.log('XXX', tx)
    // const transaction = await provider.getTransactionReceipt(hash)
    // console.log(transaction)
    // const provider = new AlchemyProvider();
    // console.log(transaction)
    // const transaction = await provider.getTransaction(hash)
    // tx.

    // const transaction = await publicClient.getTransaction({
    //     blockHash: hash,
    //     index: 0,
    // })
    // const transaction = await getTransaction(config, {
    //     hash: hash,
    // })

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
