'use server'
import { eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { offChainActions } from '@db/schema'
// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function getOffChainActions(user_address: string) {
    const getOffChainActions = await db.query.offChainActions.findMany({
        where: eq(offChainActions.user_address, user_address),
    })

    if (!getOffChainActions) {
        return {
            status: 'ko',
            message: 'No offchain actions available',
        }
    }
    return {
        status: 'ok',
        message: 'Offchain actions available',
        res: getOffChainActions,
    }
}
