import * as React from 'react'

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export function WeekSelector() {
    return (
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Totals for this week" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Week</SelectLabel>
                    <SelectItem value="apple">Week 1</SelectItem>
                    <SelectItem value="banana">Week 2</SelectItem>
                    <SelectItem value="blueberry">Week 3</SelectItem>
                    <SelectItem value="grapes">Week 4</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
