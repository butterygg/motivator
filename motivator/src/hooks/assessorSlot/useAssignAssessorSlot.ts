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
            return assignAssessorSlot({
                assessorAddr: assessorAddr as string,
            })
        },
        // enabled: false,
        retry: 1,
    })
    console.log(data, 'data')
    console.log(error, 'error')
    return { data, mutateAsync, error, status }
}

export { useAssignAssessorSlot }
