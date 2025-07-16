
import React, { useState, useEffect, useMemo } from 'react';
import { BoxType, Transaction } from '../types';
import { useDb } from '../contexts/DbContext';
import { formatJalaliForDisplay } from '../db';
import AddTransactionModal from './AddTransactionModal';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { CashIcon } from '../constants';
import SearchInput from './SearchInput';
import SearchEmptyState from './SearchEmptyState';

interface CashBoxProps {
    boxType: BoxType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);

const CashBox: React.FC<CashBoxProps> = ({ boxType }) => {
    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();
    const db = useDb();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            const data = await db.cashTransactions.where('boxType').equals(boxType).sortBy('date');
            setTransactions(data.reverse()); // Show most recent first
        };
        fetchTransactions();
    }, [boxType, db]);

    const { balance, totalIncome, totalExpense, transactionsWithBalance } = useMemo(() => {
        const sortedForBalance = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
        
        let currentBalance = 0;
        const transactionsWithBalanceMap = new Map<string, number>();
        sortedForBalance.forEach(t => {
            currentBalance += (t.type === 'income' ? t.amount : -t.amount);
            transactionsWithBalanceMap.set(t.id, currentBalance);
        });

        const transactionsWithBalance = transactions.map(t => ({
            ...t,
            balance: transactionsWithBalanceMap.get(t.id) || 0
        }));

        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        return {
            balance: income - expense,
            totalIncome: income,
            totalExpense: expense,
            transactionsWithBalance: transactionsWithBalance
        };
    }, [transactions]);

    const filteredTransactionsWithBalance = useMemo(() => {
        if (!searchTerm.trim()) return transactionsWithBalance;
        const lowercasedFilter = searchTerm.toLowerCase();
        return transactionsWithBalance.filter(t =>
            t.description.toLowerCase().includes(lowercasedFilter)
        );
    }, [transactionsWithBalance, searchTerm]);
    
    const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id' | 'boxType'>) => {
        const transaction: Transaction = {
            ...newTransactionData,
            id: Date.now().toString(),
            boxType: boxType,
        };
        await db.cashTransactions.add(transaction);
        const updatedTransactions = await db.cashTransactions.where('boxType').equals(boxType).sortBy('date');
        setTransactions(updatedTransactions.reverse());
    };

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="موجودی فعلی" value={`${formatCurrency(balance)} تومان`} color="blue" />
                <StatCard title="مجموع واریزی" value={`${formatCurrency(totalIncome)} تومان`} color="green" />
                <StatCard title="مجموع برداشتی" value={`${formatCurrency(totalExpense)} تومان`} color="red" />
            </div>

            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">لیست تراکنش‌ها</h2>
                <div className="flex items-center gap-3">
                    <SearchInput
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="جستجو در تراکنش‌ها..."
                    />
                    {hasPermission('page:cashBox:transaction') && (
                        <button onClick={() => setIsModalOpen(true)} className={`h-10 px-4 flex items-center text-white font-semibold rounded-custom shadow-md ${colorClasses[themeSettings.color]}`}>
                            افزودن تراکنش
                        </button>
                    )}
                </div>
            </div>

            {filteredTransactionsWithBalance.length > 0 ? (
                <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">تاریخ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">شرح</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">واریز</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">برداشت</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مانده</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTransactionsWithBalance.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatJalaliForDisplay(t.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">{t.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-600 dark:text-green-400">{t.type === 'income' ? formatCurrency(t.amount) : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600 dark:text-red-400">{t.type === 'expense' ? formatCurrency(t.amount) : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">{formatCurrency(t.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : searchTerm ? (
                <SearchEmptyState />
            ) : (
                <EmptyState />
            )}

            <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTransaction={handleAddTransaction} />
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; color: 'blue' | 'green' | 'red' }> = ({ title, value, color }) => {
    const colors = {
        blue: 'border-blue-500 dark:border-blue-400',
        green: 'border-green-500 dark:border-green-400',
        red: 'border-red-500 dark:border-red-400',
    };
    return (
        <div className={`bg-white dark:bg-slate-800/50 p-6 rounded-custom border-l-4 ${colors[color]}`}>
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
    );
};

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <CashIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هنوز هیچ تراکنشی ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، روی دکمه "افزودن تراکنش" کلیک کنید.</p>
    </div>
);


export default CashBox;
