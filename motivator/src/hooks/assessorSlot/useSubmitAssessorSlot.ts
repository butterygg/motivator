import { useMutation } from '@tanstack/react-query'
import { Address } from 'viem'
import { assignAssessorSlot } from '@/server/actions/assessor/assignAssessorSlot'
import { submitAssessorSlot } from '../../server/actions/assessor/submitAssessorSlot'
type Props = {
    assessorAddr: Address | undefined
}

/**
 * This hook is used to SubmitAssessorSlot
 * @param {Props} props
 *
 *
 */
const useSubmitAssessorSlot = ({ assessorAddr }: Props) => {
    const { data, mutateAsync, status, error } = useMutation({
        mutationKey: ['assignAssessor'],
        mutationFn: async () => {
            return submitAssessorSlot({
                assessorAddr: assessorAddr as string,
            })
        },
        // enabled: false,
        retry: 1,
    })
    return { data, mutateAsync, error, status }
}

export { useSubmitAssessorSlot }
