import React, { useState, useEffect, FormEvent } from 'react';
import { Transaction, TransactionType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getTodayJalaliString } from '../db';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'boxType'>) => void;
}

const today = getTodayJalaliString();

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAddTransaction }) => {
    const { themeSettings } = useTheme();
    const [formData, setFormData] = useState({
        type: 'income' as TransactionType,
        amount: 0,
        description: '',
        date: today,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'income',
                amount: 0,
                description: '',
                date: today,
            });
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleTypeChange = (type: TransactionType) => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            setError('مبلغ باید بیشتر از صفر باشد.');
            return;
        }
        if (!formData.description.trim()) {
            setError('شرح تراکنش اجباری است.');
            return;
        }
        onAddTransaction(formData);
        onClose();
    };

    if (!isOpen) return null;
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

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
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">افزودن تراکنش جدید</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع تراکنش</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleTypeChange('income')} className={`flex-1 py-2 px-4 rounded-custom text-sm font-medium transition-colors ${formData.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'}`}>
                                    واریز (درآمد)
                                </button>
                                <button type="button" onClick={() => handleTypeChange('expense')} className={`flex-1 py-2 px-4 rounded-custom text-sm font-medium transition-colors ${formData.type === 'expense' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'}`}>
                                    برداشت (هزینه)
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="مبلغ (تومان)" name="amount" type="number" value={String(formData.amount)} onChange={handleChange} required />
                            <Input label="تاریخ" name="date" type="text" value={formData.date} onChange={handleChange} required placeholder="YYYY/MM/DD" />
                        </div>

                        <Input label="شرح تراکنش" name="description" value={formData.description} onChange={handleChange} required />
                        
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${colorClasses[themeSettings.color]}`}>ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Input: React.FC<{label: string, name: string, value: string, onChange: any, type?: string, required?: boolean, placeholder?: string}> = 
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


export default AddTransactionModal;