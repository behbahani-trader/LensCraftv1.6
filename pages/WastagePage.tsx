
import React, { useState, useEffect, useMemo } from 'react';
import { Wastage, BoxType } from '../types';
import { useDb } from '../contexts/DbContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AddWastageModal from '../components/AddWastageModal';
import WastageList, { EmptyState } from '../components/WastageList';
import SearchableSelect from '../components/SearchableSelect';
import SearchEmptyState from '../components/SearchEmptyState';

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
);

const WastagePage: React.FC = () => {
    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();
    const db = useDb();
    const [wastages, setWastages] = useState<Wastage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        title: '',
        boxType: 'all' as BoxType | 'all',
    });

    const fetchData = async () => {
        try {
            const wastagesData = await db.wastages.orderBy('date').reverse().toArray();
            setWastages(wastagesData);
        } catch (error) {
            console.error("Failed to fetch wastage data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [db]);

    const filteredWastages = useMemo(() => {
        let filtered = [...wastages];
        if (filters.startDate) {
            filtered = filtered.filter(w => w.date >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(w => w.date <= filters.endDate);
        }
        if (filters.title) {
            filtered = filtered.filter(w => w.title.toLowerCase().includes(filters.title.toLowerCase()));
        }
        if (filters.boxType !== 'all') {
            filtered = filtered.filter(w => w.boxType === filters.boxType);
        }
        return filtered;
    }, [wastages, filters]);
    
    const uniqueTitlesForFilter = useMemo(() => {
        const titles = new Set(wastages.map(w => w.title));
        return [...titles];
    }, [wastages]);

    const stats = useMemo(() => {
        const totalCost = filteredWastages.reduce((sum, item) => sum + item.totalCost, 0);
        return { totalCost };
    }, [filteredWastages]);
    
    const handleDelete = async (wastageId: string, transactionId: string) => {
        if (window.confirm("آیا از حذف این مورد ضایعاتی و تراکنش مالی مرتبط با آن مطمئن هستید؟")) {
            try {
                await db.transaction('rw', db.wastages, db.cashTransactions, async () => {
                    await db.wastages.delete(wastageId);
                    await db.cashTransactions.delete(transactionId);
                });
                fetchData();
            } catch (error) {
                console.error("Failed to delete wastage record:", error);
                alert("خطا در حذف رکورد ضایعات.");
            }
        }
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', title: '', boxType: 'all' });
    };

    const hasActiveFilters = filters.startDate || filters.endDate || filters.title || filters.boxType !== 'all';

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">مدیریت و گزارش ضایعات</h1>
                 {hasPermission('page:wastage:create') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                    >
                        ثبت ضایعات جدید
                    </button>
                 )}
            </div>
            
            <StatCard title="مجموع هزینه ضایعات (بر اساس فیلتر)" value={`${formatCurrency(stats.totalCost)} تومان`} />

            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="w-full">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">از تاریخ</label>
                        <input name="startDate" type="text" placeholder="مثال: ۱۴۰۳/۰۱/۰۱" value={filters.startDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"/>
                    </div>
                    <div className="w-full">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تا تاریخ</label>
                        <input name="endDate" type="text" placeholder="مثال: ۱۴۰۳/۱۲/۲۹" value={filters.endDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">جستجو در عنوان</label>
                        <input name="title" type="text" placeholder="مثال: شکستگی" value={filters.title} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"/>
                    </div>
                    <div>
                        <label htmlFor="boxType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">صندوق</label>
                        <select id="boxType" name="boxType" value={filters.boxType} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
                            <option value="all">همه صندوق‌ها</option>
                            <option value="main">اصلی</option>
                            <option value="vip">VIP</option>
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
            
            <div className="mt-6">
                {filteredWastages.length > 0 ? (
                    <WastageList wastages={filteredWastages} onDelete={hasPermission('page:wastage:delete') ? handleDelete : undefined} />
                ) : hasActiveFilters ? (
                    <SearchEmptyState />
                ) : (
                    <EmptyState />
                )}
            </div>

            <AddWastageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchData();
                }}
            />
        </div>
    );
};

export default WastagePage;
