import { usePathname } from 'next/navigation'

export const useGetAssessorSlotIDFromURL = () => {
    const url = usePathname()
    return url.split('/').pop()
}
