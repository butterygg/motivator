import { BarChart, EventProps } from '@tremor/react'
import { useState } from 'react'

const chartdata = [
    {
        date: 'Jan 23',
        Short: 45,
        Long: 78,
    },
    {
        date: 'Feb 23',
        Short: 52,
        Long: 71,
    },
    {
        date: 'Mar 23',
        Short: 48,
        Long: 80,
    },
    {
        date: 'Apr 23',
        Short: 61,
        Long: 65,
    },
    {
        date: 'May 23',
        Short: 55,
        Long: 58,
    },
    {
        date: 'Jun 23',
        Short: 67,
        Long: 62,
    },
    {
        date: 'Jul 23',
        Short: 60,
        Long: 54,
    },
    {
        date: 'Aug 23',
        Short: 72,
        Long: 49,
    },
    {
        date: 'Sep 23',
        Short: 65,
        Long: 52,
    },
    {
        date: 'Oct 23',
        Short: 68,
        Long: null,
    },
    {
        date: 'Nov 23',
        Short: 74,
        Long: null,
    },
    {
        date: 'Dec 23',
        Short: 71,
        Long: null,
    },
]
export type Props = {
    title: string
    value: string
}
export function VolumeChart({ title, value }: Props) {
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
                categories={['Short', 'Long']}
                colors={['red', 'blue']}
                yAxisWidth={80}
            />
        </div>
    )
}
