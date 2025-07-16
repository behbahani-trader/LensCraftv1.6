import React from 'react';
import { Wastage } from '../types';
import { formatJalaliForDisplay } from '../db';
import { TrashIcon } from '../constants';

interface WastageListProps {
    wastages: Wastage[];
    onDelete?: (wastageId: string, transactionId: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};

export const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <TrashIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ ضایعاتی ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، روی دکمه "افزودن ضایعات" کلیک کنید.</p>
    </div>
);

const WastageList: React.FC<WastageListProps> = ({ wastages, onDelete }) => {
    if (wastages.length === 0 && onDelete === undefined) {
        return <EmptyState />;
    }
    
    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-right font-medium">تاریخ</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">شرح ضایعات</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">هزینه کل</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">صندوق</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">توضیحات</th>
                            <th scope="col" className="relative px-4 py-3"><span className="sr-only">عملیات</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {wastages.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">{formatJalaliForDisplay(item.date)}</td>
                                <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-100">{item.title}</td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-red-600">{formatCurrency(item.totalCost)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.boxType === 'main' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50'}`}>
                                      {item.boxType === 'main' ? 'اصلی' : 'VIP'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-500 max-w-xs truncate" title={item.description}>{item.description || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-left">
                                    {onDelete && (
                                        <button onClick={() => onDelete(item.id, item.transactionId)} className="text-red-500 hover:text-red-700 p-1 rounded-full" title="حذف">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WastageList;