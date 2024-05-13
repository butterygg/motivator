import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartTrading } from '@/components/assessor/DialogUserData'

const valueFormatter = function (number: number) {
    return (
        '$ ' +
        new Intl.NumberFormat('us', { maximumSignificantDigits: 2 })
            .format(number)
            .toString()
    )
}

export type Props = {
    title: string
    dataset: DataSetChartTrading[]
}

export function PNLChart({ title, dataset }: Props) {
    const chartdata = [
        {
            date: 'Jan 22',
            Short: 2890,
            Long: 2338,
        },
        {
            date: 'Feb 22',
            Short: 2756,
            Long: 2103,
        },
        {
            date: 'Mar 22',
            Short: 3322,
            Long: 2194,
        },
        {
            date: 'Apr 22',
            Short: 3470,
            Long: 2108,
        },
        {
            date: 'May 22',
            Short: 3475,
            Long: 1812,
        },
        {
            date: 'Jun 22',
            Short: 3129,
            Long: 1726,
        },
        {
            date: 'Jul 22',
            Short: 3490,
            Long: 1982,
        },
        {
            date: 'Aug 22',
            Short: 2903,
            Long: 2012,
        },
        {
            date: 'Sep 22',
            Short: 2643,
            Long: 2342,
        },
        {
            date: 'Oct 22',
            Short: 2837,
            Long: 2473,
        },
        {
            date: 'Nov 22',
            Short: 2954,
            Long: 3848,
        },
        {
            date: 'Dec 22',
            Short: 3239,
            Long: 3736,
        },
    ]
    return (
        <div className="border rounded-lg p-5">
            <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {title}
            </h3>
            {/* <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                ${value}
            </p> */}
            <AreaChart
                className="h-80"
                data={dataset}
                index="date"
                categories={['Short', 'Long']}
                colors={['red', 'blue']}
                valueFormatter={valueFormatter}
                yAxisWidth={70}
            />
        </div>
    )
}
