'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot } from '@db/schema'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function generateAssessorSlots({
    assessorAddr,
}: {
    assessorAddr: string
}) {
    /**
     * Get Number Actions and Total Volume for each Users
     * Use ponderation to get the total score of each user
     * create pools of users with range of score
     * use frequencies number assignated to each pools
     * multiply the sum of all frequencies by the number of user and divide by 10 (the number of users by assessor slots)
     * then use frequencies to fill the assessor slots with user regarding each frequency
     * then define a composition of assessor slot model like 4 pool A 3 pool B 2 pool C 1 pool D
     * then for each assessor slot use the pool composition to assign users to the assessor slot
     * we will store the pool in an array and then parse the pool. When the pool will be parsed we will shuffle the pool to avoid same combination of users
     *
     */
    // * Get Number Actions and Total Volume for each Users
    const numberAndActionsFromUsers = await db.query.stats.findMany()

    // * Use ponderation to get the total score of each user
    const ratioVolume = 1.5
    const ratioActions = 3
    type ScoreAndAddress = {
        score: number
        address: string
    }
    // * Assign Ponderation score to users and store them in an array
    const scoreAndAddresseses: () => ScoreAndAddress[] = () => {
        const result: ScoreAndAddress[] = []
        numberAndActionsFromUsers.forEach((element) => {
            result.push({
                score:
                    (element?.actions ? element?.actions : 0 * ratioActions) +
                    (element?.volume ? element.volume : 0 * ratioVolume),
                address: element.user_address,
            })
        })
        return result
    }

    // * Define Range of Score

    const rangeD = 100
    const rangeC = 200
    const rangeB = 300

    type Pools = {
        poolA: ScoreAndAddress[]
        poolB: ScoreAndAddress[]
        poolC: ScoreAndAddress[]
        poolD: ScoreAndAddress[]
    }

    // * create pools of users with range of score
    const poolA: ScoreAndAddress[] = []
    const poolB: ScoreAndAddress[] = []
    const poolC: ScoreAndAddress[] = []
    const poolD: ScoreAndAddress[] = []
    let pools: Pools = { poolA, poolB, poolC, poolD }

    // * build pools
    const buildPools = (scoreAndAddresses: ScoreAndAddress[]) => {
        scoreAndAddresses.forEach((element) => {
            if (element.score < rangeD) {
                poolD.push(element)
            } else if (element.score < rangeC) {
                poolC.push(element)
            } else if (element.score < rangeB) {
                poolB.push(element)
            } else {
                poolA.push(element)
            }
        })
        pools = { poolA, poolB, poolC, poolD }
        return pools
    }

    // * use frequencies number assignated to each pools
    const frequenciesPoolA = 4
    const frequenciesPoolB = 3
    const frequenciesPoolC = 2
    const frequenciesPoolD = 1

    // * use frequencies number assignated to each pools
    const getNumberOfAssessorsSlot = () => {
        return (
            (pools.poolA.length * frequenciesPoolA +
                pools.poolB.length * frequenciesPoolB +
                pools.poolC.length * frequenciesPoolC +
                pools.poolD.length * frequenciesPoolD) /
            10
        )
    }

    const compositionPoolA = 4
    const compositionPoolB = 2
    const compositionPoolC = 2
    const compositionPoolD = 2
    const fillAssessorSlots = (numberOfAssessorsSlot: number) => {
        const assignation: ScoreAndAddress[] = []
        const assignationPoolA: ScoreAndAddress[][] = []
        // * Use frequency to repeat the assignation of users the numbers needed
        for (let index = 0; index < frequenciesPoolA; index++) {
            const tempAssessorSlot: ScoreAndAddress[] = []
            pools.poolA.forEach((element) => {
                tempAssessorSlot.push(element)
            })
        }

        // for (let i = 0; i < numberOfAssessorsSlot; i++) {
        //     assignation.push(...pools.poolA.splice(0, frequenciesPoolA))
        //     assignation.push(...pools.poolB.splice(0, frequenciesPoolB))
        //     assignation.push(...pools.poolC.splice(0, frequenciesPoolC))
        //     assignation.push(...pools.poolD.splice(0, frequenciesPoolD))
        // }

        // * then define a composition of assessor slot model like 4 pool A 3 pool B 2 pool C 1 pool D
        const poolComposition = []

        for (let index = 0; index < pools.poolA.length; index++) {}

        return assignation
    }

    // grab an assessor slot that is not done and has no assessor assigned
    const assessor_Slot = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.done, false),
            isNull(assessor_slot.assessor_ID)
        ),
    })

    if (assessor_Slot) {
        const assignAssessor = await db
            .update(assessor_slot)
            .set({
                assessor_ID: assessorAddr,
            })
            .where(
                and(
                    eq(assessor_slot.id, assessor_Slot.id),
                    isNull(assessor_slot.assessor_ID)
                )
            )

        if (assignAssessor) {
            return {
                status: 'ok',
                assessor_Slot,
                message: `Assessor slot assigned to ${assessorAddr}`,
            }
        } else {
            return {
                status: 'ko',
                message: 'Assessor slot already assigned',
            }
        }
    }

    return {
        status: 'ko',
        message: 'No assessor slot available',
    }
}
