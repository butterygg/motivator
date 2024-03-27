import { useGetRewardedUsers } from '../reward/useGetRewardedUsers'
import { useEffect, useRef } from 'react'

type Props = {
    assessorSlotId: string
}

export const useGetTotalPointsDistributed = ({ assessorSlotId }: Props) => {
    const { data, refetch, error } = useGetRewardedUsers({
        assessorSlotId: assessorSlotId,
    })

    let totalPoints = 0
    let totalPointRef = useRef(totalPoints)
    useEffect(() => {
        if (data) {
            console.log(data, 'data')
            data.res?.forEach((element) => {
                // totalPointRef += element.amount ? element.amount : 0
            })
        }
    }, [data, refetch, error, assessorSlotId])
    return totalPoints
}
