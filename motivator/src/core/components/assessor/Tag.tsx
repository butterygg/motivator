import React from 'react'
import { OffChainActions } from '@/types/enum/status'

type Props = {
    value: OffChainActions
}

export const Tag = ({ value }: Props) => {
    switch (value) {
        case OffChainActions.CommunityEngagement:
            return (
                <div className="bg-green-200 text-green-800 rounded-full px-2 py-1 text-xs ">
                    Community
                </div>
            )
        case OffChainActions.Feedback:
            return (
                <div className="bg-red-200 text-red-800 rounded-full px-2 py-1 text-xs">
                    Feedback
                </div>
            )
        case OffChainActions.WriteUP:
            return (
                <div className="bg-yellow-200 text-yellow-800 rounded-full px-2 py-1 text-xs">
                    Writer
                </div>
            )
        case OffChainActions.isBot:
            return (
                <div className="bg-pink-200 text-pink-800 rounded-full px-2 py-1 text-xs">
                    Bot
                </div>
            )
    }
}
