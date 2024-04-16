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
            Pnl: 2890,
        },
        {
            date: 'Feb 22',
            Pnl: 2756,
        },
        {
            date: 'Mar 22',
            Pnl: 3322,
        },
        {
            date: 'Apr 22',
            Pnl: 3470,
        },
        {
            date: 'May 22',
            Pnl: 3475,
        },
        {
            date: 'Jun 22',
            Pnl: 3129,
        },
        {
            date: 'Jul 22',
            Pnl: 3490,
        },
        {
            date: 'Aug 22',
            Pnl: 2903,
        },
        {
            date: 'Sep 22',
            Pnl: 2643,
        },
        {
            date: 'Oct 22',
            Pnl: 2837,
        },
        {
            date: 'Nov 22',
            Pnl: 2954,
        },
        {
            date: 'Dec 22',
            Pnl: 3239,
        },
    ]
    console.log('dataset', dataset)
    return (
        <div className="border rounded-lg p-5">
            {/* <h3 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content"> */}
            <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {title}
            </h3>
            {/* <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                ${value}
            </p> */}

            {dataset.length > 0 ? (
                <AreaChart
                    className="h-80 rounded-lg"
                    data={dataset}
                    index="date"
                    categories={['pnl']}
                    colors={['red']}
                    valueFormatter={valueFormatter}
                    yAxisWidth={70}
                />
            ) : null}
        </div>
    )
}
