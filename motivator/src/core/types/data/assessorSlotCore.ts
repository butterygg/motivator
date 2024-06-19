import { Address } from 'viem'
import { Grade } from '@/types/enums/grade'

export type AssessorSlotCore = {
    id: string
    assessorID: string
    done: boolean
    audit?: {
        auditGrade: Grade | null
        auditorAddress: Address | null
    } | null
}
