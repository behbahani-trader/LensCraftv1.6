import React, { useState, useEffect, FormEvent } from 'react';
import { Expense } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getTodayJalaliString } from '../db';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

const today = getTodayJalaliString();

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense }) => {
    const { themeSettings } = useTheme();
    const [formData, setFormData] = useState({
        date: today,
        amount: 0,
        category: '',
        description: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                date: today,
                amount: 0,
                category: '',
                description: '',
            });
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            setError('مبلغ باید بیشتر از صفر باشد.');
            return;
        }
        if (!formData.description.trim()) {
            setError('شرح هزینه اجباری است.');
            return;
        }
        if (!formData.category.trim()) {
            setError('دسته‌بندی هزینه اجباری است.');
            return;
        }
        onAddExpense(formData);
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
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">افزودن هزینه جدید</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="تاریخ" name="date" value={formData.date} onChange={handleChange} required placeholder="YYYY/MM/DD"/>
                            <Input label="مبلغ (تومان)" name="amount" type="number" value={String(formData.amount)} onChange={handleChange} required />
                        </div>
                        <Input label="دسته‌بندی" name="category" value={formData.category} onChange={handleChange} required placeholder="مثال: اجاره، حقوق، خرید لوازم" />

                        <div>
                             <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                شرح
                                <span className="text-red-500">*</span>
                             </label>
                             <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                            ></textarea>
                        </div>
                        
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors">
                            لغو
                        </button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors ${colorClasses[themeSettings.color]}`}>
                            ذخیره هزینه
                        </button>
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
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
        />
    </div>
);

export default AddExpenseModal;