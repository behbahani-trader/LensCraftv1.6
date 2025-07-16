import React from 'react';
import { SearchIcon } from '../constants';

const SearchEmptyState: React.FC = () => {
    return (
        <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-dashed border-slate-300 dark:border-slate-700">
            <SearchIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ موردی یافت نشد</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">عبارت جستجوی خود را تغییر دهید.</p>
        </div>
    );
};

export default SearchEmptyState;