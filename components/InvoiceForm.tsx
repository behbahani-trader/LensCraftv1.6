import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, Customer, Product, Cost, InvoiceCostItem, OrderStatus, InvoicePayment, BoxType, InvoiceType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getTodayJalaliString } from '../db';
import SearchableSelect from './SearchableSelect';

// Helper components are defined at the module level to prevent re-creation on each render,
// which solves issues like input fields losing focus during typing.
const Input: React.FC<any> = ({ label, name, ...props }) => (
    <div>
        {label && <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
        <input id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
    </div>
);

const Select: React.FC<any> = ({ label, name, children, ...props }) => (
    <div>
        {label && <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
        <select id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100">
            {children}
        </select>
    </div>
);


interface InvoiceFormProps {
  onSave: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'totalAmount'> & { id?: string }) => void;
  onCancel: () => void;
  customers: Customer[];
  products: Product[];
  costs: Cost[];
  invoiceToEdit: Invoice | null;
  invoiceType: InvoiceType;
}

const today = getTodayJalaliString();

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel, customers, products, costs, invoiceToEdit, invoiceType }) => {
    const { themeSettings } = useTheme();
    const [formData, setFormData] = useState({
        invoiceType: invoiceToEdit?.invoiceType || invoiceType,
        customerId: '',
        customerName: '',
        issueDate: today,
        items: [] as InvoiceItem[],
        costItems: [] as InvoiceCostItem[],
        payments: [] as InvoicePayment[],
        orderStatus: undefined as OrderStatus | undefined,
        discount: 0,
    });
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    useEffect(() => {
        if (invoiceToEdit) {
            setFormData({
                invoiceType: invoiceToEdit.invoiceType,
                customerId: invoiceToEdit.customerId || '',
                customerName: invoiceToEdit.customerName || '',
                issueDate: invoiceToEdit.issueDate,
                items: invoiceToEdit.items,
                costItems: invoiceToEdit.costItems || [],
                payments: invoiceToEdit.payments || [],
                orderStatus: invoiceToEdit.orderStatus,
                discount: invoiceToEdit.discount || 0,
            });
        } else {
             setFormData({
                invoiceType: invoiceType,
                customerId: '',
                customerName: '',
                issueDate: today,
                items: [],
                costItems: [],
                payments: [],
                orderStatus: undefined,
                discount: 0,
            });
        }
    }, [invoiceToEdit, invoiceType]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'discount') {
            setFormData(prev => ({...prev, discount: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({...prev, [name]: value}));
        }
    };

    const handleCustomerChange = (customer: Customer | null) => {
        setFormData(prev => ({
            ...prev,
            customerId: customer ? customer.id : '',
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : ''
        }));
    };
    
    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formData.items] as InvoiceItem[];
        const item = newItems[index];
        (item as any)[field] = value;

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if(product) {
                item.name = product.name;
                item.unitPrice = product.price;
                item.type = product.type;
            }
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', name: '', quantity: 1, unitPrice: 0, type: 'product' }]
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleAddCostItem = (cost: Cost | null) => {
        if (!cost) return;

        if (cost && !formData.costItems.some(ci => ci.costId === cost.id)) {
            const newCostItem: InvoiceCostItem = {
                costId: cost.id,
                name: cost.name,
                amount: cost.amount,
            };
            setFormData(prev => ({
                ...prev,
                costItems: [...prev.costItems, newCostItem]
            }));
        }
    };

    const removeCostItem = (costId: string) => {
        setFormData(prev => ({
            ...prev,
            costItems: prev.costItems.filter(ci => ci.costId !== costId)
        }));
    };
    
    const handleCostItemChange = (index: number, newAmountStr: string) => {
        const newAmount = parseFloat(newAmountStr) || 0;
        const newCostItems = [...formData.costItems];
        newCostItems[index].amount = newAmount;
        setFormData(prev => ({ ...prev, costItems: newCostItems }));
    };

    const handlePaymentChange = (index: number, field: keyof InvoicePayment, value: any) => {
        const newPayments = [...formData.payments];
        const payment = newPayments[index];
        (payment as any)[field] = value;
        setFormData(prev => ({ ...prev, payments: newPayments }));
    };

    const addPayment = () => {
        const customer = formData.invoiceType === 'sale' ? customers.find(c => c.id === formData.customerId) : null;
        const defaultBoxType: BoxType = customer?.isVip ? 'vip' : 'main';
        
        setFormData(prev => ({
            ...prev,
            payments: [...prev.payments, { date: today, amount: 0, boxType: defaultBoxType }]
        }));
    };

    const removePayment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            payments: prev.payments.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerId) {
            const party = formData.invoiceType.includes('purchase') ? 'فروشنده' : 'مشتری';
            alert(`لطفا یک ${party} انتخاب کنید.`);
            return;
        }
        if(formData.items.length === 0 && formData.costItems.length === 0) {
            alert('فاکتور باید حداقل یک آیتم داشته باشد.');
            return;
        }
        
        const hasService = formData.items.some(item => item.type === 'service');

        const dataToSave = { 
            ...formData, 
            id: invoiceToEdit?.id,
            orderStatus: (formData.invoiceType === 'sale' && hasService) ? (formData.orderStatus || 'pending') : undefined
        };
        onSave(dataToSave);
    };

    const productTotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const costsTotal = formData.costItems.reduce((sum, item) => sum + item.amount, 0);
    const discount = formData.discount || 0;
    const totalAmount = productTotal + costsTotal - discount;
    const paidAmount = formData.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balanceDue = totalAmount - paidAmount;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(Math.round(amount));

    const renderProductOption = (p: Product) => (
        <div className="flex justify-between items-center w-full">
            <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</div>
                <div className="text-xs">
                    {p.type === 'service' ? 
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">خدمت</span> : 
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">محصول</span>
                    }
                </div>
            </div>
            <div className="text-sm font-mono text-green-600 dark:text-green-400">
                {formatCurrency(p.price)} تومان
            </div>
        </div>
    );
    
    const getInvoiceTitle = (type: InvoiceType, number?: string): string => {
        const prefix = number ? 'ویرایش' : 'ایجاد';
        const suffix = number ? ` ${number}` : ' جدید';
        switch (type) {
            case 'sale': return `${prefix} فاکتور فروش${suffix}`;
            case 'purchase': return `${prefix} فاکتور خرید${suffix}`;
            case 'proforma_sale': return `${prefix} پیش‌فاکتور فروش${suffix}`;
            case 'proforma_purchase': return `${prefix} پیش‌فاکتور خرید${suffix}`;
            case 'return_sale': return `${prefix} فاکتور مرجوعی فروش${suffix}`;
            case 'return_purchase': return `${prefix} فاکتور مرجوعی خرید${suffix}`;
            default: return `${prefix} فاکتور${suffix}`;
        }
    };

    const title = getInvoiceTitle(formData.invoiceType, invoiceToEdit?.invoiceNumber);
    const partyLabel = formData.invoiceType.includes('purchase') ? "فروشنده" : "مشتری";
    const paymentLabel = formData.invoiceType.includes('purchase') ? 'پرداخت به فروشنده' : 'دریافت از مشتری';

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">{title}</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Customer/Supplier and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableSelect
                        label={partyLabel}
                        options={customers}
                        value={customers.find(c => c.id === formData.customerId) || null}
                        onChange={handleCustomerChange}
                        getOptionLabel={(c: Customer) => `${c.firstName} ${c.lastName}`}
                        getOptionValue={(c: Customer) => c.id}
                        placeholder={`جستجوی ${partyLabel}...`}
                    />
                    <Input label="تاریخ صدور" name="issueDate" type="text" placeholder="YYYY/MM/DD" value={formData.issueDate} onChange={handleInputChange} required/>
                </div>

                {/* Items Section */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">آیتم های فاکتور</h3>
                    {/* Desktop Headers */}
                    <div className="hidden md:grid md:grid-cols-[1fr_96px_128px_128px_48px] gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-t-custom text-sm">
                        <div className="font-medium text-slate-600 dark:text-slate-300">محصول/خدمت</div>
                        <div className="font-medium text-slate-600 dark:text-slate-300">تعداد</div>
                        <div className="font-medium text-slate-600 dark:text-slate-300">قیمت واحد</div>
                        <div className="font-medium text-slate-600 dark:text-slate-300">جمع کل</div>
                        <div></div>
                    </div>
                    {/* Items List */}
                    <div className="space-y-4 md:space-y-0">
                        {formData.items.map((item, index) => (
                            <div key={index} className={`md:grid md:grid-cols-[1fr_96px_128px_128px_48px] md:gap-2 md:items-start space-y-2 md:space-y-0 p-4 md:p-2 border md:border-0 md:border-t border-slate-200 dark:border-slate-700 rounded-custom md:rounded-none ${activeRowIndex === index ? 'relative z-10' : ''}`}>
                                <div>
                                    <label className="md:hidden text-xs font-bold mb-1 block">محصول/خدمت</label>
                                    <SearchableSelect
                                        options={products}
                                        value={products.find(p => p.id === item.productId) || null}
                                        onChange={(product) => handleItemChange(index, 'productId', product?.id || '')}
                                        getOptionLabel={(p: Product) => p.name}
                                        getOptionValue={(p: Product) => p.id}
                                        renderOption={renderProductOption}
                                        placeholder="جستجوی محصول یا خدمت..."
                                        onOpen={() => setActiveRowIndex(index)}
                                        onClose={() => setActiveRowIndex(null)}
                                    />
                                </div>
                                <div>
                                    <label className="md:hidden text-xs font-bold mb-1 block">تعداد</label>
                                    <Input name="quantity" type="number" value={String(item.quantity)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} min={1}/>
                                </div>
                                <div>
                                    <label className="md:hidden text-xs font-bold mb-1 block">قیمت واحد</label>
                                    <Input name="unitPrice" type="number" value={String(item.unitPrice)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} min={0} />
                                </div>
                                <div>
                                    <label className="md:hidden text-xs font-bold mb-1 block">جمع کل</label>
                                    <div className="h-10 flex items-center font-mono text-slate-800 dark:text-slate-100">{formatCurrency(item.quantity * item.unitPrice)}</div>
                                </div>
                                <div className="text-center md:pt-1">
                                    <button type="button" onClick={() => removeItem(index)} className="w-full md:w-auto text-red-500 hover:text-red-700 p-2 md:p-1 rounded-custom hover:bg-red-100 dark:hover:bg-red-900/50">
                                        <span className="md:hidden">حذف آیتم</span>
                                        <svg className="hidden md:block w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addItem} className="mt-2 text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-700">
                        + افزودن ردیف
                    </button>
                </div>

                {/* Additional Costs */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">هزینه‌های اضافی</h3>
                    {formData.costItems.length > 0 && (
                        <>
                            <div className="hidden md:grid md:grid-cols-[1fr_128px_48px] gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-t-custom text-sm">
                                <div className="font-medium text-slate-600 dark:text-slate-300">شرح هزینه</div>
                                <div className="font-medium text-slate-600 dark:text-slate-300">مبلغ</div>
                                <div></div>
                            </div>
                            <div className="space-y-4 md:space-y-0">
                                {formData.costItems.map((costItem, index) => (
                                    <div key={costItem.costId} className="md:grid md:grid-cols-[1fr_128px_48px] md:gap-2 md:items-start p-4 md:p-2 border md:border-0 md:border-t border-slate-200 dark:border-slate-700 rounded-custom md:rounded-none">
                                        <div className="mb-2 md:mb-0">
                                            <label className="md:hidden text-xs font-bold mb-1 block">شرح هزینه</label>
                                            <p className="h-10 flex items-center font-semibold text-slate-800 dark:text-slate-100">{costItem.name}</p>
                                        </div>
                                        <div className="mb-2 md:mb-0">
                                            <label className="md:hidden text-xs font-bold mb-1 block">مبلغ</label>
                                            <Input
                                                name={`cost-amount-${costItem.costId}`}
                                                type="number"
                                                value={String(costItem.amount)}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCostItemChange(index, e.target.value)}
                                            />
                                        </div>
                                        <div className="text-center md:pt-1">
                                            <button type="button" onClick={() => removeCostItem(costItem.costId)} className="w-full md:w-auto text-red-500 hover:text-red-700 p-2 md:p-1 rounded-custom hover:bg-red-100 dark:hover:bg-red-900/50">
                                                <span className="md:hidden">حذف هزینه</span>
                                                <svg className="hidden md:block w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                     <div className="flex items-center gap-2">
                        <SearchableSelect
                            options={costs.filter(c => !formData.costItems.some(ci => ci.costId === c.id))}
                            value={null}
                            onChange={handleAddCostItem}
                            getOptionLabel={(c: Cost) => `${c.name} (${formatCurrency(c.amount)} تومان)`}
                            getOptionValue={(c: Cost) => c.id}
                            placeholder="افزودن هزینه (جستجو کنید)..."
                        />
                    </div>
                </div>

                {/* Payments Section */}
                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                        {paymentLabel}
                    </h3>
                    {formData.payments.length > 0 && (
                        <>
                            <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_48px] gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-t-custom text-sm">
                                <div className="font-medium text-slate-600 dark:text-slate-300">تاریخ</div>
                                <div className="font-medium text-slate-600 dark:text-slate-300">مبلغ</div>
                                <div className="font-medium text-slate-600 dark:text-slate-300">{formData.invoiceType === 'sale' ? 'صندوق مقصد' : 'صندوق مبدا'}</div>
                                <div></div>
                            </div>
                            <div className="space-y-4 md:space-y-0">
                                {formData.payments.map((payment, index) => (
                                    <div key={index} className="md:grid md:grid-cols-[1fr_1fr_1fr_48px] md:gap-2 md:items-start p-4 md:p-2 border md:border-0 md:border-t border-slate-200 dark:border-slate-700 rounded-custom md:rounded-none">
                                        <div className="mb-2 md:mb-0">
                                            <label className="md:hidden text-xs font-bold mb-1 block">تاریخ</label>
                                            <Input name="date" type="text" value={payment.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePaymentChange(index, 'date', e.target.value)} />
                                        </div>
                                        <div className="mb-2 md:mb-0">
                                            <label className="md:hidden text-xs font-bold mb-1 block">مبلغ</label>
                                            <Input name="amount" type="number" value={String(payment.amount)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePaymentChange(index, 'amount', parseFloat(e.target.value) || 0)} />
                                        </div>
                                        <div className="mb-2 md:mb-0">
                                             <label className="md:hidden text-xs font-bold mb-1 block">{formData.invoiceType === 'sale' ? 'صندوق مقصد' : 'صندوق مبدا'}</label>
                                            <Select name="boxType" value={payment.boxType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePaymentChange(index, 'boxType', e.target.value as BoxType)}>
                                                <option value="main">صندوق اصلی</option>
                                                <option value="vip">صندوق VIP</option>
                                            </Select>
                                        </div>
                                        <div className="text-center md:pt-1">
                                            <button type="button" onClick={() => removePayment(index)} className="w-full md:w-auto text-red-500 hover:text-red-700 p-2 md:p-1 rounded-custom hover:bg-red-100 dark:hover:bg-red-900/50">
                                                <span className="md:hidden">حذف پرداخت</span>
                                                 <svg className="hidden md:block w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    <button type="button" onClick={addPayment} className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-700">
                        + ثبت پرداخت جدید
                    </button>
                </div>
                
                {/* Total */}
                <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="w-full max-w-sm space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-300">جمع جزء (آیتم‌ها + هزینه‌ها):</span>
                            <span className="font-mono">{formatCurrency(productTotal + costsTotal)} تومان</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="discount" className="text-slate-600 dark:text-slate-300 font-medium">تخفیف:</label>
                            <div className="w-40">
                                <Input id="discount" name="discount" type="number" value={String(formData.discount)} onChange={handleInputChange} min="0" />
                            </div>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">
                            <span className="text-slate-800 dark:text-slate-100">جمع کل (پس از تخفیف):</span>
                            <span className="font-mono">{formatCurrency(totalAmount)} تومان</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-300">مبلغ پرداخت شده:</span>
                            <span className="font-mono text-green-600">{formatCurrency(paidAmount)} تومان</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t-2 border-slate-400 dark:border-slate-500 pt-2 mt-2">
                            <span className="text-slate-800 dark:text-slate-100">مانده:</span>
                            <span className={`font-mono ${balanceDue > 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>{formatCurrency(balanceDue)} تومان</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                    <button type="submit" className={`px-6 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${themeSettings.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>ذخیره فاکتور</button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;