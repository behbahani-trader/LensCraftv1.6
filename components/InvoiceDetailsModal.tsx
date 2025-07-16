import React from 'react';
import { Invoice } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { formatJalaliForDisplay } from '../db';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ isOpen, onClose, invoice }) => {
    const { themeSettings } = useTheme();

    if (!isOpen || !invoice) return null;

    const subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const costsTotal = invoice.costItems?.reduce((acc, item) => acc + item.amount, 0) || 0;
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        red: 'bg-red-600 hover:bg-red-700',
        green: 'bg-green-600 hover:bg-green-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
    };
    const themeColorClass = colorClasses[themeSettings.color];


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        جزئیات فاکتور شماره: <span className="font-mono">{invoice.invoiceNumber}</span>
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        صادر شده در تاریخ {formatJalaliForDisplay(invoice.issueDate)} برای {invoice.customerName}
                    </p>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Items Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-2 text-right font-medium">#</th>
                                    <th className="p-2 text-right font-medium">شرح</th>
                                    <th className="p-2 text-right font-medium">تعداد</th>
                                    <th className="p-2 text-right font-medium">قیمت واحد</th>
                                    <th className="p-2 text-left font-medium">جمع کل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {invoice.items.map((item, index) => (
                                    <tr key={item.productId + index}>
                                        <td className="p-2 text-slate-500 dark:text-slate-400">{index + 1}</td>
                                        <td className="p-2 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                                        <td className="p-2 font-mono text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                        <td className="p-2 font-mono text-slate-600 dark:text-slate-300">{formatCurrency(item.unitPrice)}</td>
                                        <td className="p-2 text-left font-mono text-slate-800 dark:text-slate-200">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                    </tr>
                                ))}
                                {(invoice.costItems && invoice.costItems.length > 0) && invoice.costItems.map((item, index) => (
                                    <tr key={item.costId} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-2 text-slate-500 dark:text-slate-400">{invoice.items.length + index + 1}</td>
                                        <td className="p-2 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                                        <td className="p-2 font-mono text-slate-600 dark:text-slate-300">-</td>
                                        <td className="p-2 font-mono text-slate-600 dark:text-slate-300">-</td>
                                        <td className="p-2 text-left font-mono text-slate-800 dark:text-slate-200">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                       <div className="w-full max-w-sm space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400">جمع جزء:</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(subtotal)} تومان</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <span className="text-slate-500 dark:text-slate-400">هزینه‌ها:</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(costsTotal)} تومان</span>
                         </div>
                         {invoice.discount && invoice.discount > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400">تخفیف:</span>
                                <span className="font-mono font-semibold text-red-500">({formatCurrency(invoice.discount)}) تومان</span>
                            </div>
                         )}
                         <div className="flex justify-between items-center font-bold text-base border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">
                             <span className="text-slate-800 dark:text-slate-100">جمع کل:</span>
                            <span className="font-mono text-slate-900 dark:text-slate-50">{formatCurrency(invoice.totalAmount)} تومان</span>
                         </div>
                       </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 flex justify-end gap-3 rounded-b-custom">
                    <button onClick={onClose} className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${themeColorClass}`}>بستن</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailsModal;