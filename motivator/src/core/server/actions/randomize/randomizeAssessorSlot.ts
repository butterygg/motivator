'use server'
import { Address } from 'viem'
import { getTotals } from '@/server/actions/globals/getTotals'
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
    // * Get Number Actions and Total Volume for each Users
    // const numberAndActionsFromUsers = await db.query.stats.findMany()
    const getTotalsForUsers = await getTotals()

    // const getTotalsForUsers = await getAllTotalsForUsersPromised()

    // * Use ponderation to get the total score of each user
    const ratioVolume = 0
    const ratioActions = 1

    const totalMultiplier = Number(
        process.env.NEXT_PUBLIC_ASSESSOR_MULTIPLIER
            ? process.env.NEXT_PUBLIC_ASSESSOR_MULTIPLIER
            : 10
    )

    type ScoreAndAddress = {
        score: number
        address: string
    }
    let sumOfScore = 0
    // * Assign Ponderation score to users and store them in an array
    const getScoreAndAddresseses: () => ScoreAndAddress[] = () => {
        const result: ScoreAndAddress[] = []
        getTotalsForUsers.forEach((element) => {
            result.push({
                score:
                    (element?.totalActions
                        ? element?.totalActions
                        : 0 * ratioActions) +
                    (element?.totalVolumePoolDai
                        ? element.totalVolumePoolDai
                        : 0 * ratioVolume) +
                    (element?.totalVolumePoolEth
                        ? element.totalVolumePoolEth
                        : 0 * ratioVolume),
                address: element.user_address as Address,
            })

            sumOfScore += result[result.length - 1].score
        })
        // * Normalize the score
        result.forEach((element) => {
            element.score = (element.score / sumOfScore) * totalMultiplier
        })
        return result
    }
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
        const scoreAndAddresseses = getScoreAndAddresseses()
        cumulativeList(scoreAndAddresseses)
        return pickXUsersRandomly(generalPool, 10)
    }

    return await randomizeAssessorSlot()
}
