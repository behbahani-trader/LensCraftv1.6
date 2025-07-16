import React from 'react';
import { Customer } from '../types';
import { StarIcon, EyeIcon, EditIcon } from '../constants';

interface CustomerListProps {
    customers: Customer[];
    onViewDetails: (customer: Customer) => void;
    onEdit?: (customer: Customer) => void;
}

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm5.25 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ مشتری ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، روی دکمه "افزودن مشتری جدید" کلیک کنید.</p>
    </div>
);


const CustomerList: React.FC<CustomerListProps> = ({ customers, onViewDetails, onEdit }) => {
    if (customers.length === 0) {
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
                                نام کامل
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                تماس
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                بدهکاری
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                بستانکاری
                            </th>
                             <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                مانده
                            </th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">عملیات</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {customers.map((customer) => {
                            const balance = customer.credit - customer.debit;
                            return (
                                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{`${customer.firstName} ${customer.lastName}`}</span>
                                            {customer.isVip && <StarIcon className="w-4 h-4 text-yellow-400" title="مشتری ویژه" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {customer.phone && <div className="text-sm text-slate-600 dark:text-slate-300">{customer.phone}</div>}
                                        {customer.telegramChatId && <div className="text-xs text-blue-500 dark:text-blue-400">@{customer.telegramChatId}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                        <span className="text-red-600 dark:text-red-400">{formatCurrency(customer.debit)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                        <span className="text-green-600 dark:text-green-400">{formatCurrency(customer.credit)}</span>
                                    </td>
                                     <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(balance)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-4 space-x-reverse">
                                        <button 
                                            onClick={() => onViewDetails(customer)} 
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                                        >
                                            <EyeIcon className="w-5 h-5" />
                                            <span>مشاهده</span>
                                        </button>
                                        {onEdit && (
                                            <button 
                                                onClick={() => onEdit(customer)} 
                                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 flex items-center gap-1 transition-colors"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                                <span>ویرایش</span>
                                            </button>
                                        )}
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

export default CustomerList;