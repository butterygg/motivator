import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartTrading } from '@/components/assessor/DialogUserData'

// const valueFormatter = function (number: number) {
//     return (
//         new Intl.NumberFormat('us', { maximumSignificantDigits: 2 })
//             .format(number)
//             .toString() + ' ETH'
//     )
// }

export type Props = {
    title: string
    dataset: DataSetChartTrading[]
    type: string
}

export function LineChart({ title, dataset, type }: Props) {
    dataset.sort((a, b) => {
        return (
            new Date(a.date as string).getTime() -
            new Date(b?.date as string).getTime()
        )
    })
    const valueFormatter = function (number: number) {
        if (type === 'ETH')
            return (
                new Intl.NumberFormat('us', { maximumSignificantDigits: 2 })
                    .format(number)
                    .toString() + ' ETH'
            )
        return (
            new Intl.NumberFormat('us', { maximumSignificantDigits: 2 })
                .format(number)
                .toString() + ' DAI'
        )
    }

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
        <div className="border rounded-lg p-3">
            <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {title}
            </h3>
            {/* <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                ${value}
            </p> */}
            <AreaChart
                className="h-80 text-white"
                data={dataset}
                index="date"
                showXAxis={false}
                categories={['Short', 'Long']}
                colors={['red', 'blue']}
                valueFormatter={valueFormatter}
                yAxisWidth={70}
            />
        </div>
    )
}
