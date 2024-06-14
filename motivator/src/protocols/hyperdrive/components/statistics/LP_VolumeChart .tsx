import { BarChart } from '@tremor/react'
import { DataSetChartVolumeLP } from '@protocols/hyperdrive/components/assessor/DialogUserData'
import { transformNumberK } from '../../../../core/utils/utils'

export type Props = {
    title: string
    dataset: DataSetChartVolumeLP[]
}
export function LP_VolumeChart({ title, dataset }: Props) {
    const valueFormatter = function (number: number) {
        return transformNumberK(Number(number.toFixed(2))).toString()
    }
    dataset.sort((a, b) => {
        return (
            new Date(a.date as string).getTime() -
            new Date(b?.date as string).getTime()
        )
    })
    return (
        <div className="border rounded-lg p-5">
            <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {title}
            </h3>
            {/* <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                ${value}
            </p> */}
            <BarChart
                className="h-80 text-white"
                data={dataset}
                index="date"
                showXAxis={false}
                categories={['volume']}
                colors={['blue']}
                yAxisWidth={80}
                valueFormatter={valueFormatter}
            />
        </div>
    )
}
