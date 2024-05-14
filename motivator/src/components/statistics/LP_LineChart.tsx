import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartLP } from '@/components/assessor/DialogUserData'

export type Props = {
    title: string
    dataset: DataSetChartLP[]
    type: string
}

export function LP_LineChart({ title, dataset, type }: Props) {
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
                />
            ) : null}
        </div>
    )
}
