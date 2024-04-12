import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartPnlLP } from '@/components/assessor/DialogUserData'

const valueFormatter = function (number: number) {
    return '$ ' + new Intl.NumberFormat('us').format(number).toString()
}

export type Props = {
    title: string
    value: string
    dataset: DataSetChartPnlLP[]
}

export function LP_PNLChart({ title, value, dataset }: Props) {
    const chartdata = [
        {
            date: 'Jan 22',
            pnl: 2890,
        },
        {
            date: 'Feb 22',
            pnl: 2756,
        },
        {
            date: 'Mar 22',
            pnl: 3322,
        },
        {
            date: 'Apr 22',
            pnl: 3470,
        },
        {
            date: 'May 22',
            pnl: 3475,
        },
        {
            date: 'Jun 22',
            pnl: 3129,
        },
        {
            date: 'Jul 22',
            pnl: 3490,
        },
        {
            date: 'Aug 22',
            pnl: 2903,
        },
        {
            date: 'Sep 22',
            pnl: 2643,
        },
        {
            date: 'Oct 22',
            pnl: 2837,
        },
        {
            date: 'Nov 22',
            pnl: 2954,
        },
        {
            date: 'Dec 22',
            pnl: 3239,
        },
    ]
    return (
        <div className="border rounded-lg p-5">
            <h3 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                {title}
            </h3>
            <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                ${value}
            </p>
            <AreaChart
                className="h-80 rounded-lg"
                data={chartdata}
                index="date"
                categories={['pnl']}
                colors={['red']}
                valueFormatter={valueFormatter}
                yAxisWidth={70}
                onValueChange={(v) => console.log(v)}
            />
        </div>
    )
}
