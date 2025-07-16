import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDb } from '../contexts/DbContext';
import { Invoice } from '../types';
import { WrenchIcon, ChartIcon } from '../constants';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};

const ReportCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{title}</h3>
        {children}
    </div>
);

const BarChart: React.FC<{ data: { label: string; amount: number; }[] }> = ({ data }) => {
    const { themeSettings } = useTheme();
    const maxValue = Math.max(...data.map(d => d.amount), 0);

    if (data.length === 0) return <p className="text-center p-8 text-slate-500 dark:text-slate-400">داده‌ای برای نمایش در نمودار وجود ندارد.</p>;

    const colorClasses = {
        blue: 'bg-blue-500',
        red: 'bg-red-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];

    return (
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700">
            <div className="flex justify-around items-end h-64 gap-2">
                {data.map((item, index) => (
                    <div key={index} className="h-full flex flex-col-reverse items-center flex-1 text-center group min-w-[20px]">
                        <span className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate w-full">{item.label}</span>
                        <div
                            className={`w-full rounded-t-md transition-all duration-300 ${themeColorClass} hover:opacity-80 relative`}
                            style={{ height: `${maxValue > 0 ? (item.amount / maxValue) * 100 : 0}%` }}
                        >
                            <span className="opacity-0 group-hover:opacity-100 text-xs font-mono bg-black/50 text-white rounded px-1 py-0.5 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 transition-opacity whitespace-nowrap">
                                {formatCurrency(item.amount)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const ClientServicesReportPage: React.FC = () => {
    const { currentUser } = useAuth();
    const db = useDb();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    
    useEffect(() => {
        const fetchInvoices = async () => {
            if (currentUser?.customerId) {
                const clientInvoices = await db.invoices.where('customerId').equals(currentUser.customerId).toArray();
                setInvoices(clientInvoices);
            }
        };
        fetchInvoices();
    }, [currentUser?.customerId, db]);

    const servicesData = useMemo(() => {
        const serviceCounts = new Map<string, { id: string; name: string; count: number }>();
        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                if (item.type === 'service') {
                    const existing = serviceCounts.get(item.productId);
                    if (existing) {
                        existing.count += item.quantity;
                    } else {
                        serviceCounts.set(item.productId, {
                            id: item.productId,
                            name: item.name,
                            count: item.quantity,
                        });
                    }
                }
            });
        });
        const result = Array.from(serviceCounts.values());
        result.sort((a, b) => b.count - a.count);
        return result;
    }, [invoices]);

    const NoServicesDataState = () => (
         <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
            <WrenchIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هنوز خدمتی دریافت نکرده‌اید</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">وقتی خدمتی برای شما ثبت شود، گزارش آن در اینجا نمایش داده می‌شود.</p>
        </div>
    );

    if (servicesData.length === 0) {
        return <NoServicesDataState />;
    }

    return (
        <div className="space-y-6">
             <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">گزارش خدمات دریافت شده</h1>
             <div className="space-y-8">
                <ReportCard title="نمودار تعداد خدمات">
                     <BarChart data={servicesData.map(s => ({ label: s.name, amount: s.count }))} />
                </ReportCard>
                <ReportCard title="جدول تعداد خدمات دریافت شده">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-right font-medium text-slate-500 dark:text-slate-300">نام خدمت</th>
                                    <th className="px-6 py-3 text-center font-medium text-slate-500 dark:text-slate-300">تعداد دریافت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {servicesData.map(service => (
                                    <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">{service.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-lg">{service.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ReportCard>
            </div>
        </div>
    );
};

export default ClientServicesReportPage;