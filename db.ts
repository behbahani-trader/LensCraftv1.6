import Dexie, { type Table } from 'dexie';
import { Customer, Product, Invoice, UserAuthData, Transaction, Cost, Expense, ShareTransaction, Partner, PartnerTransaction, Wastage, Role, FiscalYear } from './types';
import { ALL_PERMISSION_IDS } from './permissions';

// --- Meta Database for global data ---
export const metaDb = new Dexie('LensCraftMetaDB') as Dexie & {
    fiscalYears: Table<FiscalYear, string>;
    users: Table<UserAuthData, string>;
    roles: Table<Role, string>;
};

metaDb.version(1).stores({
    fiscalYears: 'id, name',
    users: 'username, roleId',
    roles: 'id, name'
});

// --- Fiscal Year Specific Database Factory ---
// This will hold Dexie instances once they are created.
const dbInstances = new Map<string, Dexie>();

export function getDbForFiscalYear(fiscalYearId: string) {
    if (!fiscalYearId) {
        throw new Error("Fiscal year ID cannot be empty.");
    }

    // Return the cached instance if it exists
    if (dbInstances.has(fiscalYearId)) {
        return dbInstances.get(fiscalYearId) as Dexie & {
            customers: Table<Customer, string>;
            products: Table<Product, string>;
            invoices: Table<Invoice, string>;
            cashTransactions: Table<Transaction, string>;
            costs: Table<Cost, string>;
            expenses: Table<Expense, string>;
            shares: Table<ShareTransaction, string>;
            partners: Table<Partner, string>;
            partnerTransactions: Table<PartnerTransaction, string>;
            wastages: Table<Wastage, string>;
        };
    }

    const dbName = `LensCraftData_${fiscalYearId}`;
    const db = new Dexie(dbName) as Dexie & {
        customers: Table<Customer, string>;
        products: Table<Product, string>;
        invoices: Table<Invoice, string>;
        cashTransactions: Table<Transaction, string>;
        costs: Table<Cost, string>;
        expenses: Table<Expense, string>;
        shares: Table<ShareTransaction, string>;
        partners: Table<Partner, string>;
        partnerTransactions: Table<PartnerTransaction, string>;
        wastages: Table<Wastage, string>;
    };

    db.version(18).stores({
        customers: 'id, firstName, lastName, userId, telegramChatId', 
        products: 'id, name, type, stock',
        invoices: 'id, invoiceType, invoiceNumber, customerId, issueDate, *items.productId',
        cashTransactions: 'id, boxType, date, invoiceId',
        costs: 'id, name',
        expenses: 'id, date, category',
        shares: 'id, invoiceId, customerId, date, shareType',
        partners: 'id, name',
        partnerTransactions: 'id, partnerId, date, type, relatedPartnerId',
        wastages: 'id, transactionId, date, boxType',
    });

    dbInstances.set(fiscalYearId, db);
    return db;
}


metaDb.on('populate', async (tx) => {
    // Populate with a default fiscal year if none exist
    const yearCount = await tx.table('fiscalYears').count();
    if (yearCount === 0) {
        await tx.table('fiscalYears').add({ id: '1403', name: 'سال مالی ۱۴۰۳' });
    }
    
    // Populate with default roles
    const adminRole: Role = {
        id: 'admin',
        name: 'مدیر کل',
        permissions: [...ALL_PERMISSION_IDS],
    };

    const employeeRole: Role = {
        id: 'employee',
        name: 'کارمند',
        permissions: [
            'page:home:view', 'page:customerLedger:view', 'page:customers:create', 'page:definitions:view',
            'page:products:view', 'page:services:view', 'page:invoices:view', 'page:invoices:create',
            'page:invoices:edit', 'page:orders:view', 'page:orders:edit', 'page:reports:view',
            'page:shares:view', 'page:partners:view', 'page:partnerReport:view', 'page:wastage:view',
            'page:profile:view', 'page:personalization:view', 'page:about:view', 'page:cashBox:view',
            'page:mainCashBox:view', 'page:vipCashBox:view', 'page:expenses:view', 'page:financialTransactions:view',
            'page:inventory:view'
        ]
    };

    const noAccessRole: Role = {
        id: 'no-access',
        name: 'بدون دسترسی',
        permissions: ['page:profile:view', 'page:personalization:view', 'page:about:view']
    };
    
    await tx.table('roles').bulkPut([adminRole, employeeRole, noAccessRole]);
    
    const adminUser = await tx.table('users').get('mohammad');
    if (adminUser) {
        await tx.table('users').update('mohammad', { roleId: 'admin' });
    }
});


// --- Date Helpers ---

/**
 * Gets today's date in Jalaali 'YYYY/MM/DD' format.
 */
export function getTodayJalaliString(): string {
  const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Tehran',
  });
  
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value || '1403';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  
  return `${year}/${month}/${day}`;
}

/**
 * Formats a 'YYYY/MM/DD' string to a localized Jalaali string for display (with Persian numerals).
 */
export function formatJalaliForDisplay(jalaliString: string): string {
    if (!jalaliString) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return jalaliString.replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit, 10)]);
}