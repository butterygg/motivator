import { useMutation } from '@tanstack/react-query'
import { addReward } from '@/server/actions/reward/addReward'
type Props = {
    userAddr: string
    value: number
    assessorSlotID: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useAddRewardUsers = ({ assessorSlotID, userAddr, value }: Props) => {
    const { data, mutate, status, error, mutateAsync } = useMutation({
        mutationKey: ['addRewardUsers'],
        mutationFn: async () => {
            return await addReward({
                assessorSlotID: assessorSlotID,
                userAddr: userAddr,
                value: value,
            })
        },
        // enabled: false,
        retry: 1,
    })
    return { data, mutate, error, status, mutateAsync }
}

export { useAddRewardUsers }
