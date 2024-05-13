import React from 'react'
import { AreaChart } from '@tremor/react'
import { DataSetChartLP } from '@/components/assessor/DialogUserData'

const valueFormatter = function (number: number) {
    return '$ ' + new Intl.NumberFormat('us').format(number).toString()
}

export type Props = {
    title: string
    dataset: DataSetChartLP[]
}

export function LP_PNLChart({ title, dataset }: Props) {
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
                    categories={['LP']}
                    colors={['red']}
                    valueFormatter={valueFormatter}
                    yAxisWidth={70}
                />
            ) : null}
        </div>
    )
}
