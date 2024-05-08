import { useQuery } from '@tanstack/react-query'
import { getRewardFromUser } from '@/server/actions/reward/getRewardFromUser'
type Props = {
    userAddr: string
}

/**
 * This hook is used to fetch the Rewards of the user
 * @param {Props} props
 *
 *
 */
const useGetRewardFromUser = ({ userAddr }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['getRewardUsers'],
        queryFn: async () => {
            return getRewardFromUser(userAddr)
        },
        refetchInterval: 1000 * 3,
    })
    return { data, refetch, error, status }
}

export { useGetRewardFromUser }
