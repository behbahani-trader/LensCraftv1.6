import { ALL_PERMISSION_IDS } from './permissions';

export type Theme = 'light' | 'dark';

export type ThemeColor = 'blue' | 'red' | 'green' | 'purple' | 'orange';
export type FontSize = 'sm' | 'base' | 'lg';
export type BorderRadius = 'none' | 'md' | 'full';
export type FontFamily = 'Vazirmatn' | 'Roboto' | 'Noto Sans' | 'IRANSans';

export interface ThemeSettings {
  color: ThemeColor;
  fontSize: FontSize;
  borderRadius: BorderRadius;
  fontFamily: FontFamily;
  backgroundType: 'image' | 'color';
  backgroundImage: string;
  backgroundColor: string;
  textColor: string;
  sidebarMode: 'full' | 'compact';
}

export interface AppSettings {
    loginEnabled: boolean;
    loginRequired: boolean;
}

export interface AISettings {
    apiKey: string;
}

export interface TelegramSettings {
    botToken: string;
    messageTemplate: string;
}

export interface DashboardSettings {
    widgets: WidgetConfig[];
    layout: 'grid'; // Future: could be 'masonry' etc.
}

export interface WidgetConfig {
    id: WidgetID;
    enabled: boolean;
}

export type WidgetID = 'quickStats' | 'quickAccess' | 'topCustomers' | 'recentInvoices';


export type Page = 'home' | 'personalization' | 'customerLedger' | 'products' | 'services' | 'invoices' | 'profile' | 'orders' | 'reports' | 'about' | 'backup' | 'mainCashBox' | 'vipCashBox' | 'costs' | 'ai' | 'aiSettings' | 'shares' | 'partners' | 'partnerReport' | 'wastage' | 'userManagement' | 'clientServicesReport' | 'expenses' | 'shareSettings' | 'printSettings' | 'financialTransactions' | 'inventory' | 'telegramSettings' | 'fiscalYears';

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    debit: number;
    credit: number;
    telegramChatId: string;
    isVip: boolean;
    userId?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'product' | 'service';
  stock?: number; // For products
  shareSettings?: { // For services
    normal: {
        mainShare: number;
        commissionShare: number;
    };
    vip: {
        mainShare: number;
        commissionShare: number;
    };
  };
}

export interface Cost {
    id: string;
    name: string;
    amount: number;
}

export interface Expense {
    id: string;
    date: string; // YYYY/MM/DD
    amount: number;
    category: string;
    description: string;
}

export interface InvoiceItem {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    type: 'product' | 'service';
}

export interface InvoiceCostItem {
    costId: string;
    name: string;
    amount: number;
}

export type OrderStatus = 'pending' | 'completed';

export interface InvoicePayment {
    date: string; // YYYY/MM/DD
    amount: number;
    boxType: BoxType;
}

export type InvoiceType = 'sale' | 'purchase' | 'proforma_sale' | 'proforma_purchase' | 'return_sale' | 'return_purchase';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    issueDate: string; // YYYY/MM/DD
    items: InvoiceItem[];
    costItems?: InvoiceCostItem[];
    totalAmount: number;
    invoiceType: InvoiceType;
    orderStatus?: OrderStatus; // For services
    payments: InvoicePayment[];
    discount?: number;
}

export type BoxType = 'main' | 'vip';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    boxType: BoxType;
    type: TransactionType;
    amount: number;
    date: string;
    description: string;
    invoiceId?: string;
    invoiceNumber?: string;
    transactionSubType?: 'payment' | 'cost_expense';
}

export interface ShareTransaction {
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    shareType: 'main' | 'commission';
    amount: number;
    date: string; // YYYY/MM/DD
}

export interface User {
    username: string;
    permissions: Permission[];
    customerId?: string;
    roleId?: string;
}

export interface UserAuthData {
    username: string;
    password?: string;
    roleId?: string;
}

export interface Partner {
    id: string;
    name: string;
    initialBalance: number;
}

export type PartnerTransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';

export interface PartnerTransaction {
    id: string;
    partnerId: string;
    partnerName: string;
    type: PartnerTransactionType;
    amount: number;
    date: string;
    description: string;
    boxType?: BoxType; // for deposit/withdrawal
    relatedPartnerId?: string; // for transfers
    relatedPartnerName?: string; // for transfers
}

export interface Wastage {
    id: string;
    transactionId: string; // To link to the expense transaction
    date: string;
    title: string;
    totalCost: number;
    description: string;
    boxType: BoxType;
}

export type Permission = typeof ALL_PERMISSION_IDS[number];


export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface PrintSettings {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    logo: string;
    invoiceTitle: string;
    invoiceFooter: string;
    paperSize: 'A4' | 'A5';
    fontSize: 'sm' | 'base' | 'lg';
}

export interface LedgerPrintSettings {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    logo: string;
    reportTitle: string;
    showInvoices: boolean;
    showTransactions: boolean;
    paperSize: 'A4' | 'A5';
    fontSize: 'sm' | 'base' | 'lg';
}

export interface FiscalYear {
  id: string; // e.g., '1403'
  name: string; // e.g., 'سال مالی ۱۴۰۳'
}
