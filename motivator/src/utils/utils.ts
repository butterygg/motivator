import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Grade } from '../types/enum/grade'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatAddress(address: string) {
    if (address?.startsWith('0x') && address.length >= 20) {
        const firstPart = address.slice(0, 6)
        const lastPart = address.slice(-3)

        return `${firstPart}...${lastPart}`
    }
    return address
}

export function transformNumberK(value: number) {
    if (value > 999) {
        return `${(value / 1000).toFixed(1)}k`
    }
    if (value < -999) {
        return `${(value / 1000).toFixed(1)}k`
    }
    return value.toFixed(2)
}

export function auditComputation(audit: Grade, rewards?: number) {
    switch (audit) {
        case Grade.A:
            return (rewards ? rewards : 0) + 20
        case Grade.B:
            return (rewards ? rewards : 0) + 2
        case Grade.C:
            return rewards ? rewards : 0
        default:
            return rewards ? rewards : 0
    }
}
