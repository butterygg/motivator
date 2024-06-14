import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartLP } from '@/components/assessor/DialogUserData'
import { cn } from '../../../../core/utils/utils'

export type Props = {
    title: string
    dataset: DataSetChartLP[]
    type: string
}

export function LP_LineChart({ title, dataset, type }: Props) {
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
    return (
        <div className="border rounded-lg p-3">
            <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {title}
            </h3>

            {dataset.length > 0 ? (
                <AreaChart
                    className="h-80 text-white"
                    data={dataset}
                    index="date"
                    showXAxis={false}
                    categories={['LP']}
                    colors={['red']}
                    valueFormatter={valueFormatter}
                    yAxisWidth={70}
                    customTooltip={customTooltip}
                />
            ) : null}
        </div>
    )
}
