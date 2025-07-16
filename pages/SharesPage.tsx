
import React, { useState, useEffect, useMemo } from 'react';
import { ShareTransaction, Customer, Product } from '../types';
import { useDb } from '../contexts/DbContext';
import { formatJalaliForDisplay } from '../db';
import { ShareIcon } from '../constants';
import SearchableSelect from '../components/SearchableSelect';
import SearchEmptyState from '../components/SearchEmptyState';

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
);

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <ShareIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ سهمی ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">وقتی خدماتی در فاکتورها ثبت شود، سهام مربوط به آن در اینجا نمایش داده می‌شود.</p>
    </div>
);


const SharesTable: React.FC<{ transactions: ShareTransaction[] }> = ({ transactions }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">تاریخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">شماره فاکتور</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مشتری</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">نام خدمت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مبلغ سهم</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatJalaliForDisplay(t.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{t.invoiceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">{t.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-100">{t.serviceName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-600">{formatCurrency(t.amount)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


export const SharesPage: React.FC = () => {
    const db = useDb();
    const [allShares, setAllShares] = useState<ShareTransaction[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [services, setServices] = useState<Product[]>([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        customerId: '',
        serviceId: '',
    });
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sharesData, customersData, servicesData] = await Promise.all([
                    db.shares.orderBy('date').reverse().toArray(),
                    db.customers.toArray(),
                    db.products.where('type').equals('service').toArray()
                ]);
                setAllShares(sharesData);
                setCustomers(customersData);
                setServices(servicesData);
            } catch (error) {
                console.error("Failed to fetch shares page data:", error);
            }
        };
        fetchData();
    }, [db]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerChange = (customer: Customer | null) => {
        setFilters(prev => ({ ...prev, customerId: customer ? customer.id : '' }));
    };
    
    const handleServiceChange = (service: Product | null) => {
        setFilters(prev => ({ ...prev, serviceId: service ? service.id : '' }));
    };

    const resetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            customerId: '',
            serviceId: '',
        });
    };

    const filteredShares = useMemo(() => {
        let filtered = [...allShares];
        
        if (filters.startDate) {
            filtered = filtered.filter(share => share.date >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(share => share.date <= filters.endDate);
        }
        if (filters.customerId) {
            filtered = filtered.filter(share => share.customerId === filters.customerId);
        }
        if (filters.serviceId) {
            filtered = filtered.filter(share => share.serviceId === filters.serviceId);
        }

        return filtered;
    }, [allShares, filters]);


    const { mainShares, commissionShares, totalMain, totalCommission } = useMemo(() => {
        const main = filteredShares.filter(s => s.shareType === 'main');
        const commission = filteredShares.filter(s => s.shareType === 'commission');
        
        const totalMain = main.reduce((sum, s) => sum + s.amount, 0);
        const totalCommission = commission.reduce((sum, s) => sum + s.amount, 0);

        return {
            mainShares: main,
            commissionShares: commission,
            totalMain: totalMain,
            totalCommission: totalCommission
        };
    }, [filteredShares]);

    const hasActiveFilters = filters.startDate || filters.endDate || filters.customerId || filters.serviceId;

    if (allShares.length === 0 && !hasActiveFilters) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">گزارش سهام</h1>
            
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">از تاریخ</label>
                        <input id="startDate" name="startDate" type="text" placeholder="مثال: ۱۴۰۳/۰۱/۰۱" value={filters.startDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تا تاریخ</label>
                        <input id="endDate" name="endDate" type="text" placeholder="مثال: ۱۴۰۳/۱۲/۲۹" value={filters.endDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50"/>
                    </div>
                    <SearchableSelect
                        label="مشتری"
                        options={customers}
                        value={customers.find(c => c.id === filters.customerId) || null}
                        onChange={handleCustomerChange}
                        getOptionLabel={(c: Customer) => `${c.firstName} ${c.lastName}`}
                        getOptionValue={(c: Customer) => c.id}
                        placeholder="جستجوی مشتری..."
                    />
                     <SearchableSelect
                        label="خدمت"
                        options={services}
                        value={services.find(s => s.id === filters.serviceId) || null}
                        onChange={handleServiceChange}
                        getOptionLabel={(s: Product) => s.name}
                        getOptionValue={(s: Product) => s.id}
                        placeholder="جستجوی خدمت..."
                    />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="مجموع سهام اصلی" value={`${formatCurrency(totalMain)} تومان`} />
                <StatCard title="مجموع سهام کارمزد" value={`${formatCurrency(totalCommission)} تومان`} />
            </div>

            {filteredShares.length > 0 ? (
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                            لیست تراکنش‌های سهام اصلی
                        </h3>
                        {mainShares.length > 0 ? (
                            <SharesTable transactions={mainShares} />
                        ) : (
                            <p className="text-center p-8 text-slate-500 dark:text-slate-400">تراکنشی برای سهام اصلی یافت نشد.</p>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                            لیست تراکنش‌های سهام کارمزد
                        </h3>
                        {commissionShares.length > 0 ? (
                            <SharesTable transactions={commissionShares} />
                        ) : (
                            <p className="text-center p-8 text-slate-500 dark:text-slate-400">تراکنشی برای سهام کارمزد یافت نشد.</p>
                        )}
                    </div>
                </div>
            ) : hasActiveFilters ? (
                <SearchEmptyState />
            ) : (
                // This case is for when there are no shares at all, even before filtering
                // The main check at the top of the component handles this now
                <div />
            )}
        </div>
    );
};
