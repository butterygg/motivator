import { useQuery } from '@tanstack/react-query'
import { getAssessorSlotWithID } from '../../server/actions/assessor/getAssessorSlotWithID'

type Props = {
    assessorSlotID: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetAssessorSlotWithID = ({ assessorSlotID }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetAssessorSlotWithID'],
        queryFn: async () => {
            return await getAssessorSlotWithID(assessorSlotID)
        },
        // staleTime: 1000 * 6,
        retry: true,
        // enabled: false,
    })

    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetAssessorSlotWithID }
