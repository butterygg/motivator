import { Status } from '@/types/enum/status'
import { Reward, Stat } from './assessorSlot'

export type User = {
    id: string
    addressName: string
    pnl: number
    reward?: Reward
    stat: Stat
    status?: Status
}
