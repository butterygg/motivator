import { eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import {
    assessor_slot,
    assessor,
    user,
    stats,
    assessor_slot_user,
} from '@db/schema'
/** Create a DataSet for the test in Neon Db
 *  We just need to generate a Dataset on each table of the schema
 *  Insert some fresh data into the DB
 */
export async function populateNeonDataset() {
    // Create a new Assessor Slot
    const assessorSlot = await db
        .insert(assessor_slot)
        .values({
            assessor_ID: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            done: false,
            week: 0,
        })
        .execute()
    console.log('assessorSlot', assessorSlot)
    // Create a new Assessor Slot
    const assessorSlot2 = await db
        .insert(assessor_slot)
        .values({
            assessor_ID: '0x4753DE1914c4AB01F845b05b7BC146Bc898850A6',
            done: false,
            week: 0,
        })
        .execute()
    console.log('assessorSlot2', assessorSlot2)

    // Create a new Assessor

    const assessor1 = await db
        .insert(assessor)
        .values({
            address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
        })
        .execute()
    console.log('assessor1', assessor1)

    const assessor2 = await db
        .insert(assessor)
        .values({
            address: '0x4753DE1914c4AB01F845b05b7BC146Bc898850A6',
        })
        .execute()
    console.log('assessor2', assessor2)

    // Create users with stats
    const user1 = await db
        .insert(user)
        .values({
            address: '0x8773DE1914c4AB01F845b05b7BC146Bc898850A6',
        })
        .execute()
    console.log('user1', user1)

    const user2 = await db
        .insert(user)
        .values({
            address: '0x2B091fD455F320527b70223A27436C6d0CDDf508',
        })
        .execute()
    console.log('user2', user2)

    // Create stats for the users
    const stats1 = await db
        .insert(stats)
        .values({
            user_address: '0x8773DE1914c4AB01F845b05b7BC146Bc898850A6',
            actions: 40,
            volume: 100,
        })
        .execute()
    console.log('stats1', stats1)

    const stats2 = await db
        .insert(stats)
        .values({
            user_address: '0x2B091fD455F320527b70223A27436C6d0CDDf508',
            actions: 10,
            volume: 5000,
        })
        .execute()
    console.log('stats2', stats2)

    // // populate the assessor slot with users

    // const assessorSlotUser1 = await db
    //     .insert(assessor_slot_user)
    //     .values({
    //         user_address: '0x8773DE1914c4AB01F845b05b7BC146Bc898850A6',
    //         assessor_slot_id: assessorSlot2.,
    //     })

    const findAssessorSlotsIDs = await db.query.assessor_slot.findMany({
        columns: { id: true },
        where: isNull(assessor_slot.done),
    })

    const addUsersToAssessorSlot1 = await db.insert(assessor_slot_user).values({
        user_address: '0x8773DE1914c4AB01F845b05b7BC146Bc898850A6',
        assessor_slot_id: findAssessorSlotsIDs[0].id,
    })
    console.log('addUsersToAssessorSlot1', addUsersToAssessorSlot1)

    const addUsersToAssessorSlot2 = await db.insert(assessor_slot_user).values({
        user_address: '0x2B091fD455F320527b70223A27436C6d0CDDf508',
        assessor_slot_id: findAssessorSlotsIDs[0].id,
    })
    console.log('addUsersToAssessorSlot2', addUsersToAssessorSlot2)
}
