import React from 'react'
import { useGetTotalPointsDistributed } from '../../hooks/dataComponents/useGetTotalPointsDistributed'

type Props = {}

const TotalPoints = (props: Props) => {
    const val = useGetTotalPointsDistributed({
        assessorSlotId: 'assessorSlotId',
    })

    return (
        <div className="flex gap-2 items-center">
            <h2 className="font-extralight text-xl">Points</h2>
            <p className="text-lg font-bold">{100 - val}</p>
        </div>
    )
}

export default TotalPoints
