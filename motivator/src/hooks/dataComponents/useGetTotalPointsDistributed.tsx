import { useGetRewardedUsers } from '../reward/useGetRewardedUsers'
import { useEffect, useRef, useState } from 'react'

type Props = {
    assessorSlotId: string
}

export const useGetTotalPointsDistributed = ({ assessorSlotId }: Props) => {
    const { data, refetch, status, error } = useGetRewardedUsers({
        assessorSlotId: assessorSlotId,
    })
    let totalPoints = 0
    data?.res?.forEach((element) => {
        totalPoints += element.amount ? element.amount : 0
    })

    return totalPoints
}
