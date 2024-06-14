import { useMutation } from '@tanstack/react-query'
import { Address } from 'viem'
import { assignAssessorSlot } from '@/server/actions/assessor/assignAssessorSlot'
type Props = {
    assessorAddr: Address | undefined
}

/**
 * This hook is used to asssign an AssessorSlot to user
 * @param {Props} props
 *
 *
 */
const useAssignAssessorSlot = ({ assessorAddr }: Props) => {
    const { data, mutateAsync, status, error } = useMutation({
        mutationKey: ['assignAssessor'],
        mutationFn: async () => {
            return await assignAssessorSlot({
                assessorAddr: assessorAddr as string,
            })
        },
        // enabled: false,
        retry: 1,
    })
    return { data, mutateAsync, error, status }
}

export { useAssignAssessorSlot }
