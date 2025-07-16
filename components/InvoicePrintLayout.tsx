import React from 'react';
import { Invoice, Customer } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { formatJalaliForDisplay } from '../db';
import { AppLogo, PrintIcon, ArrowRightIcon } from '../constants';

interface InvoicePrintLayoutProps {
  invoice: Invoice;
  onBack: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};


const InvoicePrintLayout: React.FC<InvoicePrintLayoutProps> = ({ invoice, onBack }) => {
    const { themeSettings, printSettings } = useTheme();

    const handlePrint = () => {
        window.print();
    };
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];

    const subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const costsTotal = invoice.costItems?.reduce((acc, item) => acc + item.amount, 0) || 0;
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = invoice.totalAmount - paidAmount;

    let paymentStatus: string;
    if (balanceDue <= 0) {
        paymentStatus = 'پرداخت شده';
    } else if (paidAmount > 0) {
        paymentStatus = 'پرداخت ناقص';
    } else {
        paymentStatus = 'پرداخت نشده';
    }

    const isPurchase = invoice.invoiceType === 'purchase';
    const defaultTitle = isPurchase ? 'فاکتور خرید' : 'فاکتور فروش';
    const title = printSettings.invoiceTitle || defaultTitle;
    const partyLabel = isPurchase ? 'صورتحساب از:' : 'صورتحساب برای:';
    const partyName = invoice.customerName;

    const paperSizeClasses = {
        A4: 'w-[210mm] min-h-[297mm]',
        A5: 'w-[148mm] min-h-[210mm]'
    };
    const paperSize = printSettings.paperSize || 'A4';
    
    const fontSizeClasses = {
        sm: 'text-xs',
        base: 'text-sm',
        lg: 'text-base'
    };
    const fontSize = printSettings.fontSize || 'base';

    return (
        <div>
            <div className="mb-6 flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">پیش‌نمایش چاپ</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                        <ArrowRightIcon className="w-4 h-4" />
                        <span>بازگشت</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors ${themeColorClass}`}
                    >
                        <PrintIcon className="w-4 h-4" />
                        <span>چاپ فاکتور</span>
                    </button>
                </div>
            </div>

            <div id="invoice-print-area" className={`bg-white text-black p-10 font-iransans ${fontSizeClasses[fontSize]}`} dir="rtl">
                <div className={`${paperSizeClasses[paperSize]} mx-auto p-8 flex flex-col`}>
                    {/* Header */}
                    <header className="flex justify-between items-start pb-4 border-b-2 border-slate-700">
                        <div className="flex items-center gap-4">
                           {printSettings.logo ? (
                                <img src={printSettings.logo} alt="لوگوی کسب‌وکار" className="w-16 h-16 object-contain" />
                            ) : (
                                <AppLogo className="w-16 h-16 text-slate-800" />
                            )}
                            <h1 className="text-3xl font-bold">{title}</h1>
                        </div>
                        <div className="text-left">
                            <h2 className="text-base font-bold">{printSettings.businessName}</h2>
                            <p>{printSettings.businessAddress}</p>
                            <p>تلفن: {printSettings.businessPhone}</p>
                            <p>{printSettings.businessEmail}</p>
                        </div>
                    </header>
                    
                    {/* Invoice & Customer/Supplier Details */}
                    <section className="grid grid-cols-2 gap-8 mt-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold border-b border-slate-300 pb-1 mb-2">{partyLabel}</h3>
                            <p className="font-bold">{partyName}</p>
                        </div>
                        <div className="space-y-1 text-left">
                            <p><strong>شماره فاکتور:</strong> {invoice.invoiceNumber}</p>
                            <p><strong>تاریخ صدور:</strong> {formatJalaliForDisplay(invoice.issueDate)}</p>
                            <p><strong>وضعیت پرداخت:</strong> <span className="font-bold">{paymentStatus}</span></p>
                        </div>
                    </section>
                    
                    {/* Items Table */}
                    <section className="mt-8">
                        <table className="w-full text-right">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="p-2 w-12 font-bold">#</th>
                                    <th className="p-2 font-bold">شرح محصول/خدمت</th>
                                    <th className="p-2 w-24 font-bold">تعداد</th>
                                    <th className="p-2 w-32 font-bold">قیمت واحد</th>
                                    <th className="p-2 w-40 text-left font-bold">جمع کل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-200">
                                        <td className="p-2">{index + 1}</td>
                                        <td className="p-2 font-semibold">{item.name}</td>
                                        <td className="p-2">{item.quantity}</td>
                                        <td className="p-2 font-mono">{formatCurrency(item.unitPrice)}</td>
                                        <td className="p-2 text-left font-mono">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                    </tr>
                                ))}
                                {(invoice.costItems && invoice.costItems.length > 0) && invoice.costItems.map((item, index) => (
                                    <tr key={item.costId} className="border-b border-slate-200">
                                        <td className="p-2">{invoice.items.length + index + 1}</td>
                                        <td className="p-2 font-semibold">{item.name}</td>
                                        <td className="p-2">-</td>
                                        <td className="p-2">-</td>
                                        <td className="p-2 text-left font-mono">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                     
                    {invoice.payments && invoice.payments.length > 0 && (
                        <section className="mt-8">
                            <h3 className="text-lg font-bold">
                                {isPurchase ? 'پرداخت‌های انجام شده' : 'پرداخت‌های ثبت شده'}
                            </h3>
                            <table className="w-full text-right mt-2">
                                <thead className="bg-slate-200">
                                    <tr>
                                        <th className="p-2 font-bold">تاریخ</th>
                                        <th className="p-2 font-bold">
                                            {isPurchase ? 'از صندوق' : 'به صندوق'}
                                        </th>
                                        <th className="p-2 font-bold text-left">مبلغ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.payments.map((p, i) => (
                                        <tr key={i} className="border-b border-slate-200">
                                            <td className="p-2 font-mono">{formatJalaliForDisplay(p.date)}</td>
                                            <td className="p-2">{p.boxType === 'main' ? 'اصلی' : 'VIP'}</td>
                                            <td className="p-2 text-left font-mono">{formatCurrency(p.amount)} تومان</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}
                    
                    {/* Totals */}
                    <section className="flex justify-end mt-6">
                       <div className="w-full max-w-sm space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="font-semibold">جمع جزء:</span>
                            <span className="font-mono">{formatCurrency(subtotal)} تومان</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold">جمع هزینه‌ها:</span>
                            <span className="font-mono">{formatCurrency(costsTotal)} تومان</span>
                         </div>
                         {invoice.discount && invoice.discount > 0 && (
                            <div className="flex justify-between items-center text-red-600">
                                <span className="font-semibold">تخفیف:</span>
                                <span className="font-mono">({formatCurrency(invoice.discount)}) تومان</span>
                            </div>
                         )}
                         <div className="flex justify-between items-center font-bold border-t border-slate-400 pt-2 mt-2">
                            <span>جمع کل:</span>
                            <span className="font-mono">{formatCurrency(invoice.totalAmount)} تومان</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-600">پرداخت شده:</span>
                            <span className="font-mono text-green-600">{formatCurrency(paidAmount)} تومان</span>
                         </div>
                         <div className="flex justify-between items-center text-xl font-bold border-t-2 border-slate-700 pt-2 mt-2">
                            <span>مانده:</span>
                            <span className="font-mono">{formatCurrency(balanceDue)} تومان</span>
                         </div>
                       </div>
                    </section>

                    {/* Footer */}
                    <footer className="text-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-300">
                        {printSettings.invoiceFooter && <p>{printSettings.invoiceFooter}</p>}
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default InvoicePrintLayout;