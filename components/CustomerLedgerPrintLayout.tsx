import React from 'react';
import { Customer, Invoice, Transaction } from '../types';
import { AppLogo } from '../constants';
import { formatJalaliForDisplay } from '../db';
import { useTheme } from '../contexts/ThemeContext';

interface CustomerLedgerPrintLayoutProps {
  customer: Customer;
  invoices: Invoice[];
  transactions: Transaction[];
  filters: { startDate: string; endDate: string };
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

const CustomerLedgerPrintLayout: React.FC<CustomerLedgerPrintLayoutProps> = ({ customer, invoices, transactions, filters }) => {
    const { ledgerPrintSettings } = useTheme();

    const customerBalance = customer.credit - customer.debit;
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const settings = ledgerPrintSettings;

    const paperSizeClasses = {
        A4: 'w-[210mm] min-h-[297mm]',
        A5: 'w-[148mm] min-h-[210mm]'
    };
    const paperSize = settings.paperSize || 'A4';
    
    const fontSizeClasses = {
        sm: 'text-xs',
        base: 'text-sm',
        lg: 'text-base'
    };
    const fontSize = settings.fontSize || 'base';

    return (
        <div id="customer-ledger-print-area" className={`bg-white text-black font-iransans ${fontSizeClasses[fontSize]}`} dir="rtl">
            <div className={`${paperSizeClasses[paperSize]} mx-auto p-8 flex flex-col`}>
                {/* Header */}
                <header className="flex justify-between items-start pb-4 border-b-2 border-slate-700">
                    <div className="flex items-center gap-4">
                        {settings.logo ? (
                            <img src={settings.logo} alt="لوگوی کسب‌وکار" className="w-16 h-16 object-contain" />
                        ) : (
                            <AppLogo className="w-16 h-16 text-slate-800" />
                        )}
                         <h1 className="text-3xl font-bold">{settings.reportTitle || 'صورتحساب مشتری'}</h1>
                    </div>
                    <div className="text-left text-xs">
                        <h2 className="text-base font-bold">{settings.businessName}</h2>
                        <p>{settings.businessAddress}</p>
                        <p>تلفن: {settings.businessPhone}</p>
                        <p>{settings.businessEmail}</p>
                    </div>
                </header>
                
                {/* Customer Details & Summary */}
                <section className="grid grid-cols-2 gap-8 mt-6 pb-4 border-b border-slate-300">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold border-b border-slate-300 pb-1 mb-2">مشخصات مشتری:</h3>
                        <p><strong className="font-semibold">نام:</strong> {customer.firstName} {customer.lastName}</p>
                        <p><strong className="font-semibold">تلفن:</strong> {customer.phone || '-'}</p>
                        <p><strong className="font-semibold">آدرس:</strong> {customer.address || '-'}</p>
                    </div>
                    <div className="space-y-1 text-left">
                        <h3 className="text-lg font-semibold border-b border-slate-300 pb-1 mb-2">خلاصه مالی:</h3>
                        <p><strong>مانده حساب کل:</strong> <span className="font-mono">{formatCurrency(customerBalance)}</span></p>
                        <p><strong>جمع کل فاکتورها (در بازه):</strong> <span className="font-mono">{formatCurrency(totalInvoiceAmount)}</span></p>
                        <p><strong>وضعیت:</strong> {customer.isVip ? 'مشتری ویژه (VIP)' : 'عادی'}</p>
                    </div>
                </section>
                
                 {(filters.startDate || filters.endDate) && (
                    <section className="mt-4 text-center bg-slate-100 p-2 rounded-md">
                        <p className="text-sm">
                            <strong>گزارش برای بازه زمانی:</strong>
                            {filters.startDate && ` از ${formatJalaliForDisplay(filters.startDate)}`}
                            {filters.endDate && ` تا ${formatJalaliForDisplay(filters.endDate)}`}
                        </p>
                    </section>
                )}


                {/* Invoices Table */}
                {(settings.showInvoices ?? true) && (
                    <section className="mt-6">
                        <h3 className="text-xl font-bold mb-3">لیست فاکتورها</h3>
                        <table className="w-full text-right">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="p-2 font-bold">شماره فاکتور</th>
                                    <th className="p-2 font-bold">تاریخ صدور</th>
                                    <th className="p-2 font-bold text-left">مبلغ کل</th>
                                    <th className="p-2 font-bold text-left">وضعیت پرداخت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length > 0 ? invoices.map((inv) => {
                                    const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                                    const balanceDue = inv.totalAmount - paidAmount;
                                    let paymentStatus: string;
                                    if (balanceDue <= 0) paymentStatus = 'پرداخت شده';
                                    else if (paidAmount > 0) paymentStatus = 'پرداخت ناقص';
                                    else paymentStatus = 'پرداخت نشده';
                                    
                                    return (
                                        <tr key={inv.id} className="border-b border-slate-200">
                                            <td className="p-2 font-mono">{inv.invoiceNumber}</td>
                                            <td className="p-2 font-mono">{formatJalaliForDisplay(inv.issueDate)}</td>
                                            <td className="p-2 text-left font-mono">{formatCurrency(inv.totalAmount)}</td>
                                            <td className="p-2 text-left">{paymentStatus}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={4} className="text-center p-4 text-slate-500">فاکتوری در این بازه زمانی یافت نشد.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Transactions Table */}
                {(settings.showTransactions ?? true) && (
                    <section className="mt-8">
                        <h3 className="text-xl font-bold mb-3">تراکنش‌های مالی (از فاکتورهای پرداخت شده)</h3>
                        <table className="w-full text-right">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="p-2 font-bold">تاریخ</th>
                                    <th className="p-2 font-bold">فاکتور</th>
                                    <th className="p-2 font-bold">شرح</th>
                                    <th className="p-2 font-bold text-left">مبلغ</th>
                                    <th className="p-2 font-bold text-left">صندوق</th>
                                </tr>
                            </thead>
                            <tbody>
                                 {transactions.length > 0 ? transactions.map((t) => (
                                    <tr key={t.id} className="border-b border-slate-200">
                                        <td className="p-2 font-mono">{formatJalaliForDisplay(t.date)}</td>
                                        <td className="p-2 font-mono">{t.invoiceNumber}</td>
                                        <td className="p-2">{t.description}</td>
                                        <td className="p-2 text-left font-mono">{formatCurrency(t.amount)}</td>
                                        <td className="p-2 text-left">{t.boxType === 'main' ? 'اصلی' : 'VIP'}</td>
                                    </tr>
                                 )) : (
                                    <tr><td colSpan={5} className="text-center p-4 text-slate-500">تراکنشی در این بازه زمانی یافت نشد.</td></tr>
                                 )}
                            </tbody>
                        </table>
                    </section>
                )}
                
                {/* Footer */}
                <footer className="text-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-300">
                    <p>این صورتحساب در تاریخ {formatJalaliForDisplay(new Date().toLocaleDateString('fa-IR-u-nu-latn'))} تهیه شده است.</p>
                </footer>
            </div>
        </div>
    );
};

export default CustomerLedgerPrintLayout;