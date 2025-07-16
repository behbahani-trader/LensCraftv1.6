

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Customer, Invoice, Transaction, UserAuthData } from '../types';
import CustomerFormModal from '../components/AddCustomerModal';
import CustomerList from '../components/CustomerList';
import CustomerLedgerPrintLayout from '../components/CustomerLedgerPrintLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../contexts/DbContext';
import { metaDb, formatJalaliForDisplay } from '../db';
import { PrintIcon, ArrowRightIcon, StarIcon, EditIcon, EyeIcon } from '../constants';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';
import InvoiceDetailsModal from '../components/InvoiceDetailsModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

type PaymentStatus = 'پرداخت شده' | 'پرداخت ناقص' | 'پرداخت نشده';

const getPaymentStatus = (invoice: Invoice): { status: PaymentStatus } => {
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = invoice.totalAmount - paidAmount;
    if (balance <= 0) return { status: 'پرداخت شده' };
    if (paidAmount > 0) return { status: 'پرداخت ناقص' };
    return { status: 'پرداخت نشده' };
};

const getPaymentStatusChip = (status: PaymentStatus) => {
    const statusStyles: Record<PaymentStatus, string> = {
        'پرداخت شده': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'پرداخت ناقص': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'پرداخت نشده': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    const style = statusStyles[status];
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>{status}</span>;
};

const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; }> = ({ title, value, subtitle }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </div>
);

const ReportCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <h3 className="p-4 text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{title}</h3>
        {children}
    </div>
);


const CustomerDetailsView: React.FC<{ customer: Customer; onBack: () => void }> = ({ customer, onBack }) => {
    const db = useDb();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);
    const [view, setView] = useState<'details' | 'print'>('details');
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        const fetchData = async () => {
            let invQuery = db.invoices.where('customerId').equals(customer.id);
            if(filters.startDate) invQuery = invQuery.and(inv => inv.issueDate >= filters.startDate);
            if(filters.endDate) invQuery = invQuery.and(inv => inv.issueDate <= filters.endDate);
            const customerInvoices = await invQuery.toArray();
            setInvoices(customerInvoices.sort((a,b) => b.issueDate.localeCompare(a.issueDate)));

            const invoiceIds = customerInvoices.map(inv => inv.id);
            let txQuery = db.cashTransactions.where('invoiceId').anyOf(invoiceIds);
            const customerTxs = await txQuery.toArray();
            setTransactions(customerTxs.sort((a,b) => b.date.localeCompare(a.date)));
        };
        fetchData();
    }, [customer, filters, db]);

    if (view === 'print') {
        return <CustomerLedgerPrintLayout customer={customer} invoices={invoices} transactions={transactions} filters={filters} />;
    }

    const customerBalance = customer.credit - customer.debit;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    دفتر معین: {customer.firstName} {customer.lastName}
                    {customer.isVip && <StarIcon className="w-5 h-5 text-yellow-400 inline-block mr-2" />}
                </h2>
                <div className="flex items-center gap-3">
                     <button onClick={() => setView('print')} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2">
                        <PrintIcon className="w-4 h-4"/> پیش‌نمایش چاپ
                    </button>
                    <button onClick={onBack} className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 rounded-custom flex items-center gap-2">
                        <ArrowRightIcon className="w-4 h-4" /> بازگشت به لیست
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="مانده حساب فعلی" value={formatCurrency(customerBalance)} subtitle={customerBalance < 0 ? 'بدهکار' : 'بستانکار'} />
                <StatCard title="جمع بدهکاری" value={formatCurrency(customer.debit)} />
                <StatCard title="جمع بستانکاری" value={formatCurrency(customer.credit)} />
            </div>

            <ReportCard title="لیست فاکتورها">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">شماره فاکتور</th>
                                <th className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">تاریخ</th>
                                <th className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">مبلغ کل</th>
                                <th className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">وضعیت پرداخت</th>
                                <th className="px-6 py-3 text-center font-medium text-slate-700 dark:text-slate-200">...</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {invoices.length > 0 ? invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-mono text-slate-500">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4">{formatJalaliForDisplay(inv.issueDate)}</td>
                                    <td className="px-6 py-4 font-mono">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="px-6 py-4">{getPaymentStatusChip(getPaymentStatus(inv).status)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => setInvoiceToView(inv)} className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EyeIcon className="w-5 h-5 text-blue-500"/></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center p-6 text-slate-500">فاکتوری برای این مشتری یافت نشد.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </ReportCard>
             <InvoiceDetailsModal isOpen={!!invoiceToView} onClose={() => setInvoiceToView(null)} invoice={invoiceToView} />
        </div>
    );
};


const CustomerLedgerPage: React.FC<{initialState?: any}> = ({ initialState }) => {
    const db = useDb();
    const { hasPermission } = useAuth();
    const [view, setView] = useState<'list' | 'details'>('list');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [unlinkedUsers, setUnlinkedUsers] = useState<UserAuthData[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ vipStatus: 'all' as 'all' | 'vip' | 'normal' });

    const fetchData = useCallback(async () => {
        const [allCustomers, allUsers] = await Promise.all([
            db.customers.toArray(),
            metaDb.users.toArray()
        ]);
        
        const linkedUsernames = new Set(allCustomers.map(c => c.userId).filter(Boolean));
        const availableUsers = allUsers.filter(u => !linkedUsernames.has(u.username) && u.username !== 'mohammad');
        setUnlinkedUsers(availableUsers);
        setCustomers(allCustomers);
    }, [db]);
    
    useEffect(() => {
        fetchData();
        if(initialState?.customerFromCommand) {
            handleViewDetails(initialState.customerFromCommand);
        }
    }, [fetchData, initialState]);

    const handleSaveCustomer = async (customerData: Omit<Customer, 'id'> & { id?: string }) => {
        try {
            await db.transaction('rw', db.customers, async () => {
                let oldCustomer: Customer | undefined;
                if(customerData.id) {
                    oldCustomer = await db.customers.get(customerData.id);
                }
                
                if (oldCustomer?.userId && oldCustomer.userId !== customerData.userId) {
                    // Unlink old user, just in case (though UI should prevent this)
                }

                if (customerData.userId) {
                    // Logic to update user link in customer is implicit via save
                }
                
                if (customerData.id) { // Update
                    await db.customers.put({ ...customerData, id: customerData.id });
                } else { // Create
                    const newCustomer: Customer = { ...customerData, id: Date.now().toString() };
                    await db.customers.add(newCustomer);
                }
            });
            fetchData();
            setIsModalOpen(false);
            setCustomerToEdit(null);
        } catch(error) {
            console.error("Failed to save customer:", error);
        }
    };

    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setView('details');
    };

    const handleEditCustomer = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setCustomerToEdit(null);
        setIsModalOpen(true);
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedCustomer(null);
        fetchData();
    };

    const filteredCustomers = useMemo(() => {
        let filtered = customers;
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(c => 
                c.firstName.toLowerCase().includes(lowercasedFilter) ||
                c.lastName.toLowerCase().includes(lowercasedFilter) ||
                c.phone.includes(lowercasedFilter)
            );
        }
        if (filters.vipStatus !== 'all') {
            const isVip = filters.vipStatus === 'vip';
            filtered = filtered.filter(c => c.isVip === isVip);
        }
        return filtered.sort((a,b) => a.firstName.localeCompare(b.firstName));
    }, [customers, searchTerm, filters]);
    
    const canCreate = hasPermission('page:customers:create');
    
    return (
        <div>
            {view === 'list' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لیست مشتریان</h1>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                           <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="جستجو مشتری..." />
                            {canCreate && <button onClick={handleCreateNew} className="h-10 px-4 flex-shrink-0 text-white font-semibold rounded-custom shadow-md bg-blue-600 hover:bg-blue-700">افزودن مشتری</button>}
                        </div>
                    </div>
                     <CustomerList customers={filteredCustomers} onViewDetails={handleViewDetails} onEdit={canCreate ? handleEditCustomer : undefined} />
                </>
            )}
            {view === 'details' && selectedCustomer && (
                <CustomerDetailsView customer={selectedCustomer} onBack={handleBackToList} />
            )}
            {canCreate && (
                <CustomerFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaveCustomer={handleSaveCustomer}
                    customerToEdit={customerToEdit}
                    unlinkedUsers={unlinkedUsers}
                />
            )}
        </div>
    );
};
export default CustomerLedgerPage;