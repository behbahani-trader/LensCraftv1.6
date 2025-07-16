import React, { useMemo } from 'react';
import { Partner, PartnerTransaction, PartnerTransactionType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { formatJalaliForDisplay } from '../db';
import { ArrowRightIcon } from '../constants';

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


const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
);

const ReportCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{title}</h3>
        {children}
    </div>
);

interface PartnerDetailsViewProps {
    partner: Partner;
    transactions: PartnerTransaction[];
    onBack: () => void;
}

const PartnerDetailsView: React.FC<PartnerDetailsViewProps> = ({ partner, transactions, onBack }) => {
    const { themeSettings } = useTheme();

    const ledgerEntries = useMemo(() => {
        let balance = partner.initialBalance;
        const entries = transactions.map(tx => {
            const credit = (tx.type === 'deposit' || tx.type === 'transfer_in') ? tx.amount : 0;
            const debit = (tx.type === 'withdrawal' || tx.type === 'transfer_out') ? tx.amount : 0;
            balance = balance + credit - debit;
            return {
                ...tx,
                credit,
                debit,
                balance,
            };
        });
        return entries;
    }, [partner, transactions]);

    const stats = useMemo(() => {
        const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        const totalTransfersIn = transactions.filter(t => t.type === 'transfer_in').reduce((sum, t) => sum + t.amount, 0);
        const totalTransfersOut = transactions.filter(t => t.type === 'transfer_out').reduce((sum, t) => sum + t.amount, 0);
        const currentBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : partner.initialBalance;

        return {
            totalDeposits,
            totalWithdrawals,
            totalTransfersIn,
            totalTransfersOut,
            currentBalance
        };
    }, [transactions, ledgerEntries, partner.initialBalance]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    دفتر معین: {partner.name}
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                        <ArrowRightIcon className="w-4 h-4" />
                        <span>بازگشت به لیست</span>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="موجودی فعلی" value={`${formatCurrency(stats.currentBalance)} تومان`} />
                <StatCard title="مجموع واریز" value={`${formatCurrency(stats.totalDeposits)} تومان`} />
                <StatCard title="مجموع برداشت" value={`${formatCurrency(stats.totalWithdrawals)} تومان`} />
                <StatCard title="موجودی اولیه" value={`${formatCurrency(partner.initialBalance)} تومان`} />
                <StatCard title="کل انتقالات دریافتی" value={`${formatCurrency(stats.totalTransfersIn)} تومان`} />
                <StatCard title="کل انتقالات ارسالی" value={`${formatCurrency(stats.totalTransfersOut)} تومان`} />
            </div>

             <ReportCard title="لیست تراکنش‌ها">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-3 text-right font-medium">تاریخ</th>
                                <th className="p-3 text-right font-medium">نوع</th>
                                <th className="p-3 text-right font-medium">شرح</th>
                                <th className="p-3 text-right font-medium">بدهکار</th>
                                <th className="p-3 text-right font-medium">بستانکار</th>
                                <th className="p-3 text-right font-medium">مانده</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                             <tr className="bg-slate-100 dark:bg-slate-700/80 font-semibold">
                                <td colSpan={5} className="p-3">موجودی اولیه</td>
                                <td className="p-3 font-mono">{formatCurrency(partner.initialBalance)}</td>
                            </tr>
                            {ledgerEntries.length > 0 ? ledgerEntries.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-3 font-mono text-slate-500">{formatJalaliForDisplay(entry.date)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${txTypeClasses[entry.type]}`}>
                                            {txTypeLabels[entry.type]}
                                        </span>
                                    </td>
                                    <td className="p-3 max-w-sm truncate" title={entry.description}>
                                        {entry.description}
                                        {entry.type.startsWith('transfer') && (
                                            <span className="block text-xs text-slate-400">
                                                {entry.type === 'transfer_in' ? 'از: ' : 'به: '} {entry.relatedPartnerName}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 font-mono text-red-500">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                    <td className="p-3 font-mono text-green-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                    <td className="p-3 font-mono text-slate-700 dark:text-slate-200">{formatCurrency(entry.balance)}</td>
                                </tr>
                            )) : <tr><td colSpan={6} className="text-center p-6 text-slate-500 dark:text-slate-400">تراکنشی برای این شریک ثبت نشده است.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </ReportCard>
        </div>
    );
};

export default PartnerDetailsView;