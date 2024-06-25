'use client'
import { Card } from '@/components/ui/card'
import React, { useEffect, useState } from 'react'
import { transformNumberK } from '@/utils/utils'
import { DataCard } from '@/components/assessor/DataCard'
import { WeekSelector } from '@protocols/hyperdrive/components/globals/WeekSelector'
import { Label } from '@/components/ui/label'
import EthLogo from '~/ethereum-eth-logo.svg'
import DaiLogo from '~/dai.svg'
import { Tag } from '@protocols/hyperdrive/components/assessor/Tag'
import { useGetOffChainActions } from '@protocols/hyperdrive/hooks/offChainActions/useGetOffChainActions'
import { OffChainActions } from '@protocols/hyperdrive/types/enums/status'
import { User } from '@protocols/hyperdrive/types/data/user'
import { useGetTotalsForUserAndWeek } from '@protocols/hyperdrive/hooks/statistics/useGetTotalsForUserAndWeek'
import { useGetWeekTotalsAvailableForUser } from '@/hooks/global/useGetWeekTotalsAvailableForUser'
type Props = {
    user: User
}

type DataTotals = {
    id: string
    week: number | null
    user_address: string | null
    totalActions: number | null
    totalVolumePoolEth: number | null
    totalVolumePoolDai: number | null
}

const Statistics = ({ user }: Props) => {
    const [weekSelected, setWeekSelected] = useState(
        Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)
    )

    const {
        data: dataWeekAvailableSelector,
        status: statusGetTotalsWeekAvailableSelector,
    } = useGetWeekTotalsAvailableForUser(user.addressName)

    // This State contain the last data fetched from the server or given by the parent component
    const [userFreshData, setUserFreshData] = useState<DataTotals>({
        id: user.id,
        week: user.stat.totals.week,
        user_address: user.addressName,
        totalActions: user.stat.totals.totalActions,
        totalVolumePoolEth: user.stat.totals.totalVolumePoolEth,
        totalVolumePoolDai: user.stat.totals.totalVolumePoolDai,
    })

    const { data: dataTotals, refetch: refetchTotals } =
        useGetTotalsForUserAndWeek({
            userAddr: user.addressName,
            weekNumber: weekSelected,
        })

    const { data: dataOffChainActions } = useGetOffChainActions({
        user_address: user.addressName,
    })

    useEffect(() => {
        if (dataTotals) {
            setUserFreshData({
                id: user.id,
                week: dataTotals.week,
                user_address: user.addressName,
                totalActions: dataTotals.totalActions,
                totalVolumePoolEth: dataTotals.totalVolumePoolEth,
                totalVolumePoolDai: dataTotals.totalVolumePoolDai,
            })
        }
    }, [dataTotals])

    useEffect(() => {
        if (refetchTotals) refetchTotals()
    }, [refetchTotals, weekSelected])

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
                    {statusGetTotalsWeekAvailableSelector === 'success' &&
                        dataWeekAvailableSelector?.length > 0 && (
                            <WeekSelector
                                weekSelected={weekSelected}
                                setWeekSelected={setWeekSelected}
                                weekAvailableForSelector={
                                    dataWeekAvailableSelector
                                        ? dataWeekAvailableSelector
                                        : []
                                }
                            />
                        )}
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                    <DataCard
                        title="Volume Pool Dai"
                        value={
                            userFreshData.totalVolumePoolDai
                                ? transformNumberK(
                                      Number(userFreshData.totalVolumePoolDai)
                                  )
                                : 0
                        }
                        icon={<DaiLogo className="h-4 w-4" />}
                    />
                    <DataCard
                        title="Volume Pool ETH"
                        value={
                            userFreshData.totalVolumePoolEth
                                ? transformNumberK(
                                      Number(userFreshData.totalVolumePoolEth)
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
                            userFreshData.totalActions
                                ? Number(userFreshData.totalActions)
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
