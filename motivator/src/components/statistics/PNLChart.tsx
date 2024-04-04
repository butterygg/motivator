import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartTrading } from '@/components/assessor/DialogUserData'

const valueFormatter = function (number: number) {
    return '$ ' + new Intl.NumberFormat('us').format(number).toString()
}

export type Props = {
    title: string
    value: string
    dataset: DataSetChartTrading[]
}

export function PNLChart({ title, value, dataset }: Props) {
    return (
        <div className="border rounded-lg p-5">
            <h3 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                {title}
            </h3>
            <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                ${value}
            </p>
            <AreaChart
                className="h-80"
                data={dataset}
                index="date"
                categories={['Short', 'Long']}
                colors={['red', 'blue']}
                valueFormatter={valueFormatter}
                yAxisWidth={70}
                onValueChange={(v) => console.log(v)}
            />
        </div>
    )
}
