import React from 'react';
import { Partner } from '../types';
import { UserGroupIcon } from '../constants';

interface PartnerListProps {
    partners: Partner[];
    balances: Map<string, number>;
    onEdit?: (partner: Partner) => void;
    onDelete?: (partnerId: string) => void;
    onTransaction?: (partner: Partner) => void;
    onViewDetails: (partner: Partner) => void;
}

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ شریکی ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، روی دکمه "افزودن شریک جدید" کلیک کنید.</p>
    </div>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};

const PartnerList: React.FC<PartnerListProps> = ({ partners, balances, onEdit, onDelete, onTransaction, onViewDetails }) => {
    if (partners.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">نام شریک</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">موجودی فعلی (تومان)</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">عملیات</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {partners.map((partner) => {
                            const balance = balances.get(partner.id) || 0;
                            return (
                                <tr key={partner.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                        <button onClick={() => onViewDetails(partner)} className="text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            {partner.name}
                                        </button>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${balance < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatCurrency(balance)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-4 space-x-reverse">
                                        {onTransaction && <button onClick={() => onTransaction(partner)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">تراکنش</button>}
                                        {onEdit && <button onClick={() => onEdit(partner)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">ویرایش</button>}
                                        {onDelete && <button onClick={() => onDelete(partner.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">حذف</button>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PartnerList;
