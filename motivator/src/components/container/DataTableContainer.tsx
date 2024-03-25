import React from 'react'
import { DataTable } from '../assessor/DataTable'
import { useHomeAssessorData } from '../../hooks/dataComponents/useHomeAssessorData'
import { AssessorSlot } from '../../types/data/assessorSlot'
import { useGetAssessorSlot } from '../../hooks/useGetAssessorSlot'

type Props = {}

const DataTableContainer = (props: Props) => {
    const dummyAssessorSlot: AssessorSlot = {
        id: '1',
        assessorID: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
        rewards: [
            {
                date: '2021-09-10',
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
                id: '1',
                amount: 100,
                assessor_slot_ID: '1',
            },
        ],
        users: [
            '0x8753DE1914c4AB01F845b05b7BC146Bc898850A2',
            '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
        ],
        done: false,
        week: 0,
        stats: [
            {
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A2',
                actions: 40,
                volume: 500,
            },
            {
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
                actions: 40,
                volume: 500,
            },
            {
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
                actions: 40,
                volume: 500,
            },
        ],
    }
    const { data, error, status } = useGetAssessorSlot({
        assessorAddress: '0x0',
    })

    if (status === 'pending') {
        return <div>Loading...</div>
    }

    if (status === 'error') {
        return (
            <div>
                Error: {error?.message}
                <DataTable assessorSlot={dummyAssessorSlot} />
            </div>
        )
    }

    if (!data) {
        return <div>No data</div>
    }

    return <DataTable assessorSlot={data.res as AssessorSlot} />
}

export default DataTableContainer
