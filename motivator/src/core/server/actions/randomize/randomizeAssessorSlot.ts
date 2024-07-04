'use server'
import { Address } from 'viem'
import { proxyRandomizeAssessorSlot } from './proxyRandomizeAssessorSlot'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function randomizeAssessorSlot({
    assessorAddr,
}: {
    assessorAddr: string
}) {
    /**
     * Get Number Actions and Total Volume for each Users
     * Use ponderation to get the total score of each user
     * Normalize Score
     */

    // const getTotalsForUsers = await getAllTotalsForUsersPromised()

    type ScoreAndAddress = {
        score: number
        address: string
    }

    const protocol = process.env.NEXT_PUBLIC_PROJECT_NAME as string

    const generalPool: ScoreAndAddress[] = []
    // append the pool to general pool foreach frequency
    const cumulativeList = (list: ScoreAndAddress[]) => {
        list.forEach((element) => {
            for (let index = 0; index < element.score; index++) {
                generalPool.push(element)
            }
        })
    }

    // Pick X users randomly from the pool and ensure that the same user is not picked twice
    const pickXUsersRandomly = (pool: ScoreAndAddress[], x: number) => {
        const result: Address[] = []
        for (let index = 0; index < x; index++) {
            if (index > pool.length - 1) {
                break
            }
            const randomIndex = Math.floor(Math.random() * pool.length)
            // * Check if the user is already in the result, if yes pick another one
            if (
                result.find((element) => element === pool[randomIndex].address)
            ) {
                pool.splice(randomIndex, 1)
                index--
                continue
            }
            result.push(pool[randomIndex].address as Address)
            pool.splice(randomIndex, 1)
        }
        return result
    }

    const randomizeAssessorSlot = async () => {
        // * Get the number of assessor slot
        const scoreAndAddresseses = proxyRandomizeAssessorSlot({ protocol })
        cumulativeList(scoreAndAddresseses)
        return pickXUsersRandomly(generalPool, 10)
    }

    return await randomizeAssessorSlot()
}
