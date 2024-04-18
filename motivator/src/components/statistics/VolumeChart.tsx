import { BarChart } from '@tremor/react'
import { DataSetChartTrading } from '@/components/assessor/DialogUserData'
import { transformNumberK } from '../../utils/utils'

export type Props = {
    title: string
    dataset: DataSetChartTrading[]
}
export function VolumeChart({ title, dataset }: Props) {
    const valueFormatter = function (number: number) {
        return transformNumberK(Number(number.toFixed(2))).toString()
    }
    console.log('dataset', dataset)
    return (
        <div className="border rounded-lg p-5">
            <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {title}
            </h3>
            {/* <p className="text-tremor-label text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                {value}
            </p> */}
            <BarChart
                className="h-80 text-white"
                data={dataset}
                index="date"
                categories={['Short', 'Long']}
                colors={['red', 'blue']}
                yAxisWidth={80}
                valueFormatter={valueFormatter}
            />
        </div>
    )
}
