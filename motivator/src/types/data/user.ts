import { Status } from '@/types/enum/status'
import { Reward, Statistics, Totals } from './assessorSlot'

export type User = {
    id: string
    addressName: string
    pnl: number
    reward?: Reward
    status?: Status
    stat: {
        totals: Totals
        stats: Statistics[]
    }
}
