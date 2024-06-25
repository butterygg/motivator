import { Status } from '@protocols/hyperdrive/types/enums/status'
import {
    Reward,
    Statistics,
    Totals,
} from '@protocols/hyperdrive/types/data/assessorSlot'

export type User = {
    id: string
    addressName: string
    pnl: number
    reward?: Reward
    status?: Status
    stat: {
        totals: Totals
        stats: {
            statsPoolETH: Statistics[]
            statsPoolDAI: Statistics[]
        }
    }
}
