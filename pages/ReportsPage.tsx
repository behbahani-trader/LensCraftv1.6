import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, Product, ShareTransaction, Expense, Wastage, Customer, ThemeColor } from '../types';
import { useDb } from '../contexts/DbContext';
import { formatJalaliForDisplay } from '../db';
import { useTheme } from '../contexts/ThemeContext';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';
import { WrenchIcon, ShareIcon, ChartIcon as ProfitLossIcon, UserGroupIcon } from '../constants';

// --- Reusable Components ---

const StatCard: React.FC<{ title: string; value: string | number; color?: 'green' | 'red' | 'blue'; subtitle?: string; }> = ({ title, value, color, subtitle }) => {
    const colors = {
        blue: 'border-blue-500 dark:border-blue-400',
        green: 'border-green-500 dark:border-green-400',
        red: 'border-red-500 dark:border-red-400',
    };
    const borderColorClass = color ? colors[color] : 'border-slate-300 dark:border-slate-700/50';

    return (
        <div className={`bg-white dark:bg-slate-800/50 p-4 rounded-custom border-l-4 ${borderColorClass}`}>
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        </div>
    );
};

const ReportCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{title}</h3>
        <div className="p-4">
            {children}
        </div>
    </div>
);

const ReportTable: React.FC<{ headers: string[]; rows: (string | number)[][] }> = ({ headers, rows }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                    {headers.map((header, i) => (
                        <th key={i} className="px-6 py-3 text-right font-medium text-slate-500 dark:text-slate-300">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.length > 0 ? rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        {row.map((cell, j) => (
                            <td key={j} className="px-6 py-4 whitespace-nowrap font-mono">{cell}</td>
                        ))}
                    </tr>
                )) : <tr><td colSpan={headers.length} className="text-center p-6 text-slate-500">داده‌ای برای نمایش وجود ندارد.</td></tr>}
            </tbody>
        </table>
    </div>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};

const getJalaliMonthName = (monthNumber: number) => {
    const names = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    return names[monthNumber - 1] || '';
};

const getWeekOfMonthName = (weekNumber: number) => {
    const names = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"];
    return names[weekNumber-1] || '';
}

// --- Chart Components ---

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
};

const PIE_CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#f59e0b', '#14b8a6', '#6366f1'];

const PieChart: React.FC<{ data: { label: string; amount: number; }[] }> = ({ data }) => {
    if (data.length === 0) {
        return <p className="text-center p-8 text-slate-500 dark:text-slate-400">داده‌ای برای نمایش در نمودار وجود ندارد.</p>;
    }

    const total = data.reduce((sum, item) => sum + item.amount, 0);
    if (total === 0) {
        return <p className="text-center p-8 text-slate-500 dark:text-slate-400">مجموع داده‌ها صفر است.</p>;
    }

    let cumulativePercent = 0;
    const slices = data.map((item, index) => {
        const percent = item.amount / total;
        const startAngle = cumulativePercent * 360;
        const endAngle = (cumulativePercent + percent) * 360;
        cumulativePercent += percent;

        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const x1 = 50 + 40 * Math.cos(Math.PI * ((startAngle - 90)/ 180));
        const y1 = 50 + 40 * Math.sin(Math.PI * ((startAngle - 90) / 180));
        const x2 = 50 + 40 * Math.cos(Math.PI * ((endAngle - 90) / 180));
        const y2 = 50 + 40 * Math.sin(Math.PI * ((endAngle - 90) / 180));

        return {
            d: `M50,50 L${x1},${y1} A40,40 0 ${largeArcFlag},1 ${x2},${y2} Z`,
            color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
            label: item.label,
            percent: Math.round(percent * 100)
        };
    });

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-48 h-48 flex-shrink-0">
                {slices.map((slice, index) => (
                    <path key={index} d={slice.d} fill={slice.color} />
                ))}
            </svg>
            <div className="w-full space-y-2">
                {slices.map((slice, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></span>
                            <span className="text-slate-700 dark:text-slate-200">{slice.label}</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{slice.percent}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LineChart: React.FC<{ data: { label: string; revenue: number; costs: number }[] }> = ({ data }) => {
    if (data.length === 0) return <p className="text-center p-8 text-slate-500 dark:text-slate-400">داده‌ای برای نمایش در نمودار وجود ندارد.</p>;

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const maxCosts = Math.max(...data.map(d => d.costs));
    const maxValue = Math.max(maxRevenue, maxCosts, 0);

    const getPath = (key: 'revenue' | 'costs') => {
        if (data.length < 1) return "";
        const points = data.map((d, i) => {
            const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
            const y = 100 - (maxValue > 0 ? (d[key] / maxValue) * 100 : 0);
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    return (
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700 relative h-72">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <path d={getPath('revenue')} fill="none" stroke="#2563eb" strokeWidth="1.5" />
                <path d={getPath('costs')} fill="none" stroke="#ef4444" strokeWidth="1.5" />
            </svg>
             <div className="absolute top-2 right-2 text-xs flex gap-4">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span>درآمد</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm"></span>هزینه</span>
            </div>
        </div>
    );
};

const PeriodButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => {
    const { themeSettings } = useTheme();
    const colorClasses = {
        blue: 'bg-blue-600 text-white',
        red: 'bg-red-600 text-white',
        green: 'bg-green-600 text-white',
        purple: 'bg-purple-600 text-white',
        orange: 'bg-orange-600 text-white',
    };
    
    const activeClasses = colorClasses[themeSettings.color];
    const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700';

    return (
        <button
            onClick={onClick}
            className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors duration-200 ${active ? activeClasses : inactiveClasses}`}
        >
            {label}
        </button>
    );
};

// --- Report Specific Components ---

const VisualSummary: React.FC<{ allData: { invoices: Invoice[]; expenses: Expense[]; wastages: Wastage[] } }> = ({ allData }) => {
    const { invoices, expenses, wastages } = allData;

    const { totalRevenue, totalCosts, netProfit } = useMemo(() => {
        const revenue = invoices.filter(i => i.invoiceType === 'sale').reduce((sum, i) => sum + i.totalAmount, 0);
        const costOfGoods = invoices.filter(i => i.invoiceType === 'purchase').reduce((sum, i) => sum + i.totalAmount, 0);
        const wastageCosts = wastages.reduce((sum, w) => sum + w.totalCost, 0);
        const generalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const costs = costOfGoods + wastageCosts + generalExpenses;
        const profit = revenue - costs;
        return { totalRevenue: revenue, totalCosts: costs, netProfit: profit };
    }, [invoices, expenses, wastages]);

    const monthlySalesChartData = useMemo(() => {
        const salesMap = new Map<string, number>();
        invoices.filter(i => i.invoiceType === 'sale').forEach(i => {
            const monthKey = i.issueDate.substring(0, 7);
            salesMap.set(monthKey, (salesMap.get(monthKey) || 0) + i.totalAmount);
        });
        return Array.from(salesMap.entries())
            .map(([month, amount]) => ({ label: `${getJalaliMonthName(parseInt(month.substring(5,7),10))} ${month.substring(0,4)}`, amount }))
            .sort((a,b) => a.label.localeCompare(b.label));
    }, [invoices]);

    const topServicesData = useMemo(() => {
        const servicesMap = new Map<string, number>();
        invoices.forEach(i => {
            i.items.forEach(item => {
                if(item.type === 'service') {
                    servicesMap.set(item.name, (servicesMap.get(item.name) || 0) + (item.quantity * item.unitPrice));
                }
            })
        });
        return Array.from(servicesMap.entries())
            .map(([label, amount]) => ({ label, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5); // Take top 5
    }, [invoices]);
    
    const expenseCategoriesData = useMemo(() => {
        const expensesMap = new Map<string, number>();
        expenses.forEach(e => {
            expensesMap.set(e.category, (expensesMap.get(e.category) || 0) + e.amount);
        });
         return Array.from(expensesMap.entries())
            .map(([label, amount]) => ({ label, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [expenses]);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="درآمد کل" value={`${formatCurrency(totalRevenue)} تومان`} color="green" />
                <StatCard title="هزینه کل" value={`${formatCurrency(totalCosts)} تومان`} color="red" />
                <StatCard title="سود خالص" value={`${formatCurrency(netProfit)} تومان`} color={netProfit >= 0 ? 'blue' : 'red'} />
            </div>
            <ReportCard title="نمودار فروش ماهانه">
                <BarChart data={monthlySalesChartData} />
            </ReportCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <ReportCard title="درآمد بر اساس خدمات">
                    <PieChart data={topServicesData} />
                </ReportCard>
                 <ReportCard title="هزینه‌ها بر اساس دسته‌بندی">
                    <PieChart data={expenseCategoriesData} />
                </ReportCard>
            </div>
        </div>
    );
};


const ServicesReport: React.FC<{ invoices: Invoice[]; services: Product[] }> = ({ invoices, services }) => {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        selectedServices: [] as string[],
        minCount: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceSelectionChange = (serviceId: string, isChecked: boolean) => {
        setFilters(prev => {
            const newSelectedServices = isChecked
                ? [...prev.selectedServices, serviceId]
                : prev.selectedServices.filter(id => id !== serviceId);
            return { ...prev, selectedServices: newSelectedServices };
        });
    };

    const resetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            selectedServices: [],
            minCount: '',
        });
    };

    const servicesData = useMemo(() => {
        let filteredInvoices = invoices;
        if (filters.startDate) {
            filteredInvoices = filteredInvoices.filter(inv => inv.issueDate >= filters.startDate);
        }
        if (filters.endDate) {
            filteredInvoices = filteredInvoices.filter(inv => inv.issueDate <= filters.endDate);
        }

        const serviceCounts = new Map<string, { id: string; name: string; count: number }>();
        filteredInvoices.forEach(invoice => {
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

        let result = Array.from(serviceCounts.values());

        if (filters.selectedServices.length > 0) {
            result = result.filter(service => filters.selectedServices.includes(service.id));
        }

        if (filters.minCount) {
            const min = parseInt(filters.minCount, 10);
            if (!isNaN(min) && min > 0) {
                result = result.filter(service => service.count >= min);
            }
        }

        result.sort((a, b) => b.count - a.count);
        return result;
    }, [invoices, filters]);
    
    const hasActiveFilters = filters.startDate || filters.endDate || filters.selectedServices.length > 0 || filters.minCount;
    
    const NoServicesDataState = () => (
         <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
            <WrenchIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ خدمتی ثبت نشده است</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای مشاهده گزارش، ابتدا باید خدماتی را در فاکتورها ثبت کنید.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">از تاریخ</label>
                        <input id="startDate" name="startDate" type="text" placeholder="مثال: ۱۴۰۳/۰۱/۰۱" value={filters.startDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50"/>
                    </div>
                     <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تا تاریخ</label>
                        <input id="endDate" name="endDate" type="text" placeholder="مثال: ۱۴۰۳/۱۲/۲۹" value={filters.endDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50"/>
                    </div>
                    <div>
                        <label htmlFor="minCount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">حداقل تعداد</label>
                        <input id="minCount" name="minCount" type="number" placeholder="مثال: 5" value={filters.minCount} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50"/>
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">فیلتر بر اساس نوع خدمات</label>
                    <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900/50 rounded-custom border border-slate-200 dark:border-slate-700">
                        {services.length > 0 ? (
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {services.map(service => (
                                    <label key={service.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedServices.includes(service.id)}
                                            onChange={e => handleServiceSelectionChange(service.id, e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300">{service.name}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-center text-slate-500 dark:text-slate-400">هیچ خدمتی برای فیلتر کردن تعریف نشده است.</p>
                        )}
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-4 flex items-center justify-end">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors"
                        >
                            حذف فیلترها
                        </button>
                    </div>
                )}
            </div>
            
            {servicesData.length > 0 ? (
                <ReportCard title="جدول تعداد خدمات انجام شده">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-right font-medium text-slate-500 dark:text-slate-300">نام خدمت</th>
                                    <th className="px-6 py-3 text-center font-medium text-slate-500 dark:text-slate-300">تعداد انجام</th>
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
            ) : hasActiveFilters ? (
                <SearchEmptyState />
            ) : (
                <NoServicesDataState />
            )}
        </div>
    );
};

const SharesReport: React.FC<{ shares: ShareTransaction[] }> = ({ shares }) => {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'total'>('monthly');

    const processedData = useMemo(() => {
        if (!shares || shares.length === 0) return [];
        
        const dataMap = new Map<string, { amount: number; count: number }>();
        const labelMap = new Map<string, string>();

        shares.forEach(share => {
            let key = '';
            let label = '';
            const year = share.date.substring(0, 4);
            const month = parseInt(share.date.substring(5, 7), 10);
            const day = parseInt(share.date.substring(8, 10), 10);

            switch (period) {
                case 'daily':
                    key = share.date;
                    label = formatJalaliForDisplay(share.date);
                    break;
                case 'weekly': {
                    const weekOfMonth = Math.floor((day - 1) / 7) + 1;
                    key = `${year}/${String(month).padStart(2, '0')}-W${weekOfMonth}`;
                    label = `هفته ${getWeekOfMonthName(weekOfMonth)} ${getJalaliMonthName(month)} ${year}`;
                    break;
                }
                case 'monthly':
                    key = share.date.substring(0, 7);
                    label = `${getJalaliMonthName(month)} ${year}`;
                    break;
                case 'total':
                    key = 'total';
                    label = 'مجموع کل';
                    break;
            }

            if(key) {
                const existing = dataMap.get(key) || { amount: 0, count: 0 };
                existing.amount += share.amount;
                existing.count += 1;
                dataMap.set(key, existing);
                if (!labelMap.has(key)) {
                    labelMap.set(key, label);
                }
            }
        });
        
        if (period === 'total' && dataMap.has('total')) {
             const totalData = dataMap.get('total')!;
             return [{ key: 'total', label: 'مجموع کل', amount: totalData.amount, count: totalData.count }];
        }

        return Array.from(dataMap.entries())
            .map(([key, value]) => ({ key, label: labelMap.get(key) || '', amount: value.amount, count: value.count }))
            .sort((a, b) => a.key.localeCompare(b.key));
            
    }, [shares, period]);
    
    const SharesEmptyState = () => (
         <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
            <ShareIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ سهمی برای گزارش‌گیری وجود ندارد</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای مشاهده گزارش، ابتدا باید خدماتی را در فاکتورها ثبت کرده باشید.</p>
        </div>
    );

    if (shares.length === 0) {
        return <SharesEmptyState />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-custom">
                <PeriodButton label="روزانه" active={period === 'daily'} onClick={() => setPeriod('daily')} />
                <PeriodButton label="هفتگی" active={period === 'weekly'} onClick={() => setPeriod('weekly')} />
                <PeriodButton label="ماهانه" active={period === 'monthly'} onClick={() => setPeriod('monthly')} />
                <PeriodButton label="کل" active={period === 'total'} onClick={() => setPeriod('total')} />
            </div>

            <ReportCard title="جدول درآمد سهام اصلی">
                 <ReportTable 
                    headers={['بازه زمانی', 'تعداد', 'مبلغ کل']}
                    rows={processedData.map(d => [d.label, d.count, `${formatCurrency(d.amount)} تومان`])}
                />
            </ReportCard>
        </div>
    );
}

const ProfitAndLossReport: React.FC<{ allData: { invoices: Invoice[]; expenses: Expense[]; wastages: Wastage[] } }> = ({ allData }) => {
    const { invoices, expenses, wastages } = allData;
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => setFilters({ startDate: '', endDate: '' });

    const reportData = useMemo(() => {
        const filteredInvoices = invoices.filter(i => (!filters.startDate || i.issueDate >= filters.startDate) && (!filters.endDate || i.issueDate <= filters.endDate));
        const filteredExpenses = expenses.filter(e => (!filters.startDate || e.date >= filters.startDate) && (!filters.endDate || e.date <= filters.endDate));
        const filteredWastages = wastages.filter(w => (!filters.startDate || w.date >= filters.startDate) && (!filters.endDate || w.date <= filters.endDate));
        
        const totalRevenue = filteredInvoices.filter(i => i.invoiceType === 'sale').reduce((sum, i) => sum + i.totalAmount, 0);
        const costOfGoods = filteredInvoices.filter(i => i.invoiceType === 'purchase').reduce((sum, i) => sum + i.totalAmount, 0);
        const wastageCosts = filteredWastages.reduce((sum, w) => sum + w.totalCost, 0);
        const generalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalCosts = costOfGoods + wastageCosts + generalExpenses;
        const netProfit = totalRevenue - totalCosts;

        return { totalRevenue, costOfGoods, wastageCosts, generalExpenses, totalCosts, netProfit };
    }, [invoices, expenses, wastages, filters]);
    
    const NoData = () => (
         <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
            <ProfitLossIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ داده مالی برای گزارش‌گیری وجود ندارد</h3>
        </div>
    );
    if (invoices.length === 0 && expenses.length === 0 && wastages.length === 0) return <NoData />;

    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">از تاریخ</label>
                        <input id="startDate" name="startDate" type="text" placeholder="مثال: ۱۴۰۳/۰۱/۰۱" value={filters.startDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-slate-50 dark:bg-slate-700/50"/>
                    </div>
                     <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تا تاریخ</label>
                        <input id="endDate" name="endDate" type="text" placeholder="مثال: ۱۴۰۳/۱۲/۲۹" value={filters.endDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-slate-50 dark:bg-slate-700/50"/>
                    </div>
                    {(filters.startDate || filters.endDate) && <button onClick={resetFilters} className="h-10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">حذف فیلترها</button>}
                </div>
             </div>
             <ReportCard title="خلاصه سود و زیان">
                 <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center text-sm"><span>درآمد کل از فروش</span> <span className="font-mono">{formatCurrency(reportData.totalRevenue)}</span></div>
                    <div className="flex justify-between items-center text-sm"><span>هزینه خرید محصولات</span> <span className="font-mono text-red-500">({formatCurrency(reportData.costOfGoods)})</span></div>
                    <div className="flex justify-between items-center text-sm"><span>هزینه ضایعات</span> <span className="font-mono text-red-500">({formatCurrency(reportData.wastageCosts)})</span></div>
                    <div className="flex justify-between items-center text-sm"><span>هزینه‌های عمومی</span> <span className="font-mono text-red-500">({formatCurrency(reportData.generalExpenses)})</span></div>
                    <div className="flex justify-between items-center text-base font-bold pt-2 border-t mt-2"><span>سود خالص</span> <span className="font-mono">{formatCurrency(reportData.netProfit)}</span></div>
                 </div>
             </ReportCard>
        </div>
    );
}

const TopCustomersReport: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const customersData = useMemo(() => {
        const customerStats = new Map<string, { totalSpent: number; invoiceCount: number; name: string }>();

        invoices.forEach(inv => {
            if (inv.invoiceType === 'sale' && inv.customerId) {
                const existing = customerStats.get(inv.customerId) || { totalSpent: 0, invoiceCount: 0, name: inv.customerName };
                existing.totalSpent += inv.totalAmount;
                existing.invoiceCount += 1;
                customerStats.set(inv.customerId, existing);
            }
        });
        
        let result = Array.from(customerStats.values());
        
        if (searchTerm) {
            result = result.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return result.sort((a, b) => b.totalSpent - a.totalSpent);
    }, [invoices, searchTerm]);
    
    if (invoices.filter(i => i.invoiceType === 'sale').length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هنوز فاکتور فروشی ثبت نشده است</h3>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="w-full max-w-sm">
                <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="جستجوی نام مشتری..." />
            </div>
            {customersData.length > 0 ? (
                <>
                    <ReportCard title="نمودار مشتریان برتر">
                        <BarChart data={customersData.slice(0, 10).map(c => ({ label: c.name, amount: c.totalSpent }))} />
                    </ReportCard>
                    <ReportCard title="لیست مشتریان بر اساس بیشترین خرید">
                        <ReportTable 
                            headers={['رتبه', 'نام مشتری', 'تعداد فاکتور', 'مبلغ کل خرید']}
                            rows={customersData.map((cust, index) => [
                                index + 1,
                                cust.name,
                                cust.invoiceCount,
                                `${formatCurrency(cust.totalSpent)} تومان`
                            ])}
                        />
                    </ReportCard>
                </>
            ) : (
                <SearchEmptyState />
            )}
        </div>
    );
};

// --- Main Reports Page Component ---

const ReportsPage: React.FC = () => {
    const db = useDb();
    const [allData, setAllData] = useState<{
        invoices: Invoice[],
        services: Product[],
        shares: ShareTransaction[],
        expenses: Expense[],
        wastages: Wastage[],
    } | null>(null);
    
    const [activeTab, setActiveTab] = useState<'visual-summary' | 'services' | 'shares' | 'profit-loss' | 'top-customers'>('visual-summary');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invoices, products, shares, expenses, wastages] = await Promise.all([
                    db.invoices.toArray(),
                    db.products.toArray(),
                    db.shares.toArray(),
                    db.expenses.toArray(),
                    db.wastages.toArray(),
                ]);
                
                const services = products.filter(p => p.type === 'service');
                
                setAllData({ invoices, services, shares, expenses, wastages });
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            }
        };

        fetchData();
    }, [db]);

    const TabButton: React.FC<{ name: string; active: boolean; onClick: () => void; }> = ({ name, active, onClick }) => {
        const { themeSettings } = useTheme();
        const activeClasses: Record<ThemeColor, string> = {
            blue: 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400',
            red: 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400',
            green: 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400',
            purple: 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400',
            orange: 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400',
        };
        
        return (
            <button
                onClick={onClick}
                className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                    ${active
                        ? activeClasses[themeSettings.color]
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                    }`}
            >
                {name}
            </button>
        );
    };

    if (!allData) {
        return <div>در حال بارگذاری گزارشات...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex flex-wrap gap-6" aria-label="Tabs">
                    <TabButton name="خلاصه تصویری" active={activeTab === 'visual-summary'} onClick={() => setActiveTab('visual-summary')} />
                    <TabButton name="سود و زیان" active={activeTab === 'profit-loss'} onClick={() => setActiveTab('profit-loss')} />
                    <TabButton name="مشتریان برتر" active={activeTab === 'top-customers'} onClick={() => setActiveTab('top-customers')} />
                    <TabButton name="خدمات پرفروش" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
                    <TabButton name="درآمد سهام" active={activeTab === 'shares'} onClick={() => setActiveTab('shares')} />
                </nav>
            </div>
            
            <div className="mt-6">
                {activeTab === 'visual-summary' && <VisualSummary allData={{ invoices: allData.invoices, expenses: allData.expenses, wastages: allData.wastages }} />}
                {activeTab === 'services' && <ServicesReport invoices={allData.invoices} services={allData.services} />}
                {activeTab === 'shares' && <SharesReport shares={allData.shares} />}
                {activeTab === 'profit-loss' && <ProfitAndLossReport allData={{ invoices: allData.invoices, expenses: allData.expenses, wastages: allData.wastages }} />}
                {activeTab === 'top-customers' && <TopCustomersReport invoices={allData.invoices} />}
            </div>
        </div>
    );
};

export default ReportsPage;
