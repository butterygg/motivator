import { useAccount } from 'wagmi'
import { useGetAssessorSlot } from '../assessorSlot/useGetAssessorSlotWithAddr'

export const useHomeAssessorData = () => {
    console.log('Hook HomeAssessor')
    const { address } = useAccount()
    const { data, error, refetch } = useGetAssessorSlot({
        // assessorAddr: address ? address : '0x0',
        assessorAddr: address ? address : '0x0',
    })

    return { data, refetch, error }
}
