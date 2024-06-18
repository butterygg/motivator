import { Address } from 'viem'
import { getTotals } from '@/server/actions/globals/getTotals'

type ScoreAndAddress = {
    score: number
    address: string
}

// * Get Number Actions and Total Volume for each Users
// const numberAndActionsFromUsers = await db.query.stats.findMany()
const getTotalsForUsers = await getTotals()

// * Use ponderation to get the total score of each user
const ratioVolume = 0
const ratioActions = 1

const totalMultiplier = Number(
    process.env.NEXT_PUBLIC_ASSESSOR_MULTIPLIER
        ? process.env.NEXT_PUBLIC_ASSESSOR_MULTIPLIER
        : 10
)

// * Assign Ponderation score to users and store them in an array
export const getScoreAndAddr: () => ScoreAndAddress[] = () => {
    let sumOfScore = 0
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
