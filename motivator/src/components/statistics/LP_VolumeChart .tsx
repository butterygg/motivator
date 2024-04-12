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
            lp: 45,
        },
        {
            date: 'Feb 23',
            lp: 52,
        },
        {
            date: 'Mar 23',
            lp: 48,
        },
        {
            date: 'Apr 23',
            lp: 61,
        },
        {
            date: 'May 23',
            lp: 55,
        },
        {
            date: 'Jun 23',
            lp: 67,
        },
        {
            date: 'Jul 23',
            lp: 60,
        },
        {
            date: 'Aug 23',
            lp: 72,
        },
        {
            date: 'Sep 23',
            lp: 65,
        },
        {
            date: 'Oct 23',
            lp: 68,
        },
        {
            date: 'Nov 23',
            lp: 74,
        },
        {
            date: 'Dec 23',
            lp: 71,
        },
    ]
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
                data={chartdata}
                index="date"
                categories={['lp']}
                colors={['blue']}
                yAxisWidth={80}
            />
        </div>
    )
}
