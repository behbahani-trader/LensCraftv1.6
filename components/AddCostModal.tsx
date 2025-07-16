import React, { useState, useEffect, FormEvent } from 'react';
import { Cost } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AddCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveCost: (cost: Omit<Cost, 'id'> & { id?: string }) => void;
    itemToEdit: Cost | null;
}

const AddCostModal: React.FC<AddCostModalProps> = ({ isOpen, onClose, onSaveCost, itemToEdit }) => {
    const { themeSettings } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        amount: 0,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if(itemToEdit) {
                setFormData({
                    name: itemToEdit.name,
                    amount: itemToEdit.amount,
                });
            } else {
                setFormData({
                    name: '',
                    amount: 0,
                });
            }
            setError('');
        }
    }, [isOpen, itemToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('نام هزینه اجباری است.');
            return;
        }
        if (formData.amount <= 0) {
            setError('مبلغ باید بیشتر از صفر باشد.');
            return;
        }
        onSaveCost({ ...formData, id: itemToEdit?.id });
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
    
    const modalTitle = itemToEdit ? 'ویرایش هزینه' : 'افزودن هزینه اضافی جدید';
    const saveButtonText = itemToEdit ? 'ذخیره تغییرات' : 'ذخیره';

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
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{modalTitle}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <Input label="نام هزینه" name="name" value={formData.name} onChange={handleChange} required placeholder="مثال: هزینه ارسال، بسته‌بندی"/>
                        <Input label="مبلغ (تومان)" name="amount" type="number" value={String(formData.amount)} onChange={handleChange} required />
                        
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors">
                            لغو
                        </button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors ${colorClasses[themeSettings.color]}`}>
                            {saveButtonText}
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


export default AddCostModal;