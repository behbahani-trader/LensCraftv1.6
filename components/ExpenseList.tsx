import React from 'react';
import { Expense } from '../types';
import { formatJalaliForDisplay } from '../db';
import { ReceiptIcon } from '../constants';

interface ExpenseListProps {
    expenses: Expense[];
    onDelete: (expenseId: string) => void;
}

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <ReceiptIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ هزینه‌ای ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، روی دکمه "افزودن هزینه جدید" کلیک کنید.</p>
    </div>
);


const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete }) => {
    if (expenses.length === 0) {
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
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">تاریخ</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">شرح</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">دسته‌بندی</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مبلغ (تومان)</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">عملیات</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatJalaliForDisplay(expense.date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-100 max-w-sm truncate" title={expense.description}>{expense.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700">{expense.category}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600 dark:text-red-400">{formatCurrency(expense.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                    <button onClick={() => onDelete(expense.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpenseList;