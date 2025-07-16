

import React, { useState, useEffect, FormEvent } from 'react';
import { Customer, Invoice, Partner, BoxType, InvoicePayment, Transaction, PartnerTransaction, ThemeColor } from '../types';
import { useDb } from '../contexts/DbContext';
import { getTodayJalaliString } from '../db';
import { useTheme } from '../contexts/ThemeContext';
import SearchableSelect from '../components/SearchableSelect';
import AddPaymentModal from '../components/AddPaymentModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

const Card: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800 rounded-custom shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{title}</h3>
        <div className="p-4">{children}</div>
    </div>
);


const TabButton: React.FC<{ name: string, active: boolean, onClick: () => void }> = ({ name, active, onClick }) => {
    const { themeSettings } = useTheme();
    const activeClasses: Record<ThemeColor, string> = {
        blue: 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400',
        red: 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400',
        green: 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400',
        purple: 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400',
        orange: 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    };
    
    return (
        <button
            onClick={onClick}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                ${active
                    ? activeClasses[themeSettings.color]
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
        >
            {name}
        </button>
    );
};

const PayCustomerInvoice: React.FC = () => {
    const db = useDb();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [paymentModalState, setPaymentModalState] = useState<{ isOpen: boolean; invoice: Invoice | null }>({ isOpen: false, invoice: null });
    const { themeSettings } = useTheme();

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];


    useEffect(() => {
        db.customers.toArray().then(setCustomers);
    }, [db]);

    const fetchCustomerInvoices = async (customerId: string) => {
        const allInvoices = await db.invoices.where('customerId').equals(customerId).toArray();
        const unpaidInvoices = allInvoices.filter(inv => {
            const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
            return paidAmount < inv.totalAmount;
        });
        setInvoices(unpaidInvoices.sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber)));
    };
    
    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerInvoices(selectedCustomer.id);
        } else {
            setInvoices([]);
        }
    }, [selectedCustomer, db]);

    const handleSavePayment = async (invoiceToUpdate: Invoice, newPayment: InvoicePayment) => {
        try {
            await db.transaction('rw', db.invoices, db.cashTransactions, db.customers, async () => {
                const newTransaction: Transaction = {
                    id: `${Date.now()}-payment-${Math.random().toString(36).substr(2, 9)}`,
                    boxType: newPayment.boxType,
                    type: 'income',
                    date: newPayment.date,
                    description: `دریافت از فاکتور ${invoiceToUpdate.invoiceNumber}`,
                    amount: newPayment.amount,
                    invoiceId: invoiceToUpdate.id,
                    invoiceNumber: invoiceToUpdate.invoiceNumber,
                    transactionSubType: 'payment',
                };
                await db.cashTransactions.add(newTransaction);
                
                const updatedPayments = [...invoiceToUpdate.payments, newPayment];
                await db.invoices.update(invoiceToUpdate.id, { payments: updatedPayments });

                // Update customer credit
                const customer = await db.customers.get(invoiceToUpdate.customerId);
                if (customer) {
                    customer.credit += newPayment.amount;
                    await db.customers.put(customer);
                }
            });
            setPaymentModalState({ isOpen: false, invoice: null });
            if (selectedCustomer) {
                fetchCustomerInvoices(selectedCustomer.id);
            }
        } catch (error) {
            console.error("Failed to save payment:", error);
            alert("خطا در ذخیره پرداخت.");
        }
    };

    return (
        <Card title="پرداخت فاکتور مشتری">
            <div className="space-y-4">
                <div className="max-w-md">
                    <SearchableSelect<Customer>
                        label="انتخاب مشتری"
                        options={customers}
                        value={selectedCustomer}
                        onChange={setSelectedCustomer}
                        getOptionLabel={(c) => `${c.firstName} ${c.lastName}`}
                        getOptionValue={(c) => c.id}
                        placeholder="جستجوی مشتری..."
                    />
                </div>
                {selectedCustomer && (
                    <div className="pt-4">
                        {invoices.length > 0 ? (
                            <ul className="space-y-3 mt-4 max-h-96 overflow-y-auto pr-2">
                                {invoices.map(inv => {
                                    const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                                    const balance = inv.totalAmount - paidAmount;
                                    return (
                                        <li key={inv.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-custom border border-slate-200 dark:border-slate-600 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100">فاکتور #{inv.invoiceNumber}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">مانده: <span className="font-mono text-red-500">{formatCurrency(balance)}</span> تومان</p>
                                            </div>
                                            <button onClick={() => setPaymentModalState({ isOpen: true, invoice: inv })} className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${themeColorClass}`}>
                                                ثبت پرداخت
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-center p-8 text-slate-500 dark:text-slate-400">این مشتری هیچ فاکتور پرداخت نشده‌ای ندارد.</p>
                        )}
                    </div>
                )}
                <AddPaymentModal
                    isOpen={paymentModalState.isOpen}
                    onClose={() => setPaymentModalState({ isOpen: false, invoice: null })}
                    invoice={paymentModalState.invoice}
                    onSave={handleSavePayment}
                />
            </div>
        </Card>
    );
};

const CustomerManualTransaction: React.FC = () => {
    const db = useDb();
    const { themeSettings } = useTheme();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState(0);
    const [boxType, setBoxType] = useState<BoxType>('main');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState<{type:'success'|'error', text:string}|null>(null);
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        red: 'bg-red-600 hover:bg-red-700',
        green: 'bg-green-600 hover:bg-green-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
    };

    useEffect(() => {
        db.customers.toArray().then(setCustomers);
    }, [db]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if(!selectedCustomer || amount <= 0 || !description.trim()) {
            setMessage({type: 'error', text: 'لطفا تمام فیلدها را پر کنید.'});
            return;
        }

        try {
            await db.transaction('rw', db.customers, db.cashTransactions, async () => {
                const txId = `ctx-manual-${Date.now()}`;
                
                // Update customer balance
                const customerToUpdate = await db.customers.get(selectedCustomer.id);
                if (!customerToUpdate) throw new Error("Customer not found");
                
                if (txType === 'deposit') {
                    customerToUpdate.credit += amount;
                } else {
                    customerToUpdate.debit += amount;
                }
                await db.customers.put(customerToUpdate);
                
                // Create cash transaction
                const cashTx: Transaction = {
                    id: txId,
                    boxType,
                    type: txType === 'deposit' ? 'income' : 'expense',
                    amount,
                    date: getTodayJalaliString(),
                    description: `${txType === 'deposit' ? 'دریافت دستی از' : 'پرداخت دستی به'} مشتری: ${selectedCustomer.firstName} ${selectedCustomer.lastName} - ${description}`
                };
                await db.cashTransactions.add(cashTx);
            });
            
            setMessage({type:'success', text: 'تراکنش با موفقیت ثبت شد.'});
            setSelectedCustomer(null);
            setAmount(0);
            setDescription('');
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            setMessage({type: 'error', text: 'خطا در ثبت تراکنش.'});
        }
    }

    return (
        <Card title="تراکنش دستی مشتری">
             <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                <SearchableSelect<Customer> label="انتخاب مشتری" options={customers} value={selectedCustomer} onChange={setSelectedCustomer} getOptionLabel={c => `${c.firstName} ${c.lastName}`} getOptionValue={c => c.id} placeholder="جستجوی مشتری..." />
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع تراکنش</label>
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-custom">
                        <button type="button" onClick={() => setTxType('deposit')} className={`flex-1 py-2 px-4 rounded-custom text-sm font-medium transition-colors ${txType === 'deposit' ? `text-white ${colorClasses.green}` : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>دریافت از مشتری (بستانکاری)</button>
                        <button type="button" onClick={() => setTxType('withdrawal')} className={`flex-1 py-2 px-4 rounded-custom text-sm font-medium transition-colors ${txType === 'withdrawal' ? `text-white ${colorClasses.red}` : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>پرداخت به مشتری (بدهکاری)</button>
                    </div>
                </div>
                <input type="number" placeholder="مبلغ" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100" required />
                <select value={boxType} onChange={e => setBoxType(e.target.value as BoxType)} className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                    <option value="main">صندوق اصلی</option>
                    <option value="vip">صندوق VIP</option>
                </select>
                <textarea placeholder="شرح تراکنش..." value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100" rows={3} required />
                <button type="submit" className={`w-full px-4 py-2 text-white rounded-custom shadow-md ${colorClasses[themeSettings.color]}`}>ثبت تراکنش</button>
                {message && <p className={`text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>}
            </form>
        </Card>
    );
};

const PartnerTransactions: React.FC = () => {
    const db = useDb();
    const { themeSettings } = useTheme();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState(0);
    const [boxType, setBoxType] = useState<BoxType>('main');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState<{type:'success'|'error', text:string}|null>(null);
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        red: 'bg-red-600 hover:bg-red-700',
        green: 'bg-green-600 hover:bg-green-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
    };

    useEffect(() => {
        db.partners.toArray().then(setPartners);
    }, [db]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if(!selectedPartner || amount <= 0 || !description.trim()) {
            setMessage({type: 'error', text: 'لطفا تمام فیلدها را پر کنید.'});
            return;
        }

        try {
            await db.transaction('rw', db.partnerTransactions, db.cashTransactions, async () => {
                const txId = `ptx-${Date.now()}`;
                const partnerTx: PartnerTransaction = {
                    id: txId, partnerId: selectedPartner.id, partnerName: selectedPartner.name,
                    type: txType, amount, date: getTodayJalaliString(), description, boxType, relatedPartnerId: undefined, relatedPartnerName: undefined
                };
                await db.partnerTransactions.add(partnerTx);
                
                const cashTx: Transaction = {
                    id: `ctx-${txId}`, boxType, type: txType === 'deposit' ? 'income' : 'expense',
                    amount, date: getTodayJalaliString(),
                    description: `${txType === 'deposit' ? 'واریز از طرف' : 'برداشت برای'} شریک: ${selectedPartner.name} - ${description}`,
                    invoiceId: undefined, invoiceNumber: undefined,
                };
                await db.cashTransactions.add(cashTx);
            });
            setMessage({type:'success', text: 'تراکنش با موفقیت ثبت شد.'});
            setSelectedPartner(null);
            setAmount(0);
            setDescription('');
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            setMessage({type: 'error', text: 'خطا در ثبت تراکنش.'});
        }
    }

    return (
        <Card title="ثبت تراکنش شرکا">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                <SearchableSelect<Partner> label="انتخاب شریک" options={partners} value={selectedPartner} onChange={setSelectedPartner} getOptionLabel={p => p.name} getOptionValue={p => p.id} placeholder="جستجوی شریک..." />
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع تراکنش</label>
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-custom">
                        <button type="button" onClick={() => setTxType('deposit')} className={`flex-1 py-2 px-4 rounded-custom text-sm font-medium transition-colors ${txType === 'deposit' ? `text-white ${colorClasses.green}` : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>واریز به صندوق</button>
                        <button type="button" onClick={() => setTxType('withdrawal')} className={`flex-1 py-2 px-4 rounded-custom text-sm font-medium transition-colors ${txType === 'withdrawal' ? `text-white ${colorClasses.red}` : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>برداشت از صندوق</button>
                    </div>
                </div>
                <input type="number" placeholder="مبلغ" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100" required />
                <select value={boxType} onChange={e => setBoxType(e.target.value as BoxType)} className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                    <option value="main">صندوق اصلی</option>
                    <option value="vip">صندوق VIP</option>
                </select>
                <textarea placeholder="شرح تراکنش..." value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100" rows={3} required />
                <button type="submit" className={`w-full px-4 py-2 text-white rounded-custom shadow-md ${colorClasses[themeSettings.color]}`}>ثبت تراکنش</button>
                {message && <p className={`text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>}
            </form>
        </Card>
    );
};

const CashBoxTransfer: React.FC = () => {
    const db = useDb();
    const { themeSettings } = useTheme();
    const [fromBox, setFromBox] = useState<BoxType>('main');
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState<{type:'success'|'error', text:string}|null>(null);
    
    const toBox: BoxType = fromBox === 'main' ? 'vip' : 'main';
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        red: 'bg-red-600 hover:bg-red-700',
        green: 'bg-green-600 hover:bg-green-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (amount <= 0) {
            setMessage({type: 'error', text: 'مبلغ باید بیشتر از صفر باشد.'});
            return;
        }

        try {
            await db.transaction('rw', db.cashTransactions, async () => {
                const date = getTodayJalaliString();
                const desc = description.trim() || `انتقال از صندوق ${fromBox === 'main' ? 'اصلی' : 'VIP'} به ${toBox === 'main' ? 'اصلی' : 'VIP'}`;
                
                const expenseTx: Transaction = {
                    id: `ctx-tr-out-${Date.now()}`, boxType: fromBox, type: 'expense', amount, date, description: desc, invoiceId: undefined, invoiceNumber: undefined
                };
                const incomeTx: Transaction = {
                    id: `ctx-tr-in-${Date.now()}`, boxType: toBox, type: 'income', amount, date, description: desc, invoiceId: undefined, invoiceNumber: undefined
                };

                await db.cashTransactions.bulkAdd([expenseTx, incomeTx]);
            });
            setMessage({type:'success', text: 'انتقال با موفقیت انجام شد.'});
            setAmount(0);
            setDescription('');
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
             console.error(error);
            setMessage({type: 'error', text: 'خطا در انجام انتقال.'});
        }
    };

    return (
        <Card title="انتقال وجه بین صندوق‌ها">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between gap-4">
                    <select value={fromBox} onChange={e => setFromBox(e.target.value as BoxType)} className="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                        <option value="main">از: صندوق اصلی</option>
                        <option value="vip">از: صندوق VIP</option>
                    </select>
                    <span className="text-xl">&rarr;</span>
                    <div className="flex-1 h-10 px-3 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 rounded-custom flex items-center text-slate-700 dark:text-slate-200">
                        به: صندوق {toBox === 'main' ? 'اصلی' : 'VIP'}
                    </div>
                </div>
                <input type="number" placeholder="مبلغ انتقال" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100" required />
                <textarea placeholder="توضیحات (اختیاری)" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100" rows={2} />
                <button type="submit" className={`w-full px-4 py-2 text-white rounded-custom shadow-md ${colorClasses[themeSettings.color]}`}>انجام انتقال</button>
                {message && <p className={`text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>}
            </form>
        </Card>
    );
};

type FinancialTab = 'payInvoice' | 'customerManual' | 'partner' | 'transfer';

const FinancialTransactionsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<FinancialTab>('payInvoice');
    
    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex flex-wrap gap-6" aria-label="Tabs">
                    <TabButton name="پرداخت فاکتور مشتری" active={activeTab === 'payInvoice'} onClick={() => setActiveTab('payInvoice')} />
                    <TabButton name="تراکنش دستی مشتری" active={activeTab === 'customerManual'} onClick={() => setActiveTab('customerManual')} />
                    <TabButton name="تراکنش شرکا" active={activeTab === 'partner'} onClick={() => setActiveTab('partner')} />
                    <TabButton name="انتقال بین صندوق‌ها" active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')} />
                </nav>
            </div>
            
            <div className="mt-6">
                {activeTab === 'payInvoice' && <PayCustomerInvoice />}
                {activeTab === 'customerManual' && <CustomerManualTransaction />}
                {activeTab === 'partner' && <PartnerTransactions />}
                {activeTab === 'transfer' && <CashBoxTransfer />}
            </div>
        </div>
    );
};

export default FinancialTransactionsPage;