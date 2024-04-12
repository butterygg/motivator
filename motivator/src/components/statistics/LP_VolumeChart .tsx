import { BarChart } from '@tremor/react'
import { DataSetChartVolumeLP } from '@/components/assessor/DialogUserData'

export type Props = {
    title: string
    value: string
    dataset: DataSetChartVolumeLP[]
}
export function LP_VolumeChart({ title, value, dataset }: Props) {
    return (
        <div className="border rounded-lg p-5">
            <h3 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                {title}
            </h3>
            <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                ${value}
            </p>
            <BarChart
                className="h-80"
                data={dataset}
                index="date"
                categories={['lp']}
                colors={['red']}
                yAxisWidth={80}
            />
        </div>
    )
}
