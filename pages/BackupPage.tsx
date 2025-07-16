import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDb } from '../contexts/DbContext';
import { metaDb, getTodayJalaliString } from '../db';
import { Customer, Product, Invoice, UserAuthData, Cost, Transaction, ShareTransaction, Partner, PartnerTransaction, Wastage, FiscalYear, Role } from '../types';

interface BackupData {
    // Meta data
    fiscalYears: FiscalYear[];
    users: UserAuthData[];
    roles: Role[];
    
    // Fiscal data
    customers: Customer[];
    products: Product[];
    invoices: Invoice[];
    costs: Cost[];
    cashTransactions: Transaction[];
    shares: ShareTransaction[];
    partners: Partner[];
    partnerTransactions: PartnerTransaction[];
    wastages: Wastage[];
    
    // Backup info
    backupDate: string;
    fiscalYearIdForData: string;
}


const BackupPage: React.FC = () => {
    const { themeSettings, activeFiscalYearId } = useTheme();
    const db = useDb();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = async () => {
        setIsLoading(true);
        setMessage(null);
        if (!activeFiscalYearId) {
             setMessage({ type: 'error', text: 'هیچ سال مالی فعالی انتخاب نشده است.' });
             setIsLoading(false);
             return;
        }

        try {
            // Fetch from metaDB
            const [fiscalYears, users, roles] = await Promise.all([
                metaDb.fiscalYears.toArray(),
                metaDb.users.toArray(),
                metaDb.roles.toArray()
            ]);

            // Fetch from active fiscal year DB
            const [customers, products, invoices, costs, cashTransactions, shares, partners, partnerTransactions, wastages] = await Promise.all([
                db.customers.toArray(),
                db.products.toArray(),
                db.invoices.toArray(),
                db.costs.toArray(),
                db.cashTransactions.toArray(),
                db.shares.toArray(),
                db.partners.toArray(),
                db.partnerTransactions.toArray(),
                db.wastages.toArray(),
            ]);

            const backupData: BackupData = {
                fiscalYears, users, roles,
                customers, products, invoices, costs, cashTransactions, shares, partners, partnerTransactions, wastages,
                backupDate: new Date().toISOString(),
                fiscalYearIdForData: activeFiscalYearId,
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateString = getTodayJalaliString().replace(/\//g, '-');
            a.download = `backup-${dateString}-(FY-${activeFiscalYearId}).json`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setMessage({ type: 'success', text: 'فایل پشتیبان با موفقیت دانلود شد.' });

        } catch (error) {
            console.error("Backup failed:", error);
            setMessage({ type: 'error', text: 'خطا در ایجاد فایل پشتیبان.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isConfirmed = window.confirm(
            'توجه!\n\nآیا از بازیابی اطلاعات مطمئن هستید؟ این عمل داده‌های کلی (مانند کاربران) و داده‌های مربوط به سال مالی فعال فعلی را حذف و با اطلاعات فایل پشتیبان جایگزین می‌کند.\n\nاین عمل غیرقابل بازگشت است.'
        );

        if (!isConfirmed) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        handleRestore(file);
    };

    const handleRestore = async (file: File) => {
        setIsLoading(true);
        setMessage(null);
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File content is not readable.");
                }

                const data: BackupData = JSON.parse(text);

                // Validation
                const requiredMetaTables: (keyof BackupData)[] = ['fiscalYears', 'users', 'roles'];
                const requiredFiscalTables: (keyof BackupData)[] = ['customers', 'products', 'invoices', 'costs', 'cashTransactions', 'shares', 'partners', 'partnerTransactions', 'wastages'];
                for (const table of [...requiredMetaTables, ...requiredFiscalTables]) {
                    if (!Array.isArray((data as any)[table])) {
                        throw new Error(`فایل پشتیبان نامعتبر یا ناقص است. جدول '${table}' یافت نشد.`);
                    }
                }
                
                // Restore Meta DB
                const metaTablesToRestore = [metaDb.fiscalYears, metaDb.users, metaDb.roles];
                await metaDb.transaction('rw', metaTablesToRestore, async () => {
                    await Promise.all(metaTablesToRestore.map(table => table.clear()));
                    await Promise.all([
                        metaDb.fiscalYears.bulkAdd(data.fiscalYears),
                        metaDb.users.bulkAdd(data.users),
                        metaDb.roles.bulkAdd(data.roles),
                    ]);
                });
                
                // Restore Fiscal DB (to the currently active one)
                const fiscalTablesToRestore = [
                    db.customers, db.products, db.invoices, db.costs,
                    db.cashTransactions, db.shares, db.partners, db.partnerTransactions, db.wastages
                ];
                await db.transaction('rw', fiscalTablesToRestore, async () => {
                    await Promise.all(fiscalTablesToRestore.map(table => table.clear()));
                    await Promise.all([
                        db.customers.bulkAdd(data.customers),
                        db.products.bulkAdd(data.products),
                        db.invoices.bulkAdd(data.invoices),
                        db.costs.bulkAdd(data.costs),
                        db.cashTransactions.bulkAdd(data.cashTransactions),
                        db.shares.bulkAdd(data.shares),
                        db.partners.bulkAdd(data.partners),
                        db.partnerTransactions.bulkAdd(data.partnerTransactions),
                        db.wastages.bulkAdd(data.wastages),
                    ]);
                });
                
                setMessage({ type: 'success', text: 'اطلاعات با موفقیت بازیابی شد. برنامه مجددا بارگذاری می‌شود...' });
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error: any) {
                console.error("Restore failed:", error);
                setMessage({ type: 'error', text: `خطا در بازیابی اطلاعات: ${error.message}` });
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
             setMessage({ type: 'error', text: 'خطا در خواندن فایل.' });
             setIsLoading(false);
        };

        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
        <div className="max-w-4xl mx-auto space-y-8">
            <SettingsCard title="پشتیبان‌گیری از داده‌ها">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    از تمام داده‌های سیستمی (کاربران، نقش‌ها) و داده‌های مربوط به <strong>سال مالی فعال فعلی</strong> یک فایل پشتیبان تهیه کنید.
                </p>
                <button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${themeColorClass} ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {isLoading ? 'در حال پردازش...' : 'دانلود فایل پشتیبان'}
                </button>
            </SettingsCard>

            <SettingsCard title="بازیابی اطلاعات از فایل">
                <div className="bg-red-100 dark:bg-red-900/50 border-r-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-custom mb-4 text-sm">
                    <p><strong>هشدار:</strong> بازیابی اطلاعات، تمام داده‌های سیستمی و داده‌های <strong>سال مالی فعال فعلی</strong> را حذف و با اطلاعات فایل پشتیبان جایگزین می‌کند. این عمل غیرقابل بازگشت است.</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    فایل پشتیبان (JSON.) خود را برای بازیابی اطلاعات انتخاب کنید.
                </p>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isLoading}
                />
                 <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors border ${isLoading ? 'opacity-50 cursor-wait' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                >
                    {isLoading ? 'در حال پردازش...' : 'انتخاب فایل پشتیبان...'}
                </button>
            </SettingsCard>

            {message && (
                <div className={`p-4 rounded-custom text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

const SettingsCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);

export default BackupPage;