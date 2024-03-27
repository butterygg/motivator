import React from 'react'
import { useGetTotalPointsDistributed } from '../../hooks/dataComponents/useGetTotalPointsDistributed'

type Props = {}

const TotalPoints = (props: Props) => {
    const val = useGetTotalPointsDistributed({
        assessorSlotId: 'assessorSlotId',
    })

    return (
        <div>
            <h2>Total Points</h2>
            <p>{val - 100}</p>
        </div>
    )
}

export default TotalPoints
