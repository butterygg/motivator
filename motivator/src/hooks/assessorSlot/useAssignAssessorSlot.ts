import { useMutation } from '@tanstack/react-query'
import { Address } from 'viem'
import { assignAssessorSlot } from '@/server/actions/assessor/assignAssessorSlot'
type Props = {
    assessorAddress: Address | undefined
}

/**
 * This hook is used to asssign an AssessorSlot to user
 * @param {Props} props
 *
 *
 */
const useAssignAssessorSlot = ({ assessorAddress }: Props) => {
    const { data, mutate, status, error } = useMutation({
        mutationKey: ['assignAssessor'],
        mutationFn: async () => {
            return assignAssessorSlot({
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

export { useAssignAssessorSlot }
