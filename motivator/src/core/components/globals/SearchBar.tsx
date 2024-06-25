import React from 'react'
import { Input } from '@/components/ui/input'
/**
 * Search bar component
 * @returns The SearchBar component
 */
const SearchBar = () => {
    return (
        <div>
            <Input type="search" placeholder="Search..." className="w-full" />
        </div>
    )
}

export default SearchBar
