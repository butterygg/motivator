export type OnChainAction = {
    timestamp: number
    type: string
    value: number
    pair: string
}

export type OffChainAction = {
    type: string
    value: string
}
