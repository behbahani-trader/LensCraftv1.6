import React, { useState, useEffect, FormEvent } from 'react';
import { Customer, UserAuthData } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import SearchableSelect from './SearchableSelect';

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => void;
    customerToEdit: Customer | null;
    unlinkedUsers: UserAuthData[];
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSaveCustomer, customerToEdit, unlinkedUsers }) => {
    const { themeSettings } = useTheme();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phone: '', address: '',
        debit: 0, credit: 0, telegramChatId: '', isVip: false, userId: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (customerToEdit) {
                setFormData({
                    firstName: customerToEdit.firstName, lastName: customerToEdit.lastName, phone: customerToEdit.phone,
                    address: customerToEdit.address, debit: customerToEdit.debit, credit: customerToEdit.credit,
                    telegramChatId: customerToEdit.telegramChatId || '', isVip: customerToEdit.isVip, userId: customerToEdit.userId || ''
                });
            } else {
                setFormData({
                    firstName: '', lastName: '', phone: '', address: '', debit: 0,
                    credit: 0, telegramChatId: '', isVip: false, userId: ''
                });
            }
            setError('');
        }
    }, [isOpen, customerToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const { name, value } = target;
        if (target instanceof HTMLInputElement && target.type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: name === 'debit' || name === 'credit' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleUserLinkChange = (user: UserAuthData | null) => {
        setFormData(prev => ({ ...prev, userId: user ? user.username : '' }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.firstName.trim()) {
            setError('نام مشتری اجباری است.');
            return;
        }
        onSaveCustomer({ ...formData, id: customerToEdit?.id });
        onClose();
    };

    if (!isOpen) return null;
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500', red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500', purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    
    const modalTitle = customerToEdit ? `ویرایش مشتری: ${customerToEdit.firstName}` : "افزودن مشتری جدید";
    const saveButtonText = customerToEdit ? "ذخیره تغییرات" : "ذخیره مشتری";
    
    // Add the current user of the customer to the list of selectable users if they are being edited
    const availableUsersForSelect = [...unlinkedUsers];
    if(customerToEdit?.userId && !unlinkedUsers.some(u => u.username === customerToEdit.userId)) {
        availableUsersForSelect.unshift({ username: customerToEdit.userId, roleId: '' }); // Dummy roleId
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{modalTitle}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="نام" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            <Input label="نام خانوادگی" name="lastName" value={formData.lastName} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="تلفن" name="phone" value={formData.phone} onChange={handleChange} />
                             <div>
                                <Input label="شناسه چت تلگرام (Chat ID)" name="telegramChatId" value={formData.telegramChatId} onChange={handleChange} placeholder="یک شناسه عددی" />
                                <p className="text-xs text-slate-400 mt-1">شناسه عددی کاربر را (نه نام کاربری) وارد کنید. می‌توانید از ربات <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-500">@userinfobot</a> برای دریافت آن استفاده کنید.</p>
                            </div>
                        </div>
                        
                        <SearchableSelect
                            label="اتصال به حساب کاربری"
                            options={availableUsersForSelect}
                            value={availableUsersForSelect.find(u => u.username === formData.userId) || null}
                            onChange={handleUserLinkChange}
                            getOptionLabel={(u) => u.username}
                            getOptionValue={(u) => u.username}
                            placeholder="کاربری انتخاب نشده..."
                        />
                        
                        <div className="flex items-center pt-2">
                            <input id="isVip" name="isVip" type="checkbox" checked={formData.isVip} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="isVip" className="mr-3 block text-sm font-medium text-slate-700 dark:text-slate-300">مشتری ویژه (VIP)</label>
                        </div>
                        
                        <div>
                             <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">آدرس</label>
                             <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="مانده بدهکاری" name="debit" type="number" value={String(formData.debit)} onChange={handleChange} />
                            <Input label="مانده بستانکاری" name="credit" type="number" value={String(formData.credit)} onChange={handleChange} />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${colorClasses[themeSettings.color]}`}>{saveButtonText}</button>
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
        <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
    </div>
);

export default CustomerFormModal;