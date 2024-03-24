export type AssessorSlot = {
    id: string
    assessorID: string
    done: boolean
    week: number
}

export type Stat = {
    userAddress: string
    actions: number
    volume: number
}

export type Reward = {
    id: string
    amount: number
    date: string
    assessorSlotID: string
    userAddress: string
}
