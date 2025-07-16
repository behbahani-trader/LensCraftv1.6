import React, { useState, useEffect, FormEvent } from 'react';
import { Partner } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AddPartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (partner: Omit<Partner, 'id'> & { id?: string }) => void;
    partnerToEdit: Partner | null;
}

const AddPartnerModal: React.FC<AddPartnerModalProps> = ({ isOpen, onClose, onSave, partnerToEdit }) => {
    const { themeSettings } = useTheme();
    const [formData, setFormData] = useState({ name: '', initialBalance: 0 });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (partnerToEdit) {
                setFormData({
                    name: partnerToEdit.name,
                    initialBalance: partnerToEdit.initialBalance,
                });
            } else {
                setFormData({ name: '', initialBalance: 0 });
            }
            setError('');
        }
    }, [isOpen, partnerToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'initialBalance' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('نام شریک اجباری است.');
            return;
        }
        onSave({ ...formData, id: partnerToEdit?.id });
    };

    if (!isOpen) return null;
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

    const modalTitle = partnerToEdit ? `ویرایش شریک: ${partnerToEdit.name}` : 'افزودن شریک جدید';
    const saveButtonText = partnerToEdit ? 'ذخیره تغییرات' : 'افزودن شریک';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{modalTitle}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <Input label="نام شریک" name="name" value={formData.name} onChange={handleChange} required />
                        <Input label="موجودی اولیه" name="initialBalance" type="number" value={String(formData.initialBalance)} onChange={handleChange} required />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${colorClasses[themeSettings.color]}`}>{saveButtonText}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Input: React.FC<any> = ({ label, name, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <input
            id={name}
            name={name}
            {...props}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
        />
    </div>
);

export default AddPartnerModal;