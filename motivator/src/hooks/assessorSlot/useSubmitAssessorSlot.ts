import { useMutation } from '@tanstack/react-query'
import { Address } from 'viem'
import { assignAssessorSlot } from '@/server/actions/assessor/assignAssessorSlot'
import { submitAssessorSlot } from '../../server/actions/assessor/submitAssessorSlot'
type Props = {
    assessorSlotID: string
    assessorAddr: Address
}

/**
 * This hook is used to SubmitAssessorSlot
 * @param {Props} props
 *
 *
 */
const useSubmitAssessorSlot = ({ assessorSlotID, assessorAddr }: Props) => {
    const { data, mutateAsync, status, error } = useMutation({
        mutationKey: ['assignAssessor'],
        mutationFn: async () => {
            return await submitAssessorSlot({
                assessorSlotID: assessorSlotID,
                assessorAddr: assessorAddr as string,
            })
        },

        // enabled: false,

        retry: 1,
    })
    return { data, mutateAsync, error, status }
}

export { useSubmitAssessorSlot }
