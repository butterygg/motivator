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
import { WeekSelector } from '../globals/WeekSelector'
import Statistics from '../statistics/Statistics'
import { LP_LineChart } from '../statistics/LP_LineChart'
import { LineChart } from '../statistics/LineChart'
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

export type DataSetChartLP = {
    date: string | null
    LP: number | null
}

export function DialogUserData({ user }: Props) {
    const { data: dataOffChainActions } = useGetOffChainActions({
        user_address: user.addressName,
    })
    const [PNLTradingDataPoolEth, setPNLTradingDataPoolEth] = useState<
        DataSetChartTrading[]
    >([])
    const [PNLTradingDataPoolDai, setPNLTradingDataPoolDai] = useState<
        DataSetChartTrading[]
    >([])

    const [LP_PNLTradingDataPoolEth, setLP_PNLTradingDataPoolEth] = useState<
        DataSetChartLP[]
    >([])

    const [LP_PNLTradingDataPoolDai, setLP_PNLTradingDataPoolDai] = useState<
        DataSetChartLP[]
    >([])

    const [TVLTradingDataPoolEth, setTVLTradingDataPoolEth] = useState<
        DataSetChartTrading[]
    >([])
    const [TVLTradingDataPoolDai, setTVLTradingDataPoolDai] = useState<
        DataSetChartTrading[]
    >([])

    const [LP_TVLTradingDataPoolEth, setLP_TVLTradingDataPoolEth] = useState<
        DataSetChartLP[]
    >([])

    const [LP_TVLTradingDataPoolDai, setLP_TVLTradingDataPoolDai] = useState<
        DataSetChartLP[]
    >([])

    const [weekSelected, setWeekSelected] = useState(
        `Week ${Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)}`
    )

    useEffect(() => {
        if (user.stat.stats) {
            preparePNLTradingData()
            preparePnlLpsData()
            prepareTVLTradingData()
            prepareTVLLpsData()
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
    }

    const preparePNLTradingData = () => {
        if (!user || !user.stat.stats) return
        const resultPoolEth: DataSetChartTrading[] =
            user.stat.stats.statsPoolETH.map((element) => {
                return {
                    date: element.timestamp,
                    Short: element.pnl_shorts,
                    Long: element.pnl_longs,
                }
            })
        setPNLTradingDataPoolEth(resultPoolEth)

        const resultPoolDai: DataSetChartTrading[] =
            user.stat.stats.statsPoolDAI.map((element) => {
                return {
                    date: element.timestamp,
                    Short: element.pnl_shorts,
                    Long: element.pnl_longs,
                }
            })
        setPNLTradingDataPoolDai(resultPoolDai)
    }

    const preparePnlLpsData = () => {
        if (!user || !user.stat.stats) return
        const resultETH: DataSetChartLP[] = user.stat.stats.statsPoolETH.map(
            (element) => {
                return {
                    date: element.timestamp,
                    LP: element.pnl_lps,
                }
            }
        )
        setLP_PNLTradingDataPoolEth(resultETH)
        const resultDai: DataSetChartLP[] = user.stat.stats.statsPoolDAI.map(
            (element) => {
                return {
                    date: element.timestamp,
                    LP: element.pnl_lps,
                }
            }
        )
        setLP_PNLTradingDataPoolDai(resultDai)
    }

    const prepareTVLTradingData = () => {
        if (!user || !user.stat.stats) return
        const resultPoolEth: DataSetChartTrading[] =
            user.stat.stats.statsPoolETH.map((element) => {
                return {
                    date: element.timestamp,
                    Short: element.tvl_shorts,
                    Long: element.tvl_longs,
                }
            })
        setTVLTradingDataPoolEth(resultPoolEth)

        const resultPoolDai: DataSetChartTrading[] =
            user.stat.stats.statsPoolDAI.map((element) => {
                return {
                    date: element.timestamp,
                    Short: element.tvl_shorts,
                    Long: element.tvl_longs,
                }
            })
        setTVLTradingDataPoolDai(resultPoolDai)
    }

    const prepareTVLLpsData = () => {
        if (!user || !user.stat.stats) return
        const resultETH: DataSetChartLP[] = user.stat.stats.statsPoolETH.map(
            (element) => {
                return {
                    date: element.timestamp,
                    LP: element.tvl_lps,
                }
            }
        )
        setLP_TVLTradingDataPoolEth(resultETH)
        const resultDai: DataSetChartLP[] = user.stat.stats.statsPoolDAI.map(
            (element) => {
                return {
                    date: element.timestamp,
                    LP: element.tvl_lps,
                }
            }
        )
        setLP_TVLTradingDataPoolDai(resultDai)
    }

    // const prepareVolumeTradingData = (pooltype: string) => {
    //     if (!user || !user.stat.stats) return
    //     if (pooltype === 'stETH') {
    //         const result: DataSetChartTrading[] =
    //             user.stat.stats.statsPoolETH.map((element) => {
    //                 return {
    //                     date: element.timestamp,
    //                     Short: element.volume_shorts,
    //                     Long: element.volume_longs,
    //                 }
    //             })
    //         setVolumeTradingDataPoolEth(result)
    //     } else {
    //         const result: DataSetChartTrading[] =
    //             user.stat.stats.statsPoolDAI.map((element) => {
    //                 return {
    //                     date: element.timestamp,
    //                     Short: element.volume_shorts,
    //                     Long: element.volume_longs,
    //                 }
    //             })
    //         setVolumeTradingDataPoolDai(result)
    //     }
    // }

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

    // const prepareVolumeLPData = (pooltype: string) => {
    //     if (!user || !user.stat.stats) return

    //     if (pooltype === 'stETH') {
    //         const result: DataSetChartVolumeLP[] =
    //             user.stat.stats.statsPoolETH.map((element) => {
    //                 return {
    //                     date: element.timestamp,
    //                     volume: element.volume_lps,
    //                 }
    //             })
    //         setLP_VolumeTradingDataPoolEth(result)
    //     } else {
    //         const result: DataSetChartVolumeLP[] =
    //             user.stat.stats.statsPoolDAI.map((element) => {
    //                 return {
    //                     date: element.timestamp,
    //                     volume: element.volume_lps,
    //                 }
    //             })
    //         setLP_VolumeTradingDataPoolDai(result)
    //     }
    // }
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
            <DialogContentCustom className="w-max-full overflow-auto">
                <DialogHeader className="p-4">
                    <DialogTitle className=" flex justify-between items-center">
                        <AddrAvatar addressName={user.addressName} />
                        <Button>
                            <a
                                target="_blank"
                                rel="noreferrer noopener"
                                href={`https://hyperdrive.blockanalitica.com/wallets/${user.addressName}`}
                            >
                                {' '}
                                Analytics
                            </a>
                        </Button>
                    </DialogTitle>
                    <DialogDescription>Hyperdrive Data</DialogDescription>
                </DialogHeader>
                <Statistics user={user} />
                {(PNLTradingDataPoolEth.length > 0 ||
                    LP_PNLTradingDataPoolEth.length > 0 ||
                    PNLTradingDataPoolDai.length > 0 ||
                    LP_PNLTradingDataPoolDai.length > 0) && (
                    <>
                        <Label className="pt-5 pl-5 flex text-2xl text-tremor-content dark:text-dark-tremor-content">
                            PnL
                        </Label>
                        <div className="border rounded-lg">
                            {(PNLTradingDataPoolEth.length > 0 ||
                                LP_PNLTradingDataPoolEth.length > 0) && (
                                <div className="p-3 w-full">
                                    <Label className="text-lg text-tremor-content dark:text-dark-tremor-content">
                                        ETH Pool
                                    </Label>
                                    <div className="grid gap-2 lg:grid-flow-col p-2">
                                        {PNLTradingDataPoolEth.length > 0 && (
                                            <LineChart
                                                title={'Trading'}
                                                dataset={
                                                    PNLTradingDataPoolEth
                                                        ? PNLTradingDataPoolEth
                                                        : []
                                                }
                                            />
                                        )}
                                        {LP_PNLTradingDataPoolEth.length >
                                            0 && (
                                            <LP_LineChart
                                                title={'Liquidity Provision'}
                                                dataset={
                                                    LP_PNLTradingDataPoolEth
                                                        ? LP_PNLTradingDataPoolEth
                                                        : []
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                            {(PNLTradingDataPoolDai.length > 0 ||
                                LP_PNLTradingDataPoolDai.length > 0) && (
                                <div className="p-3 mt-3 w-full">
                                    <Label className="text-lg text-tremor-content dark:text-dark-tremor-content">
                                        Dai Pool
                                    </Label>
                                    <div className="grid gap-2 lg:grid-flow-col p-2">
                                        {PNLTradingDataPoolDai.length > 0 && (
                                            <LineChart
                                                title={'Trading'}
                                                dataset={
                                                    PNLTradingDataPoolDai
                                                        ? PNLTradingDataPoolDai
                                                        : []
                                                }
                                            />
                                        )}
                                        {LP_PNLTradingDataPoolDai.length >
                                            0 && (
                                            <LP_LineChart
                                                title={'Liquidity Provision'}
                                                dataset={
                                                    LP_PNLTradingDataPoolDai
                                                        ? LP_PNLTradingDataPoolDai
                                                        : []
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
                {(TVLTradingDataPoolEth.length > 0 ||
                    LP_TVLTradingDataPoolEth.length > 0 ||
                    TVLTradingDataPoolDai.length > 0 ||
                    LP_TVLTradingDataPoolDai.length > 0) && (
                    <>
                        <Label className="pt-3 pl-3 flex text-2xl text-tremor-content dark:text-dark-tremor-content">
                            TVL
                        </Label>
                        <div className="border rounded-lg">
                            {(TVLTradingDataPoolEth.length > 0 ||
                                LP_TVLTradingDataPoolEth.length > 0) && (
                                <div className="p-3 w-full">
                                    <Label className="text-lg text-tremor-content dark:text-dark-tremor-content">
                                        ETH Pool
                                    </Label>
                                    <div className="grid gap-2 lg:grid-flow-col p-2">
                                        {TVLTradingDataPoolEth.length > 0 && (
                                            <LineChart
                                                title={'Trading'}
                                                dataset={
                                                    TVLTradingDataPoolEth
                                                        ? TVLTradingDataPoolEth
                                                        : []
                                                }
                                            />
                                        )}
                                        {LP_TVLTradingDataPoolEth.length >
                                            0 && (
                                            <LP_LineChart
                                                title={'Liquidity Provision'}
                                                dataset={
                                                    LP_TVLTradingDataPoolEth
                                                        ? LP_TVLTradingDataPoolEth
                                                        : []
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                            {(TVLTradingDataPoolDai.length > 0 ||
                                LP_TVLTradingDataPoolDai.length > 0) && (
                                <div className="p-3 mt-3 w-full">
                                    <Label className="text-lg text-tremor-content dark:text-dark-tremor-content">
                                        Dai Pool
                                    </Label>
                                    <div className="grid gap-2 lg:grid-flow-col p-2">
                                        {TVLTradingDataPoolDai.length > 0 && (
                                            <LineChart
                                                title={'Trading'}
                                                dataset={
                                                    TVLTradingDataPoolDai
                                                        ? TVLTradingDataPoolDai
                                                        : []
                                                }
                                            />
                                        )}
                                        {LP_TVLTradingDataPoolDai.length >
                                            0 && (
                                            <LP_LineChart
                                                title={'Liquidity Provision'}
                                                dataset={
                                                    LP_TVLTradingDataPoolDai
                                                        ? LP_TVLTradingDataPoolDai
                                                        : []
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DialogContentCustom>
        </Dialog>
    )
}
