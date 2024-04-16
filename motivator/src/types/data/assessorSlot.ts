import { User } from './user'

export type AssessorSlot = {
    id: string
    assessorID: string
    done: boolean
    week: number
    users: string[]
    rewards: Reward[]
    totals: Totals[]
    statistics: Statistics[]
}

export type Totals = {
    user_address: string
    timestamp: Date
    totalActions: bigint
    totalVolume: bigint
    totalPnl: bigint
}

export type Statistics = {
    user_address: string
    timestamp: string | null
    pnl_longs: bigint | null
    pnl_shorts: bigint | null
    pnl_lps: bigint | null
    volume_longs: bigint | null
    volume_shorts: bigint | null
    volume_lps: bigint | null
    balance_longs: bigint | null
    balance_shorts: bigint | null
    balance_lps: bigint | null
    action_count_shorts: bigint | null
    action_count_longs: bigint | null
    action_count_lps: bigint | null
}

export type Reward = {
    date: string | null
    user_address: string | null
    id: string
    amount: number | null
    assessor_slot_id: string | null
}
