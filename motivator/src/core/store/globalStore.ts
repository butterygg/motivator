import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing

interface GlobalState {
    refreshPointsNeeded: boolean
    refreshPoints: (by: boolean) => void
}

export const useGlobalState = create<GlobalState>()(
    devtools(
        persist(
            (set) => ({
                refreshPointsNeeded: true,
                refreshPoints: (by) =>
                    set((state) => ({ refreshPointsNeeded: by })),
            }),
            {
                name: 'global-storage',
            }
        )
    )
)
