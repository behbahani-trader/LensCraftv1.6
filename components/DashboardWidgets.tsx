
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Page, ThemeColor, Invoice, Customer } from '../types';
import { useDb } from '../contexts/DbContext';
import { getTodayJalaliString, formatJalaliForDisplay } from '../db';
import { InvoiceIcon, OrdersIcon, LedgerIcon, PackageIcon, UserIcon, WrenchIcon, CashIcon } from '../constants';

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

// Reusable Widget Wrapper
const WidgetCard: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden ${className}`}>
        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{title}</h3>
        <div className="p-4">
            {children}
        </div>
    </div>
);

// --- Quick Stats Widget ---
export const QuickStatsWidget: React.FC = () => {
    const db = useDb();
    const [stats, setStats] = useState({ invoiceCount: 0, serviceCount: 0, serviceTotal: 0 });

    useEffect(() => {
        const fetchDailyStats = async () => {
            const today = getTodayJalaliString();
            const todaysInvoices = await db.invoices.where('issueDate').equals(today).toArray();

            let serviceCount = 0;
            let serviceTotal = 0;

            todaysInvoices.forEach(invoice => {
                invoice.items.forEach(item => {
                    if (item.type === 'service') {
                        serviceCount += item.quantity;
                        serviceTotal += item.quantity * item.unitPrice;
                    }
                });
            });

            setStats({
                invoiceCount: todaysInvoices.length,
                serviceCount,
                serviceTotal,
            });
        };
        fetchDailyStats();
    }, [db]);

    return (
        <WidgetCard title="آمار روزانه" className="lg:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2">
                    <InvoiceIcon className="w-8 h-8 mx-auto text-purple-500" />
                    <p className="text-2xl font-bold mt-2">{stats.invoiceCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">فاکتور امروز</p>
                </div>
                <div className="p-2">
                    <WrenchIcon className="w-8 h-8 mx-auto text-orange-500" />
                    <p className="text-2xl font-bold mt-2">{stats.serviceCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">خدمت امروز</p>
                </div>
                 <div className="p-2">
                    <CashIcon className="w-8 h-8 mx-auto text-green-500" />
                    <p className="text-2xl font-bold mt-2">{formatCurrency(stats.serviceTotal)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">فروش خدمات</p>
                </div>
            </div>
        </WidgetCard>
    );
};


// --- Quick Access Widget ---
interface QuickAccessButtonProps {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    color: ThemeColor;
}

const QuickAccessButton: React.FC<QuickAccessButtonProps> = ({ icon, title, onClick, color }) => {
     const colorClasses: Record<ThemeColor, { text: string; bg: string }> = {
        blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
        red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' },
        green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/50' },
        purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/50' },
        orange: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50' },
    };
    const classes = colorClasses[color];
    return (
        <button onClick={onClick} className="flex items-center gap-3 p-3 rounded-custom w-full text-right transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
             <div className={`p-3 rounded-full ${classes.bg}`}>
                <div className={classes.text}>{icon}</div>
            </div>
            <span className="font-semibold">{title}</span>
        </button>
    )
}

export const QuickAccessWidget: React.FC<{ setActivePage: (page: Page, state?: any) => void }> = ({ setActivePage }) => {
    const { themeSettings } = useTheme();
    return (
        <WidgetCard title="دسترسی سریع">
             <div className="space-y-2">
                 <QuickAccessButton icon={<InvoiceIcon className="w-6 h-6" />} title="ایجاد فاکتور فروش" onClick={() => setActivePage('invoices', { view: 'form', type: 'sale' })} color={themeSettings.color} />
                 <QuickAccessButton icon={<OrdersIcon className="w-6 h-6" />} title="مشاهده سفارشات" onClick={() => setActivePage('orders')} color={themeSettings.color} />
                 <QuickAccessButton icon={<LedgerIcon className="w-6 h-6" />} title="دفتر معین مشتریان" onClick={() => setActivePage('customerLedger')} color={themeSettings.color} />
            </div>
        </WidgetCard>
    )
}

// --- Top Customers Widget ---
export const TopCustomersWidget: React.FC = () => {
    const db = useDb();
    const [topCustomers, setTopCustomers] = useState<{name: string, totalSpent: number}[]>([]);

    useEffect(() => {
        const fetchTopCustomers = async () => {
            const invoices = await db.invoices.toArray();
            const customerSpending = new Map<string, number>();

            invoices.forEach(inv => {
                if(inv.customerId && inv.customerName) {
                    const current = customerSpending.get(inv.customerName) || 0;
                    customerSpending.set(inv.customerName, current + inv.totalAmount);
                }
            });

            const sortedCustomers = Array.from(customerSpending.entries())
                .map(([name, totalSpent]) => ({ name, totalSpent }))
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 5);
            
            setTopCustomers(sortedCustomers);
        };
        fetchTopCustomers();
    }, [db]);

    return (
        <WidgetCard title="مشتریان برتر">
            {topCustomers.length > 0 ? (
                <ul className="space-y-3">
                    {topCustomers.map((customer, index) => (
                        <li key={customer.name} className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{index + 1}. {customer.name}</span>
                            <span className="font-mono text-sm text-green-600">{formatCurrency(customer.totalSpent)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">هنوز خریدی ثبت نشده است.</p>
            )}
        </WidgetCard>
    )
}

// --- Recent Invoices Widget ---
export const RecentInvoicesWidget: React.FC = () => {
    const db = useDb();
    const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
    
    useEffect(() => {
        const fetchRecent = async () => {
            const invoices = await db.invoices.orderBy('issueDate').reverse().limit(5).toArray();
            setRecentInvoices(invoices);
        };
        fetchRecent();
    }, [db]);

    return (
        <WidgetCard title="فاکتورهای اخیر" className="lg:col-span-2">
             {recentInvoices.length > 0 ? (
                <ul className="space-y-3">
                    {recentInvoices.map(inv => (
                         <li key={inv.id} className="flex items-center justify-between text-sm">
                            <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{inv.customerName}</span>
                                <span className="text-slate-500 dark:text-slate-400 mr-2 font-mono text-xs">#{inv.invoiceNumber}</span>
                            </div>
                            <div className="text-left">
                                <span className="font-mono text-slate-800 dark:text-slate-100">{formatCurrency(inv.totalAmount)}</span>
                                <span className="block text-xs text-slate-400 font-mono">{formatJalaliForDisplay(inv.issueDate)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">هنوز فاکتوری ثبت نشده است.</p>
            )}
        </WidgetCard>
    );
};
