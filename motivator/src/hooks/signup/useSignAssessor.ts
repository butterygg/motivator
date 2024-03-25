import { useMutation, useQuery } from '@tanstack/react-query'
import { getRewardedUsers } from '@/server/actions/reward/getRewardedUsers'
import { Answer } from '@/types/data/answer'
import { addReward } from '@/server/actions/reward/addReward'
import { signAssessor } from '../../server/actions/assessor/signAssessor'
import { Address } from 'viem'
type Props = {
    assessorAddress: Address | undefined
}

/**
 * This hook is used to sign Assessor into game
 * @param {Props} props
 *
 *
 */
const useSignAssessor = ({ assessorAddress }: Props) => {
    const { data, mutate, status, error } = useMutation({
        mutationKey: ['signAssessor'],
        mutationFn: async () => {
            return signAssessor({
                assessorAddr: assessorAddress as string,
            })
        },
        // enabled: false,
        retry: 1,
    })
    console.log(data, 'data')
    console.log(error, 'error')
    return { data, mutate, error, status }
}

export { useSignAssessor }
