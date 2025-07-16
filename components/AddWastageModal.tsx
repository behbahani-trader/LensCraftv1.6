import React, { useState, useEffect, FormEvent } from 'react';
import { Wastage, BoxType, Transaction } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getTodayJalaliString } from '../db';
import { useDb } from '../contexts/DbContext';

interface AddWastageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const today = getTodayJalaliString();

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <input id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
    </div>
);

const AddWastageModal: React.FC<AddWastageModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { themeSettings } = useTheme();
    const db = useDb();
    const [title, setTitle] = useState('');
    const [totalCost, setTotalCost] = useState(0);
    const [date, setDate] = useState(today);
    const [boxType, setBoxType] = useState<BoxType>('main');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setTotalCost(0);
            setDate(today);
            setBoxType('main');
            setDescription('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title.trim()) {
            setError('عنوان ضایعات اجباری است.');
            return;
        }
        if (totalCost <= 0) {
            setError('هزینه کل باید بیشتر از صفر باشد.');
            return;
        }

        try {
            await db.transaction('rw', db.wastages, db.cashTransactions, async () => {
                const txId = `txn-wst-${Date.now()}`;
                
                const wastageRecord: Wastage = {
                    id: `wst-${Date.now()}`,
                    transactionId: txId,
                    date,
                    title,
                    totalCost,
                    description,
                    boxType,
                };
                
                const transactionRecord: Transaction = {
                    id: txId,
                    boxType,
                    type: 'expense',
                    date,
                    description: `ضایعات: ${title}`,
                    amount: totalCost,
                };
                
                await db.wastages.add(wastageRecord);
                await db.cashTransactions.add(transactionRecord);
            });
            onSuccess();
        } catch (err: any) {
            console.error("Failed to save wastage", err);
            setError(`خطا در ثبت ضایعات: ${err.message}`);
        }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">ثبت ضایعات جدید</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <Input label="عنوان ضایعات" name="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="مثال: شکستگی شیشه، خرابی دستگاه و..." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Input label="هزینه کل (تومان)" name="totalCost" type="number" value={String(totalCost)} onChange={e => setTotalCost(Number(e.target.value) || 0)} required min="0" />
                            <Input label="تاریخ" name="date" type="text" value={date} onChange={e => setDate(e.target.value)} required placeholder="YYYY/MM/DD" />
                        </div>
                        <div>
                            <label htmlFor="boxType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">کسر از صندوق</label>
                            <select id="boxType" name="boxType" value={boxType} onChange={e => setBoxType(e.target.value as BoxType)} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
                                <option value="main">صندوق اصلی</option>
                                <option value="vip">صندوق VIP</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات (اختیاری)</label>
                            <textarea id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${colorClasses[themeSettings.color]}`}>ثبت ضایعات</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWastageModal;