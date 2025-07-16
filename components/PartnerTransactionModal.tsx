
import React, { useState, useEffect, FormEvent } from 'react';
import { Partner, BoxType, PartnerTransaction, Transaction, ThemeColor } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useDb } from '../contexts/DbContext';
import { getTodayJalaliString } from '../db';
import SearchableSelect from './SearchableSelect';

interface PartnerTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    partner: Partner | null;
    allPartners: Partner[];
}

type TxTab = 'deposit' | 'withdrawal' | 'transfer';
const today = getTodayJalaliString();

// --- Prop Interfaces for Local Components ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    name: string;
    children: React.ReactNode;
}

// --- Local Components ---
const Input: React.FC<InputProps> = ({ label, name, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <input id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
    </div>
);

const Select: React.FC<SelectProps> = ({ label, name, children, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <select id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
            {children}
        </select>
    </div>
);

const PartnerTransactionModal: React.FC<PartnerTransactionModalProps> = ({ isOpen, onClose, onSuccess, partner, allPartners }) => {
    const { themeSettings } = useTheme();
    const db = useDb();
    const [activeTab, setActiveTab] = useState<TxTab>('deposit');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(today);
    const [description, setDescription] = useState('');
    const [boxType, setBoxType] = useState<BoxType>('main');
    const [destinationPartner, setDestinationPartner] = useState<Partner | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveTab('deposit');
            setAmount(0);
            setDate(today);
            setDescription('');
            setBoxType('main');
            setDestinationPartner(null);
            setError('');
        }
    }, [isOpen]);
    
    if (!isOpen || !partner) return null;

    const handleDepositOrWithdrawal = async () => {
        if (!description.trim()) {
            setError('شرح تراکنش الزامی است.');
            throw new Error('Description is required');
        }

        const txId = Date.now().toString();
        
        // 1. Partner Transaction (Deposit/Withdrawal)
        const partnerTx: PartnerTransaction = {
            id: `ptx-${txId}`,
            partnerId: partner.id,
            partnerName: partner.name,
            type: activeTab as 'deposit' | 'withdrawal',
            amount,
            date,
            description,
            boxType,
        };

        // 2. Corresponding Cash Box Transaction (Income/Expense)
        const cashTx: Transaction = {
            id: `ctx-${txId}`,
            boxType,
            type: activeTab === 'deposit' ? 'income' : 'expense',
            amount,
            date,
            description: `${activeTab === 'deposit' ? 'واریز از طرف' : 'برداشت برای'} شریک: ${partner.name} - ${description}`,
        };

        await db.partnerTransactions.add(partnerTx);
        await db.cashTransactions.add(cashTx);
    };

    const handleTransfer = async () => {
        if (!destinationPartner) {
            setError('لطفا شریک مقصد را انتخاب کنید.');
            throw new Error('Destination partner is required');
        }
        const txId = Date.now().toString();
        const desc = description.trim() || `انتقال از ${partner.name} به ${destinationPartner.name}`;

        // 1. Create 'transfer_out' for source partner
        const transferOutTx: PartnerTransaction = {
            id: `ptx-${txId}-out`,
            partnerId: partner.id,
            partnerName: partner.name,
            type: 'transfer_out',
            amount,
            date,
            description: desc,
            relatedPartnerId: destinationPartner.id,
            relatedPartnerName: destinationPartner.name
        };
        
        // 2. Create 'transfer_in' for destination partner
        const transferInTx: PartnerTransaction = {
            id: `ptx-${txId}-in`,
            partnerId: destinationPartner.id,
            partnerName: destinationPartner.name,
            type: 'transfer_in',
            amount,
            date,
            description: desc,
            relatedPartnerId: partner.id,
            relatedPartnerName: partner.name
        };
        
        await db.partnerTransactions.bulkAdd([transferOutTx, transferInTx]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (amount <= 0) {
            setError('مبلغ باید بیشتر از صفر باشد.');
            return;
        }

        try {
            await db.transaction('rw', db.partnerTransactions, db.cashTransactions, async () => {
                if (activeTab === 'deposit' || activeTab === 'withdrawal') {
                    await handleDepositOrWithdrawal();
                } else if (activeTab === 'transfer') {
                    await handleTransfer();
                }
            });
            onSuccess();
        } catch (err: any) {
            if (!error) { // Avoid overwriting specific errors from helpers
                setError('خطا در ثبت تراکنش. لطفا دوباره تلاش کنید.');
            }
            console.error('Failed to save partner transaction:', err);
        }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">تراکنش مالی برای: {partner.name}</h2>
                </div>

                <div className="p-2 bg-slate-100 dark:bg-slate-900/50">
                    <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-custom">
                        <TabButton label="واریز به صندوق" active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')} themeColor={themeSettings.color} />
                        <TabButton label="برداشت از صندوق" active={activeTab === 'withdrawal'} onClick={() => setActiveTab('withdrawal')} themeColor={themeSettings.color} />
                        <TabButton label="انتقال به شریک" active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')} themeColor={themeSettings.color} />
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <Input label="مبلغ (تومان)" name="amount" type="number" value={String(amount)} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} required />
                        <Input label="تاریخ" name="date" type="text" value={date} onChange={(e) => setDate(e.target.value)} required placeholder="YYYY/MM/DD" />

                        {(activeTab === 'deposit' || activeTab === 'withdrawal') && (
                            <>
                                <Select label="صندوق" name="boxType" value={boxType} onChange={(e) => setBoxType(e.target.value as BoxType)}>
                                    <option value="main">صندوق اصلی</option>
                                    <option value="vip">صندوق VIP</option>
                                </Select>
                                <Input label="شرح تراکنش" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                            </>
                        )}
                        
                        {activeTab === 'transfer' && (
                           <>
                             <SearchableSelect
                                label="انتقال به"
                                options={allPartners.filter(p => p.id !== partner.id)}
                                value={destinationPartner}
                                onChange={setDestinationPartner}
                                getOptionLabel={(p: Partner) => p.name}
                                getOptionValue={(p: Partner) => p.id}
                                placeholder="انتخاب شریک مقصد..."
                            />
                             <Input label="توضیحات (اختیاری)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                           </>
                        )}

                        {error && <p className="text-sm text-red-500 text-center py-2">{error}</p>}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                        <button type="submit" className={`px-6 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${themeColorClass}`}>ثبت تراکنش</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TabButton: React.FC<{label: string, active: boolean, onClick: () => void, themeColor: ThemeColor}> = ({ label, active, onClick, themeColor }) => {
    const colorClasses: Record<ThemeColor, string> = {
        blue: 'bg-blue-600 text-white', red: 'bg-red-600 text-white', green: 'bg-green-600 text-white',
        purple: 'bg-purple-600 text-white', orange: 'bg-orange-600 text-white',
    };
    
    const activeClasses = colorClasses[themeColor];
    const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600';

    return (
        <button type="button" onClick={onClick} className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors duration-200 ${active ? activeClasses : inactiveClasses}`}>
            {label}
        </button>
    );
};

export default PartnerTransactionModal;
