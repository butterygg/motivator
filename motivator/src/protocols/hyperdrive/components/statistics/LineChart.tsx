import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartTrading } from '@protocols/hyperdrive/components/assessor/DialogUserData'
import { cn } from '@/utils/utils'

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
    dataset
        .sort((a, b) => {
            return (
                new Date(a.date as string).getTime() -
                new Date(b?.date as string).getTime()
            )
        })
        .map((data) => {
            data.date = new Date(data.date as string).toLocaleDateString()
            return data
        })
    const valueFormatter = function (number: number) {
        return (
            new Intl.NumberFormat('us', { maximumSignificantDigits: 2 })
                .format(number)
                .toString() + ` ${type}`
        )
    }

    const customTooltip = (props: {
        active: any
        payload: any
        label: any
    }) => {
        const { active, payload, label } = props
        return (
            <div className="w-fit rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown">
                <p className="items-center w-full justify-center text-tremor-content-strong">
                    {label}
                </p>
                {payload.map(
                    (
                        category: {
                            color: any
                            dataKey:
                                | string
                                | number
                                | boolean
                                | React.ReactElement<
                                      any,
                                      string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | React.ReactPortal
                                | Promise<React.AwaitedReactNode>
                                | null
                                | undefined
                            value:
                                | string
                                | number
                                | boolean
                                | React.ReactElement<
                                      any,
                                      string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | React.ReactPortal
                                | Promise<React.AwaitedReactNode>
                                | null
                                | undefined
                        },
                        idx: React.Key | null | undefined
                    ) => (
                        <div key={idx} className="flex flex-1 space-x-2.5">
                            <div
                                className={cn(
                                    `flex w-1 flex-col rounded`,
                                    `bg-${category.color}-500`
                                )}
                            />
                            <div className="flex gap-2 items-center">
                                <p className="text-tremor-content">
                                    {category.dataKey}
                                </p>
                                <p className="font-medium text-tremor-content-emphasis">
                                    {new Intl.NumberFormat('us', {
                                        maximumSignificantDigits: 2,
                                    })
                                        .format(category.value as number)
                                        .toString()}{' '}
                                    {` ${type}`}
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>
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
        <div className="border  rounded-lg p-3">
            <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {title}
            </h3>

            <AreaChart
                className="h-80 dark:text-dark-tremor-content-strong"
                data={dataset}
                index="date"
                showXAxis={false}
                categories={['Short', 'Long']}
                colors={['red', 'blue']}
                valueFormatter={valueFormatter}
                customTooltip={customTooltip}
                yAxisWidth={70}
            />
        </div>
    )
}
