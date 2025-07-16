import React, { useState } from 'react';
import { Invoice, InvoiceType, Customer } from '../types';
import { formatJalaliForDisplay } from '../db';
import { PrintIcon, SendIcon } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import html2canvas from 'html2canvas';

interface InvoiceListProps {
    invoices: Invoice[];
    customers: Customer[];
    onEdit?: (invoice: Invoice) => void;
    onDelete?: (invoiceId: string) => void;
    onPrint: (invoice: Invoice) => void;
}

type PaymentStatus = 'پرداخت شده' | 'پرداخت ناقص' | 'پرداخت نشده' | 'N/A';

const getPaymentStatus = (invoice: Invoice): { status: PaymentStatus; paidAmount: number; balance: number } => {
    if (invoice.invoiceType.startsWith('proforma')) {
        return { status: 'N/A', paidAmount: 0, balance: invoice.totalAmount };
    }
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = invoice.totalAmount - paidAmount;

    let status: PaymentStatus;
    if (balance <= 0) {
        status = 'پرداخت شده';
    } else if (paidAmount > 0) {
        status = 'پرداخت ناقص';
    } else {
        status = 'پرداخت نشده';
    }
    return { status, paidAmount, balance };
};

const getStatusChip = (status: PaymentStatus) => {
    const statusStyles: Record<PaymentStatus, string> = {
        'پرداخت شده': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'پرداخت ناقص': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'پرداخت نشده': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        'N/A': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    const classes = statusStyles[status];
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>{status}</span>;
};

const getInvoiceTypeChip = (type: InvoiceType) => {
    const typeInfo: Record<InvoiceType, { label: string; className: string }> = {
        sale: { label: 'فروش', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
        purchase: { label: 'خرید', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        proforma_sale: { label: 'پیش‌فاکتور فروش', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
        proforma_purchase: { label: 'پیش‌فاکتور خرید', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
        return_sale: { label: 'مرجوعی فروش', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
        return_purchase: { label: 'مرجوعی خرید', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
    };
    const { label, className } = typeInfo[type] || { label: 'نامشخص', className: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}`}>{label}</span>;
}

const EmptyState: React.FC = () => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m9-9l-9 9" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            هیچ فاکتوری ثبت نشده است
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            برای شروع، روی دکمه "ایجاد فاکتور جدید" کلیک کنید.
        </p>
    </div>
);

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, customers, onEdit, onDelete, onPrint }) => {
    const { telegramSettings, printSettings } = useTheme();
    const [sendingState, setSendingState] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});

    const handleSendToTelegram = async (invoice: Invoice) => {
        const customer = customers.find(c => c.id === invoice.customerId);
        if (!customer || !customer.telegramChatId) {
            alert('شناسه تلگرام برای این مشتری ثبت نشده است.');
            return;
        }

        if (!telegramSettings.botToken) {
            alert('توکن ربات تلگرام در تنظیمات وارد نشده است.');
            return;
        }

        setSendingState(prev => ({ ...prev, [invoice.id]: 'sending' }));

        const tempNode = document.createElement('div');
        tempNode.style.position = 'absolute';
        tempNode.style.left = '-9999px';
        tempNode.style.top = '-9999px';
        tempNode.style.width = '210mm';
        tempNode.style.height = 'auto';
        tempNode.style.background = 'white';
        tempNode.style.fontFamily = 'IRANSans, sans-serif';
        tempNode.style.direction = 'rtl';
        tempNode.innerHTML = generateInvoiceHTML(invoice, printSettings);
        document.body.appendChild(tempNode);

        try {
            const canvas = await html2canvas(tempNode, { scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');
            const blob = dataURLtoBlob(dataUrl);

            if (!blob) throw new Error('Could not create image blob.');

            const formData = new FormData();
            formData.append('chat_id', customer.telegramChatId);
            const caption = telegramSettings.messageTemplate
                .replace('{customerName}', invoice.customerName)
                .replace('{invoiceNumber}', invoice.invoiceNumber);

            formData.append('caption', caption);
            formData.append('photo', blob, `invoice-${invoice.invoiceNumber}.png`);

            const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/sendPhoto`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Telegram API error:', errorData);
                throw new Error(errorData.description || 'Failed to send message.');
            }
            
            setSendingState(prev => ({ ...prev, [invoice.id]: 'sent' }));
            setTimeout(() => setSendingState(prev => ({ ...prev, [invoice.id]: 'idle' })), 3000);

        } catch (error) {
            console.error('Failed to send invoice to Telegram:', error);
            setSendingState(prev => ({ ...prev, [invoice.id]: 'error' }));
             setTimeout(() => setSendingState(prev => ({ ...prev, [invoice.id]: 'idle' })), 3000);
            alert(`خطا در ارسال به تلگرام: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            document.body.removeChild(tempNode);
        }
    };

    if (invoices.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">شماره فاکتور</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">نوع</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مشتری/فروشنده</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">تاریخ صدور</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مبلغ کل</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">وضعیت پرداخت</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">عملیات</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {invoices.map((invoice) => {
                            const { status } = getPaymentStatus(invoice);
                            const name = invoice.customerName;
                            const customer = customers.find(c => c.id === invoice.customerId);
                            const canSendTelegram = !!(customer?.telegramChatId && telegramSettings.botToken);
                            const sendingStatus = sendingState[invoice.id] || 'idle';

                            return (
                                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getInvoiceTypeChip(invoice.invoiceType)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatJalaliForDisplay(invoice.issueDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{formatCurrency(invoice.totalAmount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusChip(status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-2 space-x-reverse">
                                        <button onClick={() => handleSendToTelegram(invoice)} disabled={!canSendTelegram || sendingStatus !== 'idle'} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1 p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                                            {sendingStatus === 'sending' ? '...' : <SendIcon className="w-4 h-4" />}
                                        </button>
                                        {onEdit && <button onClick={() => onEdit(invoice)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">ویرایش</button>}
                                        <button onClick={() => onPrint(invoice)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1">
                                            <PrintIcon className="w-4 h-4" /> چاپ
                                        </button>
                                        {onDelete && <button onClick={() => onDelete(invoice.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">حذف</button>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Helper to generate HTML for canvas rendering, avoiding full React rendering
function generateInvoiceHTML(invoice: Invoice, settings: any): string {
    const subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const costsTotal = invoice.costItems?.reduce((acc, item) => acc + item.amount, 0) || 0;
    const itemsHtml = invoice.items.map((item, index) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px;">${index + 1}</td>
            <td style="padding: 8px; font-weight: 600;">${item.name}</td>
            <td style="padding: 8px;">${item.quantity}</td>
            <td style="padding: 8px;">${formatCurrency(item.unitPrice)}</td>
            <td style="padding: 8px; text-align: left;">${formatCurrency(item.quantity * item.unitPrice)}</td>
        </tr>
    `).join('');
    return `
        <div style="padding: 32px; color: #1e293b;">
            <header style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #334155;">
                <h1 style="font-size: 2rem; font-weight: bold;">${settings.invoiceTitle || 'فاکتور فروش'}</h1>
                <div style="text-align: left; font-size: 0.8rem;">
                    <h2 style="font-size: 1rem; font-weight: bold;">${settings.businessName}</h2>
                    <p>${settings.businessAddress}</p>
                    <p>تلفن: ${settings.businessPhone}</p>
                </div>
            </header>
            <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px;">
                <div>
                    <h3 style="font-size: 1.125rem; font-weight: 600; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">صورتحساب برای:</h3>
                    <p style="font-weight: bold;">${invoice.customerName}</p>
                </div>
                <div style="text-align: left;">
                    <p><strong>شماره فاکتور:</strong> ${invoice.invoiceNumber}</p>
                    <p><strong>تاریخ صدور:</strong> ${formatJalaliForDisplay(invoice.issueDate)}</p>
                </div>
            </section>
            <section style="margin-top: 32px;">
                <table style="width: 100%; text-align: right; border-collapse: collapse;">
                    <thead style="background-color: #f1f5f9;">
                        <tr>
                            <th style="padding: 8px; font-weight: bold;">#</th>
                            <th style="padding: 8px; font-weight: bold;">شرح</th>
                            <th style="padding: 8px; font-weight: bold;">تعداد</th>
                            <th style="padding: 8px; font-weight: bold;">قیمت واحد</th>
                            <th style="padding: 8px; text-align: left; font-weight: bold;">جمع کل</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
            </section>
            <section style="display: flex; justify-content: flex-end; margin-top: 24px;">
                <div style="width: 100%; max-width: 320px; display: grid; gap: 8px;">
                    <div style="display: flex; justify-content: space-between;"><span>جمع جزء:</span><span>${formatCurrency(subtotal)}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>هزینه‌ها:</span><span>${formatCurrency(costsTotal)}</span></div>
                    ${invoice.discount ? `<div style="display: flex; justify-content: space-between;"><span>تخفیف:</span><span>(${formatCurrency(invoice.discount)})</span></div>` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #94a3b8; padding-top: 8px; margin-top: 8px;">
                        <span>جمع کل:</span><span>${formatCurrency(invoice.totalAmount)}</span>
                    </div>
                </div>
            </section>
        </div>
    `;
}

export default InvoiceList;