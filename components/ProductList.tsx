import React from 'react';
import { Product } from '../types';

interface ProductListProps {
    products: Product[];
    onEdit?: (product: Product) => void;
    onDelete?: (productId: string) => void;
}

const EmptyState = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75l-9-5.25" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ محصول یا خدمتی ثبت نشده است</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای شروع، روی دکمه "افزودن آیتم جدید" کلیک کنید.</p>
    </div>
);


const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
    if (products.length === 0) {
        return <EmptyState />;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fa-IR').format(amount);
    };

    const getStockClass = (stock?: number) => {
        if (stock === undefined) return '';
        if (stock === 0) return 'text-red-500 dark:text-red-400';
        if (stock < 5) return 'text-yellow-500 dark:text-yellow-400';
        return 'text-slate-700 dark:text-slate-200';
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                نام
                            </th>
                             <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                موجودی
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                قیمت (تومان)
                            </th>
                             <th scope="col" className="relative px-6 py-3"><span className="sr-only">عملیات</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</div>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-bold ${getStockClass(product.stock)}`}>
                                    {product.stock !== undefined ? product.stock : '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700 dark:text-slate-200">
                                    {formatCurrency(product.price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-4 space-x-reverse">
                                    {onEdit && <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">ویرایش</button>}
                                    {onDelete && <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">حذف</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;