import { User } from './user'

export type AssessorSlot = {
    id: string
    assessorID: string
    done: boolean
    week: number
    users: string[]
    rewards: Reward[]
    stats: Stat[]
}

export type Stat = {
    user_address: string
    actions: number | null
    volume: number | null
}

export type Reward = {
    date: string | null
    user_address: string | null
    id: string
    amount: number | null
    assessor_slot_id: string | null
}
