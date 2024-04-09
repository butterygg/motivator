'use client'
import { Button } from '@/components/ui/button'

import {
    Dialog,
    DialogContent,
    DialogContentCustom,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/types/data/user'
import AddrAvatar from '../globals/AddrAvatar'
import { DataCard } from './DataCard'
import EthLogo from '~/ethereum-eth-logo.svg'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useAddRewardUsers } from '../../hooks/reward/useAddRewardUsers'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { PNLChart } from '../statistics/PNLChart'
import { Separator } from '../ui/separator'
import { VolumeChart } from '../statistics/VolumeChart'
import { useGetPNLAndVolume } from '../../hooks/statistics/useGetPNLAndVolume'
import { LP_PNLChart } from '../statistics/LP_PNLChart'
import { LP_VolumeChart } from '../statistics/LP_VolumeChart '
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
    const { data } = useGetPNLAndVolume({ userAddr: user.addressName })
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
        if (data) {
            preparePNLTradingData()
            prepareVolumeTradingData()
            preparePNLLPData()
            prepareVolumeLPData()
        }
    }, [data])

    const preparePNLTradingData = () => {
        if (!data || !data.stats) return
        const result: DataSetChartTrading[] = data.stats.map((element) => {
            return {
                date: element.timestamp,
                Short: element.pnl_short,
                Long: element.pnl_long,
            }
        })
        setPNLTradingData(result)
    }

    const prepareVolumeTradingData = () => {
        if (!data || !data.stats) return
        const result: DataSetChartTrading[] = data.stats.map((element) => {
            return {
                date: element.timestamp,
                Short: element.volume_short,
                Long: element.volume_long,
            }
        })
        setVolumeTradingData(result)
    }

    const preparePNLLPData = () => {
        if (!data || !data.stats) return
        const result: DataSetChartPnlLP[] = data.stats.map((element) => {
            return {
                date: element.timestamp,
                pnl: element.pnl_lp,
            }
        })
        setLP_PNLTradingData(result)
    }

    const prepareVolumeLPData = () => {
        if (!data || !data.stats) return
        const result: DataSetChartVolumeLP[] = data.stats.map((element) => {
            return {
                date: element.timestamp,
                volume: element.volume_lp,
            }
        })
        setLP_VolumeTradingData(result)
    }

    // TODO: prepare Data for PNL and Volume
    // const prepareDataForPNLLP = () => {
    //     const pnlLongs = data?.result?.pnlLongs
    //     return data
    //         ? {
    //               pnlLong: data.result?.pnlLongs,
    //               pnlShorts: data.result?.pnlShorts,
    //               volumeLong: data.result?.volumeLong,
    //               volumeShort: data.result?.volumeShort,
    //               lpVolume: data.result?.lpVolume,
    //               dates: data.result?.dates,
    //           }
    //         : {
    //               pnlLong: [],
    //               pnlShorts: [],
    //               volumeLong: [],
    //               volumeShort: [],
    //               lpVolume: [],
    //               dates: [],
    //           }
    // }
    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button className="rounded-full" variant="outline">
                                ?
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
                    <DialogDescription>Historical data</DialogDescription>
                </DialogHeader>
                <Label htmlFor="name" className="">
                    Statistics
                </Label>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-3 items-center gap-2">
                        <DataCard
                            title="Volume"
                            value={user.stat.volume ? user.stat.volume : 0}
                            icon={<EthLogo className="h-4 w-4" />}
                        />
                        <DataCard title="Pnl" value={user.pnl + 'K$'} />
                        <DataCard
                            title="Actions"
                            value={user.stat.actions ? user.stat.actions : 0}
                        />
                    </div>
                </div>
                <>
                    <div className="p-5 ">
                        <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                            Trading
                        </Label>
                        <div className="grid gap-2 lg:grid-flow-col p-2">
                            <PNLChart
                                title={'PNL'}
                                value={'25000'}
                                dataset={PNLTradingData ? PNLTradingData : []}
                            />
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
                            <LP_PNLChart
                                title={'PNL'}
                                value={'25000'}
                                dataset={
                                    LP_PNLTradingData ? LP_PNLTradingData : []
                                }
                            />
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

                {/* <DialogFooter className="flex-row justify-between w-full">
                    <div className="align-top flex gap-2 w-fit">
                        <Input
                            placeholder="Points"
                            type="number"
                            className="w-32 appearance-none"
                            min={0}
                            onChange={handleOnChangeInput}
                            value={points}
                        />
                        <Button onClick={() => handleSubmit()}>Reward</Button>
                    </div>
                </DialogFooter> */}
            </DialogContentCustom>
        </Dialog>
    )
}
