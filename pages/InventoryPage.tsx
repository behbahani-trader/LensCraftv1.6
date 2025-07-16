
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { useDb } from '../contexts/DbContext';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';
import { ArchiveBoxIcon } from '../constants';

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
);

const InventoryPage: React.FC = () => {
    const db = useDb();
    const [products, setProducts] = useState<Product[]>([]);
    const [filters, setFilters] = useState({
        searchTerm: '',
        stockStatus: 'all' as 'all' | 'inStock' | 'lowStock' | 'outOfStock'
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            setIsLoading(true);
            try {
                const productData = await db.products.where('type').equals('product').toArray();
                setProducts(productData);
            } catch (error) {
                console.error("Failed to fetch inventory data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInventory();
    }, [db]);

    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        if (filters.searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(filters.searchTerm.toLowerCase()));
        }

        switch (filters.stockStatus) {
            case 'inStock':
                filtered = filtered.filter(p => (p.stock || 0) >= 5);
                break;
            case 'lowStock':
                filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5);
                break;
            case 'outOfStock':
                filtered = filtered.filter(p => (p.stock || 0) === 0);
                break;
            default: // 'all'
                break;
        }

        return filtered;
    }, [products, filters]);

    const stats = useMemo(() => {
        const totalValue = products.reduce((sum, p) => sum + (p.stock || 0) * p.price, 0);
        const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
        const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5).length;
        return {
            productCount: products.length,
            totalValue,
            outOfStockCount,
            lowStockCount
        };
    }, [products]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };

    const getStockClass = (stock?: number) => {
        if (stock === undefined) return '';
        if (stock === 0) return 'text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-300';
        if (stock < 5) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300';
        return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300';
    };

    if (isLoading) {
        return <div className="text-center p-8">در حال بارگذاری اطلاعات انبار...</div>;
    }

    const hasActiveFilters = filters.searchTerm || filters.stockStatus !== 'all';

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">گزارش موجودی انبار</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="تعداد کل محصولات" value={stats.productCount} />
                <StatCard title="ارزش کل انبار (تومان)" value={formatCurrency(stats.totalValue)} />
                <StatCard title="محصولات ناموجود" value={stats.outOfStockCount} />
                <StatCard title="محصولات رو به اتمام" value={stats.lowStockCount} />
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchInput 
                        value={filters.searchTerm}
                        onChange={e => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
                        placeholder="جستجوی نام محصول..."
                    />
                    <div>
                        <label htmlFor="stockStatus" className="sr-only">وضعیت موجودی</label>
                        <select id="stockStatus" name="stockStatus" value={filters.stockStatus} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="inStock">موجود</option>
                            <option value="lowStock">رو به اتمام</option>
                            <option value="outOfStock">ناموجود</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredProducts.length > 0 ? (
                <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                             <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">نام محصول</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">موجودی فعلی</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">قیمت واحد</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">ارزش کل موجودی</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold">
                                            <span className={`px-2 py-1 rounded-full ${getStockClass(p.stock)}`}>
                                                {p.stock !== undefined ? p.stock : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">{formatCurrency(p.price)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-800 dark:text-slate-100">{formatCurrency((p.stock || 0) * p.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : hasActiveFilters ? (
                <SearchEmptyState />
            ) : (
                <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-dashed border-slate-300 dark:border-slate-700">
                    <ArchiveBoxIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ محصولی ثبت نشده است</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، از بخش تعاریف یک محصول جدید اضافه کنید.</p>
                </div>
            )}
        </div>
    );
};
export default InventoryPage;
