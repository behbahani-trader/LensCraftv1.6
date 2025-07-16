import React from 'react';
import { SearchIcon } from '../constants';

interface SearchInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder }) => {
    return (
        <div className="relative w-full max-w-sm h-10">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
            <input
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full h-full p-2 pr-10 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700/50 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
    );
};

export default SearchInput;