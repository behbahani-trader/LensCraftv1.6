import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, OrderStatus, InvoicePayment, Transaction, Customer } from '../types';
import { formatJalaliForDisplay, getTodayJalaliString } from '../db';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';
import AddPaymentModal from '../components/AddPaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDb } from '../contexts/DbContext';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};

const OrderStatusButton: React.FC<{ status: OrderStatus; onClick: () => void; disabled: boolean }> = ({ status, onClick, disabled }) => {
    const isCompleted = status === 'completed';
    const classes = isCompleted
        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    const hoverClasses = !disabled ? 'hover:bg-green-200 dark:hover:bg-green-900' : '';
    const label = isCompleted ? 'تکمیل شد' : 'در حال آماده سازی';
    
    return (
        <button 
            onClick={onClick} 
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${classes} ${!disabled && 'hover:bg-opacity-80'}`}
            disabled={disabled}
        >
            {label}
        </button>
    );
};

const PaymentStatusChip: React.FC<{ invoice: Invoice; onOpenModal: (invoice: Invoice) => void; disabled: boolean }> = ({ invoice, onOpenModal, disabled }) => {
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const isPaid = paidAmount >= invoice.totalAmount;

    if (isPaid) {
        const classes = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>تسویه شده</span>;
    }

    const classes = `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 ${!disabled ? 'hover:bg-yellow-200 dark:hover:bg-yellow-800 dark:hover:text-yellow-200 cursor-pointer' : 'opacity-70'}`;
    return (
        <button onClick={() => onOpenModal(invoice)} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${classes}`} disabled={disabled}>
            تسویه نشده
        </button>
    );
};


const EmptyState: React.FC<{ isClient: boolean }> = ({ isClient }) => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isClient ? 'شما هیچ سفارش فعالی ندارید' : 'هیچ سفارش خدمتی یافت نشد'}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
             {isClient ? 'وقتی خدمتی برای شما ثبت شود، در اینجا نمایش داده می‌شود.' : 'وقتی فاکتوری شامل خدمت ثبت کنید، در اینجا نمایش داده می‌شود.'}
        </p>
    </div>
);

const OrdersPage: React.FC = () => {
    const db = useDb();
    const [orders, setOrders] = useState<Invoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: getTodayJalaliString(),
        endDate: getTodayJalaliString(),
        orderStatus: 'all' as OrderStatus | 'all',
        paymentStatus: 'all' as 'all' | 'unpaid' | 'paid',
    });
    const [paymentModalState, setPaymentModalState] = useState<{ isOpen: boolean; invoice: Invoice | null }>({ isOpen: false, invoice: null });
    const { currentUser, hasPermission } = useAuth();
    const { themeSettings } = useTheme();
    const isClientView = !!currentUser?.customerId;

    useEffect(() => {
        const fetchAndProcessOrders = async () => {
            try {
                let query = db.invoices.toCollection();
                if (isClientView && currentUser.customerId) {
                   query = db.invoices.where('customerId').equals(currentUser.customerId);
                }
                
                const invoices: Invoice[] = await query.toArray();

                const serviceOrders = invoices.filter(invoice => 
                    invoice.items.some(item => item.type === 'service')
                );

                serviceOrders.sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.invoiceNumber.localeCompare(a.invoiceNumber));
                setOrders(serviceOrders);
            } catch (error) {
                console.error("Failed to process orders from DB", error);
                setOrders([]);
            }
        };
        fetchAndProcessOrders();
    }, [isClientView, currentUser?.customerId, db]);

    const handleToggleStatus = async (orderToUpdate: Invoice) => {
        const newStatus: OrderStatus = (orderToUpdate.orderStatus || 'pending') === 'pending' ? 'completed' : 'pending';
        
        await db.invoices.update(orderToUpdate.id, { orderStatus: newStatus });

        setOrders(prevOrders => prevOrders.map(order => 
            (order.id === orderToUpdate.id)
            ? { ...order, orderStatus: newStatus }
            : order
        ));
    };

    const handleOpenPaymentModal = (invoice: Invoice) => {
        setPaymentModalState({ isOpen: true, invoice });
    };

    const handleClosePaymentModal = () => {
        setPaymentModalState({ isOpen: false, invoice: null });
    };

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

            setOrders(prevOrders => prevOrders.map(order => 
                order.id === invoiceToUpdate.id 
                ? { ...order, payments: [...order.payments, newPayment] } 
                : order
            ));

            handleClosePaymentModal();
        } catch (error) {
            console.error("Failed to save payment:", error);
            alert("خطا در ذخیره پرداخت. لطفا دوباره تلاش کنید.");
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilters({
            startDate: '',
            endDate: '',
            orderStatus: 'all',
            paymentStatus: 'all',
        });
    };

    const filteredOrders = useMemo(() => {
        let filtered = [...orders];

        if (isClientView) {
            // Clients can only search by service name
            if (searchTerm.trim()) {
                const lowercasedFilter = searchTerm.toLowerCase();
                 filtered = filtered.filter(item =>
                    item.items.some(service => service.name.toLowerCase().includes(lowercasedFilter))
                );
            }
            return filtered;
        }

        // Admin/Employee filters
        if (searchTerm.trim()) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.items.some(service => service.name.toLowerCase().includes(lowercasedFilter)) ||
                item.customerName.toLowerCase().includes(lowercasedFilter) ||
                item.invoiceNumber.toLowerCase().includes(lowercasedFilter)
            );
        }
        
        if (filters.startDate) {
            filtered = filtered.filter(order => order.issueDate >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(order => order.issueDate <= filters.endDate);
        }
        
        if (filters.orderStatus !== 'all') {
            filtered = filtered.filter(order => (order.orderStatus || 'pending') === filters.orderStatus);
        }
        
        if (filters.paymentStatus !== 'all') {
            filtered = filtered.filter(order => {
                const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
                const isPaid = paidAmount >= order.totalAmount;
                return filters.paymentStatus === 'paid' ? isPaid : !isPaid;
            });
        }

        return filtered;
    }, [orders, searchTerm, filters, isClientView]);

    const hasActiveFilters = !isClientView && (searchTerm.trim() !== '' || filters.startDate !== '' || filters.endDate !== '' || filters.orderStatus !== 'all' || filters.paymentStatus !== 'all');
    const canEditOrders = hasPermission('page:orders:edit');

    const badgeColorClasses = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
    };
    const themeBadgeClass = badgeColorClasses[themeSettings.color];

    return (
         <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {isClientView ? 'سفارشات من' : 'پیگیری سفارشات'}
            </h1>
            
            {!isClientView ? (
                 <div className="bg-white dark:bg-slate-800/50 p-4 rounded-custom border border-slate-200 dark:border-slate-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                        <div className="w-full md:col-span-2 lg:col-span-3 xl:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">جستجو</label>
                            <SearchInput
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="نام، مشتری، شماره..."
                            />
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">از تاریخ</label>
                            <input id="startDate" name="startDate" type="text" placeholder="مثال: ۱۴۰۳/۰۱/۰۱" value={filters.startDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تا تاریخ</label>
                            <input id="endDate" name="endDate" type="text" placeholder="مثال: ۱۴۰۳/۱۲/۲۹" value={filters.endDate} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"/>
                        </div>
                        <div>
                            <label htmlFor="orderStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وضعیت سفارش</label>
                            <select id="orderStatus" name="orderStatus" value={filters.orderStatus} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
                                <option value="all">همه</option>
                                <option value="pending">در حال آماده سازی</option>
                                <option value="completed">تکمیل شده</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="paymentStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وضعیت تسویه</label>
                            <select id="paymentStatus" name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange} className="h-10 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
                                <option value="all">همه</option>
                                <option value="paid">تسویه شده</option>
                                <option value="unpaid">تسویه نشده</option>
                            </select>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="mt-4 flex items-center justify-end">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors"
                            >
                                حذف فیلترها
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-sm">
                     <SearchInput
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="جستجو در نام خدمات..."
                    />
                </div>
            )}
             

             {filteredOrders.length > 0 ? (
                <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">شماره فاکتور</th>
                                    {!isClientView && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مشتری</th>}
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">خدمات سفارش</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">تعداد</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">مبلغ فاکتور</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">تاریخ</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">وضعیت سفارش</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">وضعیت تسویه</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredOrders.map((order) => {
                                    const serviceItems = order.items.filter(item => item.type === 'service');
                                    const serviceNames = serviceItems.map(item => item.name).join(', ');
                                    const serviceCount = serviceItems.reduce((sum, item) => sum + item.quantity, 0);

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{order.invoiceNumber}</td>
                                            {!isClientView && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{order.customerName}</td>}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-sm truncate" title={serviceNames}>{serviceNames}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono">
                                                <span
                                                    className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold
                                                        ${serviceCount > 0 ? themeBadgeClass : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                                                >
                                                    {serviceCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(order.totalAmount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatJalaliForDisplay(order.issueDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <OrderStatusButton status={order.orderStatus || 'pending'} onClick={() => handleToggleStatus(order)} disabled={!canEditOrders || isClientView} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <PaymentStatusChip invoice={order} onOpenModal={handleOpenPaymentModal} disabled={!canEditOrders || isClientView} />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : hasActiveFilters || (isClientView && searchTerm) ? (
                <SearchEmptyState />
            ) : (
                <EmptyState isClient={isClientView} />
            )}
            <AddPaymentModal
                isOpen={paymentModalState.isOpen}
                onClose={handleClosePaymentModal}
                invoice={paymentModalState.invoice}
                onSave={handleSavePayment}
            />
        </div>
    );
};

export default OrdersPage;