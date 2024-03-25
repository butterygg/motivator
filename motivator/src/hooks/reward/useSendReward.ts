import { useQuery } from '@tanstack/react-query'
import { getRewardedUsers } from '@/server/actions/reward/getRewardedUsers'
import { Answer } from '@/types/data/answer'
import { addReward } from '@/server/actions/reward/addReward'
type Props = {
    assessorAddress: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useAddRewardUsers = ({ assessorAddress }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['sendRewardUsers'],
        queryFn: async () => {
            return addReward({
                assessorSlot: assessorAddress,
                userAddr: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
                value: 100,
                assessorAddress: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            })
        },
        // enabled: false,
        retry: 1,
    })
    console.log(data, 'data')
    console.log(error, 'error')
    return { data, refetch, error, status }
}

export { useAddRewardUsers }
