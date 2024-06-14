import React from 'react'
import { Input } from '@/components/ui/input'
type Props = {}

const SearchBar = (props: Props) => {
    return (
        <div>
            <Input type="search" placeholder="Search..." className="w-full" />
        </div>
    )
}

export default SearchBar
