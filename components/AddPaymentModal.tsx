
import React, { useState, useEffect, FormEvent } from 'react';
import { Invoice, InvoicePayment, BoxType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useDb } from '../contexts/DbContext';
import { getTodayJalaliString } from '../db';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: Invoice, payment: InvoicePayment) => void;
    invoice: Invoice | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));
const today = getTodayJalaliString();

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, onSave, invoice }) => {
    const { themeSettings } = useTheme();
    const db = useDb();
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(today);
    const [boxType, setBoxType] = useState<BoxType>('main');
    const [error, setError] = useState('');

    const paidAmount = invoice ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const balanceDue = invoice ? invoice.totalAmount - paidAmount : 0;

    useEffect(() => {
        if (isOpen && invoice) {
            const setDefaults = async () => {
                const customer = await db.customers.get(invoice.customerId);
                const defaultBoxType: BoxType = customer?.isVip ? 'vip' : 'main';
                
                setAmount(Math.max(0, balanceDue));
                setDate(today);
                setBoxType(defaultBoxType);
                setError('');
            };
            setDefaults();
        }
    }, [isOpen, invoice, balanceDue, db]);

    if (!isOpen || !invoice) return null;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (amount <= 0) {
            setError('مبلغ باید بیشتر از صفر باشد.');
            return;
        }
        if (amount > balanceDue) {
            if (!window.confirm(`مبلغ وارد شده (${formatCurrency(amount)}) از مانده بدهی (${formatCurrency(balanceDue)}) بیشتر است. آیا ادامه می‌دهید؟`)) {
                return;
            }
        }
        setError('');
        onSave(invoice, { amount, date, boxType });
    };

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-lg transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">ثبت پرداخت برای فاکتور <span className="font-mono">{invoice.invoiceNumber}</span></h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-custom border border-slate-200 dark:border-slate-600 space-y-2 text-sm">
                            <InfoRow label="مشتری" value={invoice.customerName} />
                            <InfoRow label="مبلغ کل فاکتور" value={`${formatCurrency(invoice.totalAmount)} تومان`} />
                            <InfoRow label="مبلغ پرداخت شده" value={`${formatCurrency(paidAmount)} تومان`} isAmount color="green" />
                            <InfoRow label="مانده بدهی" value={`${formatCurrency(balanceDue)} تومان`} isAmount color="red" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <Input label="مبلغ پرداخت (تومان)" name="amount" type="number" value={String(amount)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(parseFloat(e.target.value) || 0)} required />
                           <Input label="تاریخ پرداخت" name="date" type="text" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} required placeholder="YYYY/MM/DD" />
                        </div>
                        <div>
                            <label htmlFor="boxType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">صندوق مقصد</label>
                            <select id="boxType" name="boxType" value={boxType} onChange={e => setBoxType(e.target.value as BoxType)} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
                                <option value="main">صندوق اصلی</option>
                                <option value="vip">صندوق VIP</option>
                            </select>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${themeColorClass}`}>ذخیره پرداخت</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Input: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, required?: boolean, placeholder?: string}> = 
({ label, name, value, onChange, type = "text", required = false, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            id={name} name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
        />
    </div>
);

const InfoRow: React.FC<{label: string, value: string, isAmount?: boolean, color?: 'green' | 'red'}> = ({ label, value, isAmount, color }) => {
    let valueClasses = "text-slate-900 dark:text-slate-100 font-semibold";
    if (isAmount) {
        valueClasses += " font-mono";
        if (color === 'green') valueClasses += " text-green-600 dark:text-green-400";
        if (color === 'red') valueClasses += " text-red-600 dark:text-red-400";
    }
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">{label}:</span>
            <span className={valueClasses}>{value}</span>
        </div>
    );
};

export default AddPaymentModal;
