import React from 'react';
import { Cost } from '../types';
import { TagIcon } from '../constants';

interface CostListProps {
    costs: Cost[];
    onDelete?: (costId: string) => void;
    onEdit?: (cost: Cost) => void;
}

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <TagIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ هزینه اضافی ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، روی دکمه "افزودن هزینه جدید" کلیک کنید.</p>
    </div>
);


const CostList: React.FC<CostListProps> = ({ costs, onDelete, onEdit }) => {
    if (costs.length === 0) {
        return <EmptyState />;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fa-IR').format(amount);
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                نام هزینه
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                مبلغ (تومان)
                            </th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">عملیات</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {costs.map((cost) => (
                            <tr key={cost.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{cost.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700 dark:text-slate-200">
                                    {formatCurrency(cost.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-4 space-x-reverse">
                                    {onEdit && <button onClick={() => onEdit(cost)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">ویرایش</button>}
                                    {onDelete && <button onClick={() => onDelete(cost.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">حذف</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CostList;
