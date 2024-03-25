import { useMutation } from '@tanstack/react-query'
import { addReward } from '@/server/actions/reward/addReward'
type Props = {
    userAddr: string
    value: number
    assessorSlot: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useAddRewardUsers = ({ assessorSlot, userAddr, value }: Props) => {
    const { data, mutate, status, error } = useMutation({
        mutationKey: ['addRewardUsers'],
        mutationFn: async () => {
            return addReward({
                assessorSlot: assessorSlot,
                userAddr: userAddr,
                value: value,
            })
        },
        // enabled: false,
        retry: 1,
    })
    console.log(data, 'data')
    console.log(error, 'error')
    return { data, mutate, error, status }
}

export { useAddRewardUsers }
