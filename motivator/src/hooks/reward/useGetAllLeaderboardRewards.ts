import { useQuery } from '@tanstack/react-query'
import { getAllLeaderboardRewards } from '@/server/actions/reward/getAllLeaderboardRewards'
type Props = {
    userAddr: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetAllLeaderboardRewards = () => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['getRewardUsers'],
        queryFn: async () => {
            return getAllLeaderboardRewards()
        },
    })
    return { data, refetch, error, status }
}

export { useGetAllLeaderboardRewards }
