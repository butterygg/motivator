import { BarChart } from '@tremor/react'
import { DataSetChartVolumeLP } from '@/components/assessor/DialogUserData'

export type Props = {
    title: string
    value: string
    dataset: DataSetChartVolumeLP[]
}
export function LP_VolumeChart({ title, value, dataset }: Props) {
    const chartdata = [
        {
            date: 'Jan 23',
            Volume: 45,
        },
        {
            date: 'Feb 23',
            Volume: 52,
        },
        {
            date: 'Mar 23',
            Volume: 48,
        },
        {
            date: 'Apr 23',
            Volume: 61,
        },
        {
            date: 'May 23',
            Volume: 55,
        },
        {
            date: 'Jun 23',
            Volume: 67,
        },
        {
            date: 'Jul 23',
            Volume: 60,
        },
        {
            date: 'Aug 23',
            Volume: 72,
        },
        {
            date: 'Sep 23',
            Volume: 65,
        },
        {
            date: 'Oct 23',
            Volume: 68,
        },
        {
            date: 'Nov 23',
            Volume: 74,
        },
        {
            date: 'Dec 23',
            Volume: 71,
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
            <BarChart
                className="h-80"
                data={dataset}
                index="date"
                categories={['volume']}
                colors={['blue']}
                yAxisWidth={80}
            />
        </div>
    )
}
