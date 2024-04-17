/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { Button } from '@/components/ui/button'

import {
    Dialog,
    DialogContentCustom,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { User } from '@/types/data/user'
import AddrAvatar from '../globals/AddrAvatar'
import { DataCard } from './DataCard'
import EthLogo from '~/ethereum-eth-logo.svg'
import DaiLogo from '~/dai.svg'
import { useEffect, useState } from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { VolumeChart } from '../statistics/VolumeChart'
import { LP_VolumeChart } from '../statistics/LP_VolumeChart '
import { useGetOffChainActions } from '../../hooks/offChainActions/useGetOffChainActions'
import { Tag } from './Tag'
import { OffChainActions } from '../../types/enum/status'
import { Card } from '../ui/card'
import { transformNumberK } from '../../utils/utils'
type Props = {
    user: User
}

export type DataSetChartTrading = {
    date: string | null
    Short: number | null
    Long: number | null
}

export type DataSetChartVolumeLP = {
    date: string | null
    volume: number | null
}

export type DataSetChartPnlLP = {
    date: string | null
    pnl: number | null
}

export function DialogUserData({ user }: Props) {
    // const { data: dataPNLAndVolume } = useGetPNLAndVolume({
    //     userAddr: user.addressName,
    // })
    const { data: dataOffChainActions } = useGetOffChainActions({
        user_address: user.addressName,
    })
    const [PNLTradingData, setPNLTradingData] = useState<DataSetChartTrading[]>(
        []
    )
    const [VolumeTradingData, setVolumeTradingData] = useState<
        DataSetChartTrading[]
    >([])

    const [LP_PNLTradingData, setLP_PNLTradingData] = useState<
        DataSetChartPnlLP[]
    >([])

    const [LP_VolumeTradingData, setLP_VolumeTradingData] = useState<
        DataSetChartVolumeLP[]
    >([])

    useEffect(() => {
        if (user.stat.stats) {
            // preparePNLTradingData()
            prepareVolumeTradingData()
            // preparePNLLPData()
            prepareVolumeLPData()
        }
    }, [user.stat.stats])

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

    // const preparePNLTradingData = () => {
    //     if (!user || !user.stat.stats) return
    //     const result: DataSetChartTrading[] = user.stat.stats.map((element) => {
    //         return {
    //             date: element.timestamp,
    //             Short: element.pnl_shorts,
    //             Long: element.pnl_longs,
    //         }
    //     })
    //     setPNLTradingData(result)
    // }

    const prepareVolumeTradingData = () => {
        if (!user || !user.stat.stats) return
        const result: DataSetChartTrading[] = user.stat.stats.map((element) => {
            return {
                date: element.timestamp,
                Short: element.volume_shorts,
                Long: element.volume_longs,
            }
        })
        setVolumeTradingData(result)
    }

    // const preparePNLLPData = () => {
    //     if (!user || !user.stat.stats) return
    //     const result: DataSetChartPnlLP[] = user.stat.stats.map((element) => {
    //         return {
    //             date: element.timestamp,
    //             pnl: element.pnl_lps,
    //         }
    //     })
    //     setLP_PNLTradingData(result)
    // }

    const prepareVolumeLPData = () => {
        if (!user || !user.stat.stats) return

        const result: DataSetChartVolumeLP[] = user.stat.stats.map(
            (element) => {
                return {
                    date: element.timestamp,
                    volume: element.volume_lps,
                }
            }
        )
        setLP_VolumeTradingData(result)
    }
    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button className="rounded-full" variant="outline">
                                Statistics
                            </Button>
                        </TooltipTrigger>
                    </DialogTrigger>
                    <TooltipContent>
                        <p>Details about the user</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            {/* <DialogContent className="sm:max-w-[625px] sm:w-fit overflow-auto"> */}
            <DialogContentCustom className="w-full overflow-auto">
                <DialogHeader>
                    <DialogTitle>
                        <AddrAvatar addressName={user.addressName} />
                    </DialogTitle>
                    <DialogDescription>Hyperdrive Data</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center lg:flex-row justify-between gap-4 py-2">
                    <div>
                        <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                            Statistics
                        </Label>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <DataCard
                                title="Volume Pool Dai"
                                value={
                                    user.stat.totals.totalVolumePoolDai
                                        ? transformNumberK(
                                              Number(
                                                  user.stat.totals
                                                      .totalVolumePoolDai
                                              )
                                          )
                                        : 0
                                }
                                icon={<DaiLogo className="h-4 w-4" />}
                            />
                            <DataCard
                                title="Volume Pool ETH"
                                value={
                                    user.stat.totals.totalVolumePoolETH
                                        ? transformNumberK(
                                              Number(
                                                  user.stat.totals
                                                      .totalVolumePoolETH
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
                <>
                    <div className="p-5 ">
                        <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                            Trading
                        </Label>
                        <div className="grid gap-2 lg:grid-flow-col p-2">
                            {/* <PNLChart
                                title={'PNL'}
                                value={'25000'}
                                dataset={PNLTradingData ? PNLTradingData : []}
                            /> */}
                            <VolumeChart
                                title={'Volume'}
                                value={'25000'}
                                dataset={
                                    VolumeTradingData ? VolumeTradingData : []
                                }
                            />
                            {/* <PNLChart title={'Volume'} value={'25000'} /> */}
                        </div>
                    </div>
                    <div className="p-5 mt-3 ">
                        <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                            Liquidity Providing
                        </Label>
                        <div className="grid gap-2 lg:grid-flow-col p-2">
                            {/* <LP_PNLChart
                                title={'PNL'}
                                value={'25000'}
                                dataset={
                                    LP_PNLTradingData ? LP_PNLTradingData : []
                                }
                            /> */}
                            <LP_VolumeChart
                                title={'Volume'}
                                value={'25000'}
                                dataset={
                                    LP_VolumeTradingData
                                        ? LP_VolumeTradingData
                                        : []
                                }
                            />
                            {/* <PNLChart title={'Volume'} value={'25000'} /> */}
                        </div>
                    </div>
                </>
            </DialogContentCustom>
        </Dialog>
    )
}
