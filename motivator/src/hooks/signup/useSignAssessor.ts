import { useMutation } from '@tanstack/react-query'
import { signAssessor } from '../../server/actions/assessor/signAssessor'
import { Address } from 'viem'
type Props = {
    assessorAddr: Address | undefined
}

/**
 * This hook is used to sign Assessor into game
 * @param {Props} props
 *
 *
 */
const useSignAssessor = ({ assessorAddr }: Props) => {
    const { data, mutate, status, error } = useMutation({
        mutationKey: ['signAssessor'],
        mutationFn: async () => {
            return signAssessor({
                assessorAddr: assessorAddr as string,
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
