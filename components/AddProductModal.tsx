import React, { useState, useEffect, FormEvent } from 'react';
import { Product } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveProduct: (product: Omit<Product, 'id'> & { id?: string }) => void;
    mode: 'product' | 'service';
    itemToEdit: Product | null;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
};


const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSaveProduct, mode, itemToEdit }) => {
    const { themeSettings } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        type: mode,
        stock: 0,
        shareSettings: {
            normal: { mainShare: 0, commissionShare: 0 },
            vip: { mainShare: 0, commissionShare: 0 },
        },
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const defaultShareSettings = {
            normal: { mainShare: 0, commissionShare: 0 },
            vip: { mainShare: 0, commissionShare: 0 },
        };

        if (isOpen) {
            if (itemToEdit) {
                setFormData({
                    name: itemToEdit.name,
                    description: itemToEdit.description,
                    price: itemToEdit.price,
                    type: itemToEdit.type,
                    stock: itemToEdit.stock || 0,
                    shareSettings: itemToEdit.shareSettings || defaultShareSettings,
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    price: 0,
                    type: mode,
                    stock: 0,
                    shareSettings: defaultShareSettings,
                });
            }
            setError('');
        }
    }, [isOpen, itemToEdit, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numberFields = ['price', 'stock'];
        if (numberFields.includes(name)) {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleShareChange = (customerType: 'normal' | 'vip', inputType: 'main' | 'commission', value: string) => {
        const inputValue = parseFloat(value) || 0;
        setFormData(prev => {
            const price = prev.price;
            let mainShareValue: number;
            let commissionShareValue: number;

            if (inputType === 'commission') {
                commissionShareValue = inputValue;
                mainShareValue = price - commissionShareValue;
            } else { // inputType is 'main'
                mainShareValue = inputValue;
                commissionShareValue = price - mainShareValue;
            }
            
            const currentSettings = prev.shareSettings || {
                normal: { mainShare: 0, commissionShare: 0 },
                vip: { mainShare: 0, commissionShare: 0 },
            };
            const updatedSettings = { ...currentSettings };
            updatedSettings[customerType] = {
                mainShare: mainShareValue,
                commissionShare: commissionShareValue,
            };

            return {
                ...prev,
                shareSettings: updatedSettings,
            };
        });
    };


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const entityName = mode === 'product' ? 'محصول' : 'خدمت';
        if (!formData.name.trim()) {
            setError(`نام ${entityName} اجباری است.`);
            return;
        }
        const dataToSave: Omit<Product, 'id'> & { id?: string } = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            type: formData.type,
            id: itemToEdit?.id
        };

        if (mode === 'product') {
            dataToSave.stock = formData.stock;
        } else {
            dataToSave.shareSettings = formData.shareSettings;
        }

        onSaveProduct(dataToSave);
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
    
    const entityName = mode === 'product' ? 'محصول' : 'خدمت';
    const modalTitle = itemToEdit ? `ویرایش ${entityName}` : `افزودن ${entityName} جدید`;
    const saveButtonText = itemToEdit ? 'ذخیره تغییرات' : 'ذخیره';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-2xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{modalTitle}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <Input label="نام" name="name" value={formData.name} onChange={handleChange} required />
                        <div>
                             <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                             <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="قیمت (تومان)" name="price" type="number" value={String(formData.price)} onChange={handleChange} />
                             {mode === 'product' && (
                                <Input label="موجودی اولیه" name="stock" type="number" value={String(formData.stock)} onChange={handleChange} />
                            )}
                        </div>
                        
                        {mode === 'service' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-custom space-y-4 border border-slate-200 dark:border-slate-600">
                                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">تقسیم سهام (مشتری عادی)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="سهم کارمزد (تومان)" name="normalCommissionShare" type="number" value={String(formData.shareSettings.normal.commissionShare)} onChange={e => handleShareChange('normal', 'commission', e.target.value)} />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سهم اصلی (محاسبه شده)</label>
                                            <div className="h-10 px-3 flex items-center bg-slate-100 dark:bg-slate-700 rounded-custom font-mono text-slate-600 dark:text-slate-300">
                                                {formatCurrency(formData.shareSettings.normal.mainShare)} تومان
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                 <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-custom space-y-4 border border-slate-200 dark:border-slate-600">
                                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">تقسیم سهام (مشتری VIP)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="سهم اصلی (تومان)" name="vipMainShare" type="number" value={String(formData.shareSettings.vip.mainShare)} onChange={e => handleShareChange('vip', 'main', e.target.value)} />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سهم کارمزد (محاسبه شده)</label>
                                            <div className="h-10 px-3 flex items-center bg-slate-100 dark:bg-slate-700 rounded-custom font-mono text-slate-600 dark:text-slate-300">
                                                {formatCurrency(formData.shareSettings.vip.commissionShare)} تومان
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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


export default AddProductModal;