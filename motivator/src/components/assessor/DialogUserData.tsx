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
    const [VolumeTradingDataPoolEth, setVolumeTradingDataPoolEth] = useState<
        DataSetChartTrading[]
    >([])

    const [VolumeTradingDataPoolDai, setVolumeTradingDataPoolDai] = useState<
        DataSetChartTrading[]
    >([])

    const [LP_PNLTradingData, setLP_PNLTradingData] = useState<
        DataSetChartPnlLP[]
    >([])

    const [LP_VolumeTradingDataPoolEth, setLP_VolumeTradingDataPoolEth] =
        useState<DataSetChartVolumeLP[]>([])
    const [LP_VolumeTradingDataPoolDai, setLP_VolumeTradingDataPoolDai] =
        useState<DataSetChartVolumeLP[]>([])

    const [weekSelected, setWeekSelected] = useState(
        `Week ${Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)}`
    )

    useEffect(() => {
        if (user.stat.stats) {
            // preparePNLTradingData()
            prepareVolumeTradingData('stETH')
            prepareVolumeTradingData('DAI')
            // preparePNLLPData()
            prepareVolumeLPData('stETH')
            prepareVolumeLPData('DAI')
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

    const prepareVolumeTradingData = (pooltype: string) => {
        if (!user || !user.stat.stats) return
        if (pooltype === 'stETH') {
            const result: DataSetChartTrading[] =
                user.stat.stats.statsPoolETH.map((element) => {
                    return {
                        date: element.timestamp,
                        Short: element.volume_shorts,
                        Long: element.volume_longs,
                    }
                })
            setVolumeTradingDataPoolEth(result)
        } else {
            const result: DataSetChartTrading[] =
                user.stat.stats.statsPoolDAI.map((element) => {
                    return {
                        date: element.timestamp,
                        Short: element.volume_shorts,
                        Long: element.volume_longs,
                    }
                })
            setVolumeTradingDataPoolDai(result)
        }
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

    const prepareVolumeLPData = (pooltype: string) => {
        if (!user || !user.stat.stats) return

        if (pooltype === 'stETH') {
            const result: DataSetChartVolumeLP[] =
                user.stat.stats.statsPoolETH.map((element) => {
                    return {
                        date: element.timestamp,
                        volume: element.volume_lps,
                    }
                })
            setLP_VolumeTradingDataPoolEth(result)
        } else {
            const result: DataSetChartVolumeLP[] =
                user.stat.stats.statsPoolDAI.map((element) => {
                    return {
                        date: element.timestamp,
                        volume: element.volume_lps,
                    }
                })
            setLP_VolumeTradingDataPoolDai(result)
        }
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
                <>
                    {(VolumeTradingDataPoolEth.length > 0 ||
                        LP_VolumeTradingDataPoolEth.length > 0) && (
                        <div className="p-5 w-full">
                            <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                                Volume - ETH Pool
                            </Label>
                            <div className="grid gap-2 lg:grid-flow-col p-2">
                                {/* <PNLChart
                                title={'PNL'}
                                value={'25000'}
                                dataset={PNLTradingData ? PNLTradingData : []}
                            /> */}

                                {VolumeTradingDataPoolEth.length > 0 && (
                                    <VolumeChart
                                        title={'Trading'}
                                        dataset={
                                            VolumeTradingDataPoolEth
                                                ? VolumeTradingDataPoolEth
                                                : []
                                        }
                                    />
                                )}
                                {LP_VolumeTradingDataPoolEth.length > 0 && (
                                    <LP_VolumeChart
                                        title={'Liquidity Provision'}
                                        dataset={
                                            LP_VolumeTradingDataPoolEth
                                                ? LP_VolumeTradingDataPoolEth
                                                : []
                                        }
                                    />
                                )}

                                {/* <PNLChart title={'Volume'} value={'25000'} /> */}
                            </div>
                        </div>
                    )}
                    {(VolumeTradingDataPoolDai.length > 0 ||
                        LP_VolumeTradingDataPoolDai.length > 0) && (
                        <div className="p-5 mt-3 w-full">
                            <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                                Volume - Dai Pool
                            </Label>
                            <div className="grid gap-2 lg:grid-flow-col p-2">
                                {VolumeTradingDataPoolDai.length > 0 && (
                                    <VolumeChart
                                        title={'Trading'}
                                        dataset={
                                            VolumeTradingDataPoolDai
                                                ? VolumeTradingDataPoolDai
                                                : []
                                        }
                                    />
                                )}
                                {LP_VolumeTradingDataPoolDai.length > 0 && (
                                    <LP_VolumeChart
                                        title={'Liquidity Provision'}
                                        dataset={
                                            LP_VolumeTradingDataPoolDai
                                                ? LP_VolumeTradingDataPoolDai
                                                : []
                                        }
                                    />
                                )}
                                {/* <PNLChart title={'Volume'} value={'25000'} /> */}
                            </div>
                        </div>
                    )}
                </>
            </DialogContentCustom>
        </Dialog>
    )
}
