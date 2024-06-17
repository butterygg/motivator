import React from 'react'
import { useGetTotalPointsDistributed } from '@/hooks/dataComponents/useGetTotalPointsDistributed'
import { cn } from '@/utils/utils'

type Props = {}

const TotalPoints = (props: Props) => {
    const val = useGetTotalPointsDistributed()

    return (
        <div className="flex gap-2 items-center">
            <h2 className="font-extralight text-xl">Points</h2>
            <p
                className={cn(
                    100 - val < 100 && 'text-blue-500',
                    100 - val < 0 && 'text-red-500',
                    100 - val == 0 && 'text-green-500',
                    'text-lg font-bold'
                )}
            >
                {100 - val}
            </p>
        </div>
    )
}

export default TotalPoints
