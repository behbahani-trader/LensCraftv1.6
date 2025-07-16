
import React, { useState, useEffect, useMemo } from 'react';
import { Partner, PartnerTransaction, PartnerTransactionType } from '../types';
import { useDb } from '../contexts/DbContext';
import { formatJalaliForDisplay } from '../db';
import SearchableSelect from '../components/SearchableSelect';
import SearchEmptyState from '../components/SearchEmptyState';
import { UserGroupIcon } from '../constants';

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

const txTypeLabels: Record<PartnerTransactionType, string> = {
    deposit: 'واریز',
    withdrawal: 'برداشت',
    transfer_in: 'انتقال دریافتی',
    transfer_out: 'انتقال ارسالی',
};

const txTypeClasses: Record<PartnerTransactionType, string> = {
    deposit: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    withdrawal: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    transfer_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    transfer_out: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
};

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ تراکنشی یافت نشد</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای مشاهده گزارش، ابتدا باید تراکنشی برای شرکا ثبت کنید.</p>
    </div>
);

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
);


const PartnerReportPage: React.FC = () => {
    const db = useDb();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        partnerId: '',
        txType: 'all' as PartnerTransactionType | 'all',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [partnersData, txData] = await Promise.all([
                    db.partners.toArray(),
                    db.partnerTransactions.orderBy('date').reverse().toArray()
                ]);
                setPartners(partnersData);
                setTransactions(txData);
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            }
        };
        fetchData();
    }, [db]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handlePartnerChange = (partner: Partner | null) => {
        setFilters(prev => ({ ...prev, partnerId: partner ? partner.id : '' }));
    };
    
    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', partnerId: '', txType: 'all' });
    };

    const filteredTransactions = useMemo(() => {
        let filtered = [...transactions];
        if (filters.startDate) {
            filtered = filtered.filter(tx => tx.date >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(tx => tx.date <= filters.endDate);
        }
        if (filters.partnerId) {
            filtered = filtered.filter(tx => tx.partnerId === filters.partnerId);
        }
        if (filters.txType !== 'all') {
            filtered = filtered.filter(tx => tx.type === filters.txType);
        }
        return filtered;
    }, [transactions, filters]);
    
    const stats = useMemo(() => {
        const totalDeposits = filteredTransactions
            .filter(tx => tx.type === 'deposit')
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        const totalWithdrawals = filteredTransactions
            .filter(tx => tx.type === 'withdrawal')
            .reduce((sum, tx) => sum + tx.amount, 0);

        // Summing only one side of transfers to avoid double-counting
        const totalTransfers = filteredTransactions
            .filter(tx => tx.type === 'transfer_out')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const transactionCount = filteredTransactions.length;

        return { totalDeposits, totalWithdrawals, totalTransfers, transactionCount };
    }, [filteredTransactions]);


    const hasActiveFilters = filters.startDate || filters.endDate || filters.partnerId || filters.txType !== 'all';

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">گزارش تراکنش‌های شرکا</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="مجموع واریزها" value={`${formatCurrency(stats.totalDeposits)} تومان`} />
                <StatCard title="مجموع برداشت‌ها" value={`${formatCurrency(stats.totalWithdrawals)} تومان`} />
                <StatCard title="مجموع انتقالات" value={`${formatCurrency(stats.totalTransfers)} تومان`} />
                <StatCard title="تعداد کل تراکنش‌ها" value={String(stats.transactionCount)} />
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                     <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">از تاریخ</label>
                        <input id="startDate" name="startDate" type="text" placeholder="مثال: ۱۴۰۳/۰۱/۰۱" value={filters.startDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تا تاریخ</label>
                        <input id="endDate" name="endDate" type="text" placeholder="مثال: ۱۴۰۳/۱۲/۲۹" value={filters.endDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"/>
                    </div>
                     <SearchableSelect
                        label="شریک"
                        options={partners}
                        value={partners.find(c => c.id === filters.partnerId) || null}
                        onChange={handlePartnerChange}
                        getOptionLabel={(p) => p.name}
                        getOptionValue={(p) => p.id}
                        placeholder="همه شرکا"
                    />
                     <div>
                        <label htmlFor="txType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع تراکنش</label>
                        <select id="txType" name="txType" value={filters.txType} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
                            <option value="all">همه</option>
                            <option value="deposit">واریز</option>
                            <option value="withdrawal">برداشت</option>
                            <option value="transfer_in">انتقال دریافتی</option>
                            <option value="transfer_out">انتقال ارسالی</option>
                        </select>
                    </div>
                </div>
                 {hasActiveFilters && (
                    <div className="mt-4 flex items-center justify-end">
                        <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">
                            حذف فیلترها
                        </button>
                    </div>
                )}
            </div>
            
            {filteredTransactions.length > 0 ? (
                 <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300">تاریخ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300">شریک</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300">نوع</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300">مبلغ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300">شرح</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatJalaliForDisplay(tx.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-100">{tx.partnerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${txTypeClasses[tx.type]}`}>
                                                {txTypeLabels[tx.type]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-800 dark:text-slate-100">{formatCurrency(tx.amount)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-sm truncate" title={tx.description}>
                                            {tx.description}
                                            {tx.type.startsWith('transfer') && (
                                                <span className="block text-xs text-slate-400">
                                                    {tx.type === 'transfer_in' ? 'از: ' : 'به: '} {tx.relatedPartnerName}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            ) : hasActiveFilters ? (
                <SearchEmptyState />
            ) : (
                <EmptyState />
            )}
        </div>
    );
};

export default PartnerReportPage;
