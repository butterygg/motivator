import { useQuery } from '@tanstack/react-query'
import { getRewardedUsers } from '@/server/actions/reward/getRewardedUsers'
import { Answer } from '@/types/data/answer'
type Props = {
    assessorSlotId: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetRewardedUsers = ({ assessorSlotId }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['getRewardUsers'],
        queryFn: async () => {
            return getRewardedUsers(assessorSlotId)
        },
        // enabled: false,
        retry: 1,
    })
    console.log(data, 'data')
    console.log(error, 'error')
    return { data, refetch, error, status }
}

export { useGetRewardedUsers }
