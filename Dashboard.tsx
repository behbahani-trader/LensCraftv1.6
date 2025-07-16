import React, { useState, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { DbProvider, useDb } from './contexts/DbContext';
import Sidebar from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import Personalization from './pages/Personalization';
import CustomerLedgerPage from './pages/CustomerLedgerPage';
import ProductsPage from './pages/ProductsPage';
import ServicesPage from './pages/ServicesPage';
import InvoicesPage from './pages/InvoicesPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import ReportsPage from './pages/ReportsPage';
import AboutPage from './pages/AboutPage';
import BackupPage from './pages/BackupPage';
import MainCashBoxPage from './pages/MainCashBoxPage';
import VIPCashBoxPage from './pages/VIPCashBoxPage';
import CostsPage from './pages/CostsPage';
import AIPage from './pages/AIPage';
import AISettingsPage from './pages/AISettingsPage';
import { SharesPage } from './pages/SharesPage';
import PartnersPage from './pages/PartnersPage';
import PartnerReportPage from './pages/PartnerReportPage';
import WastagePage from './pages/WastagePage';
import UserManagementPage from './pages/UserManagementPage';
import ClientServicesReportPage from './pages/ClientServicesReportPage';
import ExpensesPage from './pages/ExpensesPage';
import CommandPalette from './components/CommandPalette';
import ShareSettingsPage from './pages/ShareSettingsPage';
import PrintSettingsPage from './pages/PrintSettingsPage';
import FinancialTransactionsPage from './pages/FinancialTransactionsPage';
import InventoryPage from './pages/InventoryPage';
import TelegramSettingsPage from './pages/TelegramSettingsPage';
import FiscalYearPage from './pages/FiscalYearPage';
import WhatsNewModal from './components/WhatsNewModal';
import { MenuIcon } from './constants';
import { Page, Permission, Customer } from './types';

const pageTitles: { [key in Page]: string } = {
  home: 'داشبورد',
  personalization: 'شخصی سازی',
  customerLedger: 'دفتر معین',
  products: 'مدیریت محصولات',
  services: 'مدیریت خدمات',
  invoices: 'مدیریت فاکتورها',
  profile: 'پروفایل کاربر',
  orders: 'سفارشات',
  reports: 'گزارشات',
  about: 'درباره سیستم',
  backup: 'پشتیبان‌گیری و بازیابی',
  mainCashBox: 'صندوق اصلی',
  vipCashBox: 'صندوق VIP',
  costs: 'مدیریت هزینه‌های اضافی',
  ai: 'دستیار هوش مصنوعی',
  aiSettings: 'تنظیمات AI',
  shares: 'مدیریت سهام',
  partners: 'مدیریت شرکا',
  partnerReport: 'گزارش شرکا',
  wastage: 'مدیریت ضایعات',
  userManagement: 'مدیریت کاربران',
  clientServicesReport: 'گزارش خدمات من',
  expenses: 'هزینه‌های عمومی',
  shareSettings: 'تنظیمات سهام',
  printSettings: 'تنظیمات چاپ',
  financialTransactions: 'دریافت و پرداخت',
  inventory: 'گزارش موجودی انبار',
  telegramSettings: 'تنظیمات ربات تلگرام',
  fiscalYears: 'مدیریت سال مالی',
};

const pagePermissions: Record<Page, Permission | null> = {
    home: 'page:home:view',
    customerLedger: 'page:customerLedger:view',
    products: 'page:products:view',
    services: 'page:services:view',
    costs: 'page:costs:view',
    invoices: 'page:invoices:view',
    orders: 'page:orders:view',
    reports: 'page:reports:view',
    inventory: 'page:inventory:view',
    wastage: 'page:wastage:view',
    shares: 'page:shares:view',
    partners: 'page:partners:view',
    partnerReport: 'page:partnerReport:view',
    ai: 'page:ai:view',
    mainCashBox: 'page:mainCashBox:view',
    vipCashBox: 'page:vipCashBox:view',
    expenses: 'page:expenses:view',
    financialTransactions: 'page:financialTransactions:view',
    profile: 'page:profile:view',
    personalization: 'page:personalization:view',
    userManagement: 'page:userManagement:view',
    aiSettings: 'page:aiSettings:view',
    telegramSettings: 'page:telegramSettings:view',
    shareSettings: 'page:shareSettings:view',
    printSettings: 'page:printSettings:view',
    backup: 'page:backup:view',
    about: 'page:about:view',
    fiscalYears: 'page:fiscalYears:view',
    clientServicesReport: null, 
};

interface PageState {
  page: Page;
  state?: any;
}

const APP_VERSION = '1.7.0'; // Version updated for Fiscal Year feature

const DashboardContent: React.FC = () => {
  const { themeSettings, activeFiscalYearId } = useTheme();
  const { currentUser, hasPermission, updateCurrentUser } = useAuth();
  const [activeState, setActiveState] = useState<PageState>({ page: 'home' });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const db = useDb();
  
  const navigateToPage = (page: Page, state?: any) => {
    setActiveState({ page, state });
  };
  
  const isClientView = !!currentUser?.customerId;
  
  useEffect(() => {
    if (db && currentUser && !currentUser.customerId && currentUser.username !== 'mohammad') {
        db.customers.where('userId').equals(currentUser.username).first().then(customerLink => {
            if(customerLink) {
                updateCurrentUser({ customerId: customerLink.id });
            }
        });
    }
  }, [db, currentUser, updateCurrentUser]);

  useEffect(() => {
    if (isClientView) {
      navigateToPage('customerLedger');
    } else {
        navigateToPage('home');
    }
  }, [isClientView, activeFiscalYearId]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            setIsCommandPaletteOpen(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
      const lastSeenVersion = localStorage.getItem('appVersion');
      if (lastSeenVersion !== APP_VERSION) {
          setIsWhatsNewOpen(true);
      }
  }, []);
  
  const handleSelectCustomerFromCommand = (customer: Customer) => {
    navigateToPage('customerLedger', { customerFromCommand: customer });
    setIsCommandPaletteOpen(false);
  }
  
  const handleCloseWhatsNew = () => {
      localStorage.setItem('appVersion', APP_VERSION);
      setIsWhatsNewOpen(false);
  };
  
  const FONT_SIZE_MAP: { [key: string]: string } = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' };
  
  const hasCustomBackground = (themeSettings.backgroundType === 'image' && themeSettings.backgroundImage) || (themeSettings.backgroundType === 'color' && themeSettings.backgroundColor);

  const rootClasses = [
      'min-h-screen',
      'relative',
      'overflow-x-hidden',
      FONT_SIZE_MAP[themeSettings.fontSize],
      !themeSettings.textColor ? 'text-slate-800 dark:text-slate-200' : '',
      !hasCustomBackground ? 'bg-slate-50 dark:bg-slate-900' : ''
  ].filter(Boolean).join(' ');
  
  const clientAllowedPages: Page[] = ['customerLedger', 'orders', 'clientServicesReport', 'profile', 'personalization'];

  const renderPageContent = () => {
    const { page, state } = activeState;

    const pageComponents: { [key in Page]?: React.ReactNode } = {
        home: <HomePage setActivePage={navigateToPage} />,
        personalization: <Personalization />,
        customerLedger: <CustomerLedgerPage initialState={state} />,
        products: <ProductsPage />,
        services: <ServicesPage />,
        invoices: <InvoicesPage initialState={state} />,
        profile: <ProfilePage />,
        orders: <OrdersPage />,
        reports: <ReportsPage />,
        about: <AboutPage />,
        backup: <BackupPage />,
        mainCashBox: <MainCashBoxPage />,
        vipCashBox: <VIPCashBoxPage />,
        costs: <CostsPage />,
        expenses: <ExpensesPage />,
        ai: <AIPage />,
        aiSettings: <AISettingsPage />,
        shares: <SharesPage />,
        partners: <PartnersPage />,
        partnerReport: <PartnerReportPage />,
        wastage: <WastagePage />,
        userManagement: <UserManagementPage />,
        clientServicesReport: <ClientServicesReportPage />,
        shareSettings: <ShareSettingsPage />,
        printSettings: <PrintSettingsPage />,
        financialTransactions: <FinancialTransactionsPage />,
        inventory: <InventoryPage />,
        telegramSettings: <TelegramSettingsPage />,
        fiscalYears: <FiscalYearPage />,
    };

    const pageContent = pageComponents[page];
    
    if (isClientView) {
        return clientAllowedPages.includes(page) 
            ? pageContent 
            : <AccessDenied />;
    }
    
    const requiredPermission = pagePermissions[page];
    if (requiredPermission && hasPermission(requiredPermission)) {
        return pageContent;
    }
    if (!requiredPermission && pageContent) {
        return pageContent;
    }

    return <AccessDenied />;
  };

  const AccessDenied = () => (
      <div className="text-center p-8 bg-red-100 dark:bg-red-900/50 rounded-custom border border-red-300 dark:border-red-600">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-200">عدم دسترسی</h2>
          <p className="mt-2 text-red-600 dark:text-red-300">شما اجازه مشاهده این صفحه را ندارید. لطفا با مدیر سیستم تماس بگیرید.</p>
      </div>
  );
  
  const sidebarWidthClass = themeSettings.sidebarMode === 'compact' ? 'lg:mr-20' : 'lg:mr-72';

  return (
    <div 
      className={rootClasses}
      data-theme-color={themeSettings.color}
    >
      <Sidebar 
        activePage={activeState.page}
        setActivePage={navigateToPage}
        isMobileNavOpen={isMobileNavOpen}
        closeMobileNav={() => setIsMobileNavOpen(false)}
      />
      <div className={`transition-margin duration-300 ease-in-out ${sidebarWidthClass}`}>
          <header className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-20">
            <h2 className="text-lg font-semibold">{pageTitles[activeState.page] || 'Lens Craft'}</h2>
             <button
                className="lg:hidden p-1 -ml-1 text-slate-600 dark:text-slate-300"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open navigation menu"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
            {renderPageContent()}
          </main>
      </div>
      <div className="fixed bottom-4 left-4 text-xs text-slate-500 dark:text-slate-400 font-mono z-50 select-none">
          Lens Craft v{APP_VERSION}
      </div>

      {isCommandPaletteOpen && (
        <CommandPalette 
            onClose={() => setIsCommandPaletteOpen(false)} 
            onSelectCustomer={handleSelectCustomerFromCommand}
            setActivePage={navigateToPage}
        />
      )}

      {isWhatsNewOpen && (
        <WhatsNewModal 
            isOpen={isWhatsNewOpen} 
            onClose={handleCloseWhatsNew} 
            version={APP_VERSION}
        />
      )}
    </div>
  );
}

function Dashboard() {
    return (
        <DbProvider>
            <DashboardContent />
        </DbProvider>
    );
}

export default Dashboard;