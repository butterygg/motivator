'use client'
import { Card } from '@/components/ui/card'
import React, { useState } from 'react'
import { transformNumberK } from '@/utils/utils'
import { DataCard } from '@/components/assessor/DataCard'
import { WeekSelector } from '@/components/globals/WeekSelector'
import { Label } from '@/components/ui/label'
import EthLogo from '~/ethereum-eth-logo.svg'
import DaiLogo from '~/dai.svg'
import { Tag } from '@/components/assessor/Tag'
import { useGetOffChainActions } from '@/hooks/offChainActions/useGetOffChainActions'
import { OffChainActions } from '@/types/enum/status'
import { User } from '@/types/data/user'
import { useGetTotalsForUserAndWeek } from '../../hooks/statistics/useGetTotalsForUserAndWeek'
type Props = {
    user: User
}

const Statistics = ({ user }: Props) => {
    const [weekSelected, setWeekSelected] = useState(
        Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)
    )

    const {} = useGetTotalsForUserAndWeek({
        userAddr: user.addressName,
        weekNumber: weekSelected,
    })

    const { data: dataOffChainActions } = useGetOffChainActions({
        user_address: user.addressName,
    })

    const buildTags = () => {
        if (!dataOffChainActions?.res) return null
        const comEngagement = dataOffChainActions?.res?.communityEngagement
            ? Tag({ value: OffChainActions.CommunityEngagement })
            : null
        const feedback = dataOffChainActions?.res?.feedback
            ? Tag({ value: OffChainActions.Feedback })
            : null
        const writeUp = dataOffChainActions?.res?.strategyWriteUp
            ? Tag({ value: OffChainActions.WriteUP })
            : null
        const isBot = dataOffChainActions?.res?.isBot
            ? Tag({ value: OffChainActions.isBot })
            : null
        if (!comEngagement && !feedback && !writeUp && !isBot) return null
        return (
            <div>
                <Label htmlFor="name" className="">
                    Badges
                </Label>
                <div className="flex gap-3">
                    {comEngagement}
                    {feedback}
                    {writeUp}
                    {isBot}
                </div>
            </div>
        )
        // return result
    }
    return (
        <div className="flex flex-col items-center lg:flex-row justify-between gap-4 p-4">
            <div>
                <div className="flex gap-2 justify-between items-center p-3">
                    <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                        Statistics
                    </Label>
                    <WeekSelector
                        weekSelected={weekSelected}
                        setWeekSelected={setWeekSelected}
                    />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                    <DataCard
                        title="Volume Pool Dai"
                        value={
                            user.stat.totals.totalVolumePoolDai
                                ? transformNumberK(
                                      Number(
                                          user.stat.totals.totalVolumePoolDai
                                      )
                                  )
                                : 0
                        }
                        icon={<DaiLogo className="h-4 w-4" />}
                    />
                    <DataCard
                        title="Volume Pool ETH"
                        value={
                            user.stat.totals.totalVolumePoolEth
                                ? transformNumberK(
                                      Number(
                                          user.stat.totals.totalVolumePoolEth
                                      )
                                  )
                                : 0
                        }
                        icon={<EthLogo className="h-4 w-4" />}
                    />
                    {/* <DataCard
                title="Pnl"
                value={Number(user.stat.totals.totalPnl) + 'K$'}
            /> */}
                    <DataCard
                        title="Actions"
                        value={
                            user.stat.totals.totalActions
                                ? Number(user.stat.totals.totalActions)
                                : 0
                        }
                    />
                </div>
            </div>
            <Card className="items-center gap-2">{buildTags()}</Card>
        </div>
    )
}

export default Statistics
