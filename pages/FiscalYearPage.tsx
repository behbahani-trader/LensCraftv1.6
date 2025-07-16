import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { metaDb, getDbForFiscalYear } from '../db';
import { FiscalYear, Product, Customer, Partner, Transaction } from '../types';
import Dexie from 'dexie';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <input id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
    </div>
);

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);

const FiscalYearPage: React.FC = () => {
    const { themeSettings, fiscalYears, setFiscalYears, activeFiscalYearId, setActiveFiscalYearId } = useTheme();
    const { hasPermission } = useAuth();
    const [newYearName, setNewYearName] = useState('');
    const [newYearId, setNewYearId] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const canManage = hasPermission('page:fiscalYears:manage');

    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newYearName.trim() || !newYearId.trim()) {
            setMessage({ type: 'error', text: 'شناسه و نام سال مالی اجباری است.' });
            return;
        }
        if (fiscalYears.some(y => y.id === newYearId)) {
            setMessage({ type: 'error', text: 'سال مالی با این شناسه قبلا ثبت شده است.' });
            return;
        }
        
        const newYear: FiscalYear = { id: newYearId, name: newYearName };
        try {
            await metaDb.fiscalYears.add(newYear);
            setFiscalYears(prev => [...prev, newYear]);
            setNewYearId('');
            setNewYearName('');
            setMessage({ type: 'success', text: `سال مالی "${newYearName}" با موفقیت ایجاد شد.` });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'خطا در ایجاد سال مالی.' });
        }
    };
    
    const handleDeleteYear = async (yearId: string) => {
        if(yearId === activeFiscalYearId) {
            setMessage({ type: 'error', text: 'نمی‌توانید سال مالی فعال را حذف کنید.' });
            return;
        }

        if (window.confirm(`آیا از حذف سال مالی با شناسه "${yearId}" و تمام داده‌های آن مطمئن هستید؟ این عمل غیرقابل بازگشت است.`)) {
            try {
                // Delete the data database
                const dbName = `LensCraftData_${yearId}`;
                await Dexie.delete(dbName);

                // Delete the record from metaDb
                await metaDb.fiscalYears.delete(yearId);
                
                setFiscalYears(prev => prev.filter(y => y.id !== yearId));
                setMessage({ type: 'success', text: `سال مالی "${yearId}" با موفقیت حذف شد.` });
            } catch (error) {
                 console.error(error);
                setMessage({ type: 'error', text: 'خطا در حذف سال مالی.' });
            }
        }
    }

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <SettingsCard title="انتخاب سال مالی فعال">
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="w-full">
                         <label htmlFor="activeYearSelect" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سال مالی فعال</label>
                         <select
                            id="activeYearSelect"
                            value={activeFiscalYearId || ''}
                            onChange={(e) => setActiveFiscalYearId(e.target.value)}
                            className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                         >
                            {fiscalYears.map(year => (
                                <option key={year.id} value={year.id}>{year.name}</option>
                            ))}
                         </select>
                    </div>
                </div>
            </SettingsCard>
            
            {canManage && (
                <>
                    <SettingsCard title="ایجاد سال مالی جدید">
                        <form onSubmit={handleCreateYear} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <Input label="شناسه سال مالی" name="yearId" value={newYearId} onChange={(e) => setNewYearId(e.target.value)} required placeholder="مثال: 1404" />
                            <Input label="نام سال مالی" name="yearName" value={newYearName} onChange={(e) => setNewYearName(e.target.value)} required placeholder="مثال: سال مالی ۱۴۰۴" />
                            <button type="submit" className={`h-10 px-4 flex items-center justify-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${themeColorClass}`}>
                                ایجاد سال جدید
                            </button>
                        </form>
                    </SettingsCard>

                    <DataTransferTool />
                    
                     <SettingsCard title="لیست سال‌های مالی">
                        <ul className="space-y-2">
                            {fiscalYears.map(year => (
                                <li key={year.id} className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-custom">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{year.name}</p>
                                        <p className="text-sm font-mono text-slate-500 dark:text-slate-400">ID: {year.id}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteYear(year.id)}
                                        disabled={year.id === activeFiscalYearId}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        حذف
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </SettingsCard>
                </>
            )}

            {message && (
                <div className={`p-4 rounded-custom text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

const DataTransferTool: React.FC = () => {
    const { fiscalYears, themeSettings } = useTheme();
    const [sourceYearId, setSourceYearId] = useState<string>('');
    const [destYearId, setDestYearId] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if(fiscalYears.length > 0) {
            setSourceYearId(fiscalYears[0].id);
            setDestYearId(fiscalYears[0].id);
        }
    }, [fiscalYears]);

    const handleTransfer = async () => {
        if (sourceYearId === destYearId) {
            setMessage('سال مبدا و مقصد نمی‌توانند یکسان باشند.');
            setStatus('error');
            return;
        }
        
        setStatus('processing');
        setMessage('در حال انتقال اطلاعات، لطفا صبر کنید...');
        
        try {
            const sourceDb = getDbForFiscalYear(sourceYearId);
            const destDb = getDbForFiscalYear(destYearId);

            // 1. Transfer Definitions
            const products = await sourceDb.products.toArray();
            await destDb.products.bulkPut(products);

            const costs = await sourceDb.costs.toArray();
            await destDb.costs.bulkPut(costs);
            
            // 2. Transfer Customers with final balance
            const sourceCustomers = await sourceDb.customers.toArray();
            const newCustomers: Customer[] = sourceCustomers.map(c => {
                const balance = c.credit - c.debit;
                return {
                    ...c,
                    credit: balance > 0 ? balance : 0,
                    debit: balance < 0 ? Math.abs(balance) : 0,
                };
            });
            await destDb.customers.bulkPut(newCustomers);

            // 3. Transfer Partners with final balance
            const sourcePartners = await sourceDb.partners.toArray();
            const sourcePartnerTxs = await sourceDb.partnerTransactions.toArray();
            const newPartners: Partner[] = sourcePartners.map(p => {
                let balance = p.initialBalance;
                sourcePartnerTxs.filter(tx => tx.partnerId === p.id).forEach(tx => {
                    if (tx.type === 'deposit' || tx.type === 'transfer_in') balance += tx.amount;
                    if (tx.type === 'withdrawal' || tx.type === 'transfer_out') balance -= tx.amount;
                });
                return { ...p, initialBalance: balance };
            });
            await destDb.partners.bulkPut(newPartners);

            // 4. Transfer Cash Box balances
            const sourceCashTxs = await sourceDb.cashTransactions.toArray();
            const mainBalance = sourceCashTxs.filter(tx => tx.boxType === 'main').reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
            const vipBalance = sourceCashTxs.filter(tx => tx.boxType === 'vip').reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
            
            const openingTransactions: Transaction[] = [];
            if(mainBalance !== 0) {
                openingTransactions.push({ 
                    id: 'opening-main', 
                    boxType: 'main', 
                    type: mainBalance > 0 ? 'income' : 'expense', 
                    amount: Math.abs(mainBalance), 
                    date: `${destYearId}/01/01`, 
                    description: `موجودی انتقالی از سال ${sourceYearId}`
                });
            }
             if(vipBalance !== 0) {
                openingTransactions.push({ 
                    id: 'opening-vip', 
                    boxType: 'vip', 
                    type: vipBalance > 0 ? 'income' : 'expense', 
                    amount: Math.abs(vipBalance), 
                    date: `${destYearId}/01/01`, 
                    description: `موجودی انتقالی از سال ${sourceYearId}`
                });
            }

            if(openingTransactions.length > 0) {
                await destDb.cashTransactions.bulkPut(openingTransactions);
            }

            setMessage('انتقال اطلاعات با موفقیت انجام شد.');
            setStatus('success');
        } catch(error: any) {
            console.error(error);
            setMessage(`خطا در انتقال: ${error.message}`);
            setStatus('error');
        }
    };
    
     const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];


    return (
        <SettingsCard title="انتقال اطلاعات به سال مالی جدید">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                از این ابزار برای انتقال تعاریف (محصولات، خدمات، هزینه‌ها) و مانده حساب‌ها (مشتریان، شرکا، صندوق‌ها) از یک سال مالی به سال مالی جدید استفاده کنید.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                 <div>
                    <label htmlFor="sourceYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">از سال</label>
                    <select id="sourceYear" value={sourceYearId} onChange={e => setSourceYearId(e.target.value)} className="h-10 w-full px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700/50">
                        {fiscalYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="destYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">به سال</label>
                    <select id="destYear" value={destYearId} onChange={e => setDestYearId(e.target.value)} className="h-10 w-full px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700/50">
                        {fiscalYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleTransfer}
                    disabled={status === 'processing'}
                    className={`h-10 px-4 flex items-center justify-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${themeColorClass} ${status === 'processing' ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {status === 'processing' ? 'در حال انتقال...' : 'شروع انتقال اطلاعات'}
                </button>
            </div>
            {message && (
                <div className={`mt-4 text-sm p-2 rounded-custom ${
                    status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 
                    status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>
                    {message}
                </div>
            )}
        </SettingsCard>
    );
};

export default FiscalYearPage;
