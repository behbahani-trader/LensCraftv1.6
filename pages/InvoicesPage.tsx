
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Invoice, Customer, Product, Cost, Transaction, InvoicePayment, ShareTransaction, ThemeColor, InvoiceType, BoxType, TransactionType } from '../types';
import InvoiceList from '../components/InvoiceList';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePrintLayout from '../components/InvoicePrintLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../contexts/DbContext';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';

const TabButton: React.FC<{name: string, active: boolean, onClick: () => void}> = ({ name, active, onClick }) => {
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

const InvoicesPage: React.FC<{ initialState?: any }> = ({ initialState }) => {
    const db = useDb();
    const [view, setView] = useState<'list' | 'form' | 'print'>('list');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [costs, setCosts] = useState<Cost[]>([]);
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
    const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
    const [newInvoiceType, setNewInvoiceType] = useState<InvoiceType>('sale');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'main' | 'proforma' | 'return'>('main');
    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
    const createMenuRef = useRef<HTMLDivElement>(null);

    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();

    const refreshInvoicesFromDb = async () => {
        const dbInvoices = await db.invoices.toArray();
        setInvoices(dbInvoices.sort((a,b) => b.issueDate.localeCompare(a.issueDate) || b.invoiceNumber.localeCompare(a.invoiceNumber)));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dbCustomers, dbProducts, dbCosts] = await Promise.all([
                    db.customers.toArray(),
                    db.products.toArray(),
                    db.costs.toArray()
                ]);
                refreshInvoicesFromDb();
                setCustomers(dbCustomers);
                setProducts(dbProducts);
                setCosts(dbCosts);
            } catch (error) {
                console.error("Failed to fetch initial data for invoices page", error);
            }
        };
        fetchData();
    }, [db]);

    useEffect(() => {
        if (initialState?.view === 'form' && initialState?.type) {
            handleCreateNew(initialState.type as InvoiceType);
        }
    }, [initialState]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setIsCreateMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'totalAmount'> & { id?: string }) => {
        try {
            await db.transaction('rw', [db.invoices, db.cashTransactions, db.shares, db.products, db.customers], async () => {
                const isProforma = invoiceData.invoiceType.startsWith('proforma');

                const itemsTotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const costsTotal = (invoiceData.costItems || []).reduce((sum, item) => sum + item.amount, 0);
                const discount = invoiceData.discount || 0;
                const newTotalAmount = itemsTotal + costsTotal - discount;
                
                let oldInvoice: Invoice | undefined;
                if (invoiceData.id) {
                    oldInvoice = await db.invoices.get(invoiceData.id);
                }
                
                const invoiceId = invoiceData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                let invoiceNumber = oldInvoice?.invoiceNumber;
                if (!invoiceNumber) {
                    const lastInvoice = await db.invoices.orderBy('invoiceNumber').last();
                    const lastNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber, 10) : 1000;
                    invoiceNumber = String(lastNum + 1);
                }
                const fullInvoiceData: Invoice = { ...invoiceData, totalAmount: newTotalAmount, invoiceNumber, id: invoiceId };


                if (!isProforma) { 
                    const newTotalPayments = invoiceData.payments.reduce((sum, p) => sum + p.amount, 0);
                    const oldTotalAmount = oldInvoice?.totalAmount || 0;
                    const oldTotalPayments = oldInvoice?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;

                    const customerDebitChange = newTotalAmount - oldTotalAmount;
                    const customerCreditChange = newTotalPayments - oldTotalPayments;

                    if (invoiceData.customerId) {
                        const customer = await db.customers.get(invoiceData.customerId);
                        if (!customer) throw new Error("مشتری برای به‌روزرسانی حساب پیدا نشد.");
                        
                        const balanceMultiplier = (invoiceData.invoiceType === 'sale' || invoiceData.invoiceType === 'return_purchase') ? 1 : -1;

                        customer.debit += customerDebitChange * balanceMultiplier;
                        customer.credit += customerCreditChange;
                        await db.customers.put(customer);
                    }

                    const stockMultiplier = (invoiceData.invoiceType === 'sale' || invoiceData.invoiceType === 'return_purchase') ? -1 : 1;
                    const stockDeltas = new Map<string, number>();
                    const oldProductItems = oldInvoice?.items.filter(i => i.type === 'product') || [];
                    const newProductItems = invoiceData.items.filter(i => i.type === 'product');

                    oldProductItems.forEach(item => { stockDeltas.set(item.productId, (stockDeltas.get(item.productId) || 0) - item.quantity); });
                    newProductItems.forEach(item => { stockDeltas.set(item.productId, (stockDeltas.get(item.productId) || 0) + item.quantity); });

                    if (stockDeltas.size > 0) {
                        const productIds = Array.from(stockDeltas.keys());
                        const productsToUpdate = ((await db.products.bulkGet(productIds)) as Array<Product | undefined>).filter((p): p is Product => Boolean(p));
                        for (const product of productsToUpdate) {
                            const delta = stockDeltas.get(product.id);
                            if (product && typeof product.stock === 'number' && delta) {
                                product.stock += (delta * stockMultiplier);
                            }
                        }
                        await db.products.bulkPut(productsToUpdate);
                    }
                    
                    if(oldInvoice) { 
                        await db.cashTransactions.where({ invoiceId: oldInvoice.id }).delete();
                        await db.shares.where({ invoiceId: oldInvoice.id }).delete();
                    }
                    
                    const isIncome = (invoiceData.invoiceType === 'sale' || invoiceData.invoiceType === 'return_purchase');
                    
                    const paymentTransactions = invoiceData.payments.map(p => ({
                        id: `${invoiceId}-payment-${Math.random().toString(36).substr(2, 9)}`,
                        boxType: p.boxType,
                        type: isIncome ? 'income' : 'expense',
                        date: p.date,
                        description: `پرداخت برای فاکتور ${invoiceNumber}`,
                        amount: p.amount,
                        invoiceId,
                        invoiceNumber,
                        transactionSubType: 'payment' as const,
                    }));
                    
                    const customer = await db.customers.get(fullInvoiceData.customerId);
                    const boxTypeForCosts: BoxType = customer?.isVip ? 'vip' : 'main';
                    
                    const costTransactions = (fullInvoiceData.costItems || []).map(cost => ({
                        id: `${invoiceId}-cost-${cost.costId}-${Math.random().toString(36).substr(2, 9)}`,
                        boxType: boxTypeForCosts,
                        type: 'expense' as TransactionType,
                        date: fullInvoiceData.issueDate,
                        description: `هزینه فاکتور ${invoiceNumber}: ${cost.name}`,
                        amount: cost.amount,
                        invoiceId,
                        invoiceNumber,
                        transactionSubType: 'cost_expense' as const,
                    }));

                    const allNewTransactions = [...paymentTransactions, ...costTransactions];
                    if (allNewTransactions.length > 0) {
                        await db.cashTransactions.bulkAdd(allNewTransactions as Transaction[]);
                    }

                    if (invoiceData.invoiceType === 'sale' || invoiceData.invoiceType === 'return_sale') {
                        const serviceItems = invoiceData.items.filter(item => item.type === 'service');
                        
                        if (invoiceData.invoiceType === 'return_sale') {
                           await db.shares.where({ invoiceId: invoiceId }).delete();
                        } else if (serviceItems.length > 0) { // is sale
                            const customer = await db.customers.get(invoiceData.customerId);
                            const isVip = customer?.isVip || false;
                            const newShareTransactions: ShareTransaction[] = [];
                            const serviceDefinitions = (await db.products.where('id').anyOf(serviceItems.map(i => i.productId)).toArray()) as Product[];
                            const servicesMap = new Map(serviceDefinitions.map(s => [s.id, s]));

                            serviceItems.forEach(serviceItem => {
                                const def = servicesMap.get(serviceItem.productId);
                                if (def?.shareSettings) {
                                    const shares = isVip ? def.shareSettings.vip : def.shareSettings.normal;
                                    const invoicedTotal = serviceItem.unitPrice * serviceItem.quantity;
                                    const mainShareRatio = def.price > 0 ? (shares.mainShare / def.price) : 0;
                                    const commissionShareRatio = def.price > 0 ? (shares.commissionShare / def.price) : 0;
                                    
                                    if(shares.mainShare > 0) newShareTransactions.push({ id: `${invoiceId}-sh-m-${serviceItem.productId}`, invoiceId, invoiceNumber: invoiceNumber!, customerId: invoiceData.customerId!, customerName: invoiceData.customerName!, serviceId: serviceItem.productId, serviceName: serviceItem.name, servicePrice: invoicedTotal, shareType: 'main', amount: invoicedTotal * mainShareRatio, date: invoiceData.issueDate });
                                    if(shares.commissionShare > 0) newShareTransactions.push({ id: `${invoiceId}-sh-c-${serviceItem.productId}`, invoiceId, invoiceNumber: invoiceNumber!, customerId: invoiceData.customerId!, customerName: invoiceData.customerName!, serviceId: serviceItem.productId, serviceName: serviceItem.name, servicePrice: invoicedTotal, shareType: 'commission', amount: invoicedTotal * commissionShareRatio, date: invoiceData.issueDate });
                                }
                            });
                            if (newShareTransactions.length > 0) await db.shares.bulkAdd(newShareTransactions);
                        }
                    }
                }
                
                await db.invoices.put(fullInvoiceData);
            });

            await refreshInvoicesFromDb();
            setView('list');
            setInvoiceToEdit(null);
        } catch (error: any) {
            console.error("Failed to save invoice:", error);
            alert(`خطا در ذخیره سازی فاکتور: ${error.message}`);
        }
    };
    
    const handleDeleteInvoice = async (invoiceId: string) => {
        if (window.confirm("آیا از حذف این فاکتور و تمام تراکنش‌های مرتبط با آن مطمئن هستید؟")) {
            try {
                await db.transaction('rw', [db.invoices, db.cashTransactions, db.shares, db.products, db.customers], async () => {
                    const invoiceToDelete = await db.invoices.get(invoiceId);
                    if (!invoiceToDelete) return;
                    
                    const isProforma = invoiceToDelete.invoiceType.startsWith('proforma');

                    if (!isProforma) {
                        // 1. Customer Debit/Credit Update
                        if (invoiceToDelete.customerId) {
                            const customer = await db.customers.get(invoiceToDelete.customerId);
                            if (customer) {
                                const totalPayments = invoiceToDelete.payments.reduce((sum, p) => sum + p.amount, 0);
                                const balanceMultiplier = (invoiceToDelete.invoiceType === 'sale' || invoiceToDelete.invoiceType === 'return_purchase') ? 1 : -1;
                                customer.debit -= invoiceToDelete.totalAmount * balanceMultiplier;
                                customer.credit -= totalPayments;
                                await db.customers.put(customer);
                            }
                        }

                        // 2. Stock Update
                        const stockMultiplier = (invoiceToDelete.invoiceType === 'sale' || invoiceToDelete.invoiceType === 'return_purchase') ? -1 : 1;
                        const productItems = invoiceToDelete.items.filter(i => i.type === 'product');
                        if(productItems.length > 0) {
                            const productIds = productItems.map(i => i.productId);
                            const productsToUpdate = ((await db.products.bulkGet(productIds)) as Array<Product | undefined>).filter((p): p is Product => Boolean(p));
                            
                            for (const product of productsToUpdate) {
                                const itemInInvoice = productItems.find(i => i.productId === product.id);
                                if (product && itemInInvoice && typeof product.stock === 'number') {
                                    product.stock -= (itemInInvoice.quantity * stockMultiplier);
                                }
                            }
                            await db.products.bulkPut(productsToUpdate);
                        }
                        
                         // 3. Delete related transactions
                        await db.cashTransactions.where({ invoiceId }).delete();
                        await db.shares.where({ invoiceId }).delete();
                    }
                    
                    // 4. Delete Invoice itself
                    await db.invoices.delete(invoiceId);
                });
                await refreshInvoicesFromDb();
            } catch (error) {
                console.error("Failed to delete invoice:", error);
                alert("خطا در حذف فاکتور.");
            }
        }
    };

    const handleCreateNew = (type: InvoiceType) => {
        setNewInvoiceType(type);
        setInvoiceToEdit(null);
        setView('form');
        setIsCreateMenuOpen(false);
    };

    const handleEditInvoice = (invoice: Invoice) => {
        setInvoiceToEdit(invoice);
        setView('form');
    };
    
    const handleCancel = () => {
        setView('list');
        setInvoiceToEdit(null);
        setInvoiceToPrint(null);
    };

    const handlePrintInvoice = (invoice: Invoice) => {
        setInvoiceToPrint(invoice);
        setView('print');
    };
    
    const filteredInvoices = useMemo(() => {
        const tabMap = {
            main: ['sale', 'purchase'],
            proforma: ['proforma_sale', 'proforma_purchase'],
            return: ['return_sale', 'return_purchase'],
        };
        const typesForTab = tabMap[activeTab];

        return invoices.filter(invoice => {
            const typeMatch = typesForTab.includes(invoice.invoiceType);
            if (!typeMatch) return false;
            
            if (!searchTerm.trim()) return true;

            const lowercasedFilter = searchTerm.toLowerCase();
            const numberMatch = invoice.invoiceNumber.toLowerCase().includes(lowercasedFilter);
            const nameMatch = invoice.customerName && invoice.customerName.toLowerCase().includes(lowercasedFilter);
            
            return numberMatch || nameMatch;
        });
    }, [invoices, searchTerm, activeTab]);
    
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

    return (
        <div>
            {view === 'list' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="border-b border-slate-200 dark:border-slate-700 w-full md:w-auto">
                           <nav className="-mb-px flex gap-2" aria-label="Tabs">
                                <TabButton name="اصلی" active={activeTab === 'main'} onClick={() => setActiveTab('main')} />
                                <TabButton name="پیش‌فاکتورها" active={activeTab === 'proforma'} onClick={() => setActiveTab('proforma')} />
                                <TabButton name="مرجوعی‌ها" active={activeTab === 'return'} onClick={() => setActiveTab('return')} />
                            </nav>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <SearchInput
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={"جستجو شماره فاکتور یا مشتری..."}
                            />
                            {hasPermission('page:invoices:create') && (
                                <div className="relative" ref={createMenuRef}>
                                    <button
                                        onClick={() => setIsCreateMenuOpen(prev => !prev)}
                                        className={`h-10 px-4 flex-shrink-0 flex items-center text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors whitespace-nowrap ${colorClasses[themeSettings.color]}`}
                                    >
                                        ایجاد فاکتور جدید
                                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {isCreateMenuOpen && (
                                        <div className="absolute left-0 mt-2 w-56 rounded-custom shadow-lg bg-white dark:bg-slate-700 ring-1 ring-black ring-opacity-5 z-20">
                                            <div className="py-1" role="menu" aria-orientation="vertical">
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleCreateNew('sale'); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">فاکتور فروش</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleCreateNew('purchase'); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">فاکتور خرید</a>
                                                <div className="border-t border-slate-200 dark:border-slate-600 my-1"></div>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleCreateNew('proforma_sale'); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">پیش‌فاکتور فروش</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleCreateNew('proforma_purchase'); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">پیش‌فاکتور خرید</a>
                                                <div className="border-t border-slate-200 dark:border-slate-600 my-1"></div>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleCreateNew('return_sale'); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">فاکتور مرجوعی فروش</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleCreateNew('return_purchase'); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">فاکتور مرجوعی خرید</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-6">
                        {filteredInvoices.length > 0 ? (
                            <InvoiceList
                                invoices={filteredInvoices}
                                customers={customers}
                                onEdit={hasPermission('page:invoices:edit') ? handleEditInvoice : undefined}
                                onDelete={hasPermission('page:invoices:delete') ? handleDeleteInvoice : undefined}
                                onPrint={handlePrintInvoice}
                            />
                        ) : searchTerm ? (
                            <SearchEmptyState />
                        ) : (
                            <InvoiceList invoices={[]} customers={customers} onPrint={handlePrintInvoice} />
                        )}
                    </div>
                </>
            )}

            {view === 'form' && (
                <InvoiceForm
                    onSave={handleSaveInvoice}
                    onCancel={handleCancel}
                    customers={customers}
                    products={products}
                    costs={costs}
                    invoiceToEdit={invoiceToEdit}
                    invoiceType={invoiceToEdit?.invoiceType || newInvoiceType}
                />
            )}
            
            {view === 'print' && invoiceToPrint && (
                <InvoicePrintLayout 
                    invoice={invoiceToPrint}
                    onBack={handleCancel}
                />
            )}
        </div>
    );
};

export default InvoicesPage;
