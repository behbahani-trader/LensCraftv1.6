import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AppLogo, HomeIcon, OrdersIcon, SettingsIcon, ChevronDownIcon, PaintBrushIcon, UserIcon, LedgerIcon, PackageIcon, InvoiceIcon, ChartIcon, InfoIcon, DatabaseIcon, CashIcon, DotIcon, TagIcon, ClipboardListIcon, WrenchIcon, SparklesIcon, KeyIcon, ShareIcon, UserGroupIcon, TrashIcon, ReceiptIcon, PrintIcon, ArrowsRightLeftIcon, ArchiveBoxIcon, SendIcon } from '../constants';
import { ThemeColor, Page } from '../types';

interface NavLinkProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  isCompact: boolean;
  tooltip: string;
}

const NavLink: React.FC<NavLinkProps> = ({ children, onClick, active = false, isCompact, tooltip }) => {
  const { themeSettings } = useTheme();

  const colorClasses: Record<ThemeColor, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
    red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300',
    orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300',
  };

  const activeClasses = colorClasses[themeSettings.color];
  const inactiveClasses = 'hover:bg-slate-200 dark:hover:bg-slate-700';
  
  return (
    <div className="relative group">
        <button onClick={onClick} className={`flex items-center w-full gap-3 p-3 my-1 rounded-custom transition-colors duration-200 ${active ? activeClasses : inactiveClasses} ${isCompact ? 'justify-center' : ''}`}>
          {children}
        </button>
        {isCompact && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {tooltip}
            </div>
        )}
    </div>
  );
};

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page, state?: any) => void;
  isMobileNavOpen: boolean;
  closeMobileNav: () => void;
}

const ClientSidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isMobileNavOpen, closeMobileNav }) => {
    const { themeSettings } = useTheme();
    // On mobile, sidebar is never compact. On desktop, it follows settings.
    const isCompact = themeSettings.sidebarMode === 'compact';

    const handleNav = (page: Page) => {
        setActivePage(page);
        closeMobileNav();
    };

    return (
        <aside
          className={`fixed top-0 right-0 h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none lg:transition-width ${isMobileNavOpen ? 'translate-x-0' : 'translate-x-full'} ${isCompact ? 'lg:w-20' : 'lg:w-72'} w-72`}
        >
          <div className={`flex items-center p-4 border-b border-slate-200 dark:border-slate-700 h-16 shrink-0 ${isCompact ? 'lg:justify-center' : ''}`}>
            <div className={`flex items-center gap-3 ${isCompact ? 'lg:justify-center' : ''}`}>
                <AppLogo className="text-blue-600 data-[theme-color='red']:text-red-500 data-[theme-color='green']:text-green-500 data-[theme-color='purple']:text-purple-500 data-[theme-color='orange']:text-orange-500 transition-colors shrink-0" />
                <span className={`${isCompact ? 'lg:hidden' : ''} text-xl font-bold text-slate-800 dark:text-white transition-opacity duration-200`}>پورتال مشتری</span>
            </div>
          </div>
           <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLink onClick={() => handleNav('customerLedger')} active={activePage === 'customerLedger'} isCompact={isCompact} tooltip="دفتر معین من"><LedgerIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>دفتر معین من</span>}</NavLink>
              <NavLink onClick={() => handleNav('orders')} active={activePage === 'orders'} isCompact={isCompact} tooltip="سفارشات من"><OrdersIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>سفارشات من</span>}</NavLink>
              <NavLink onClick={() => handleNav('clientServicesReport')} active={activePage === 'clientServicesReport'} isCompact={isCompact} tooltip="گزارش خدمات من"><ChartIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>گزارش خدمات من</span>}</NavLink>
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <NavLink onClick={() => handleNav('profile')} active={activePage === 'profile'} isCompact={isCompact} tooltip="پروفایل"><UserIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>پروفایل</span>}</NavLink>
          </div>
        </aside>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isMobileNavOpen, closeMobileNav }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { themeSettings, activeFiscalYearId } = useTheme();
  const { currentUser, hasPermission } = useAuth();
  
  // On mobile, sidebar is never compact. On desktop, it follows settings.
  const isCompact = themeSettings.sidebarMode === 'compact';

  const handleNav = (page: Page) => {
    setActivePage(page);
    closeMobileNav();
  }

  const toggleMenu = (menu: string) => {
    // In compact mode, menus don't expand, they are tooltips.
    if (isCompact) {
      return;
    }
    setOpenMenu(prev => (prev === menu ? null : menu));
  };
  
  const handleTopLevelNavClick = (page: Page) => {
    handleNav(page);
    setOpenMenu(null);
  };

  if (currentUser?.customerId) {
      return (
          <>
            <ClientSidebar activePage={activePage} setActivePage={setActivePage} isMobileNavOpen={isMobileNavOpen} closeMobileNav={closeMobileNav} />
            {isMobileNavOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobileNav}></div>}
          </>
      );
  }

  return (
    <>
    <aside
      className={`fixed top-0 right-0 h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-xl z-50 flex flex-col transform transition-all duration-300 ease-in-out lg:transform-none ${isMobileNavOpen ? 'translate-x-0' : 'translate-x-full'} ${isCompact ? 'lg:w-20' : 'lg:w-72'} w-72`}
    >
      <div className={`flex items-center p-4 border-b border-slate-200 dark:border-slate-700 h-16 shrink-0 ${isCompact ? 'lg:justify-center' : ''}`}>
        <div className={`flex items-center gap-3 overflow-hidden`}>
            <AppLogo className="text-blue-600 data-[theme-color='red']:text-red-500 data-[theme-color='green']:text-green-500 data-[theme-color='purple']:text-purple-500 data-[theme-color='orange']:text-orange-500 dark:text-blue-400 dark:data-[theme-color='red']:text-red-400 dark:data-[theme-color='green']:text-green-400 dark:data-[theme-color='purple']:text-purple-400 dark:data-[theme-color='orange']:text-orange-400 transition-colors shrink-0" />
            <span className={`${isCompact ? 'lg:hidden' : ''} text-xl font-bold text-slate-800 dark:text-white transition-opacity duration-200`}>Lens Craft</span>
        </div>
      </div>
      <div className={`p-2 text-center text-xs font-bold ${isCompact ? 'hidden' : ''} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200`}>
          سال مالی فعال: {activeFiscalYearId}
      </div>


      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {hasPermission('page:home:view') && <NavLink onClick={() => handleTopLevelNavClick('home')} active={activePage === 'home'} isCompact={isCompact} tooltip="داشبورد"><HomeIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>داشبورد</span>}</NavLink>}
          {hasPermission('page:customerLedger:view') && <NavLink onClick={() => handleTopLevelNavClick('customerLedger')} active={activePage === 'customerLedger'} isCompact={isCompact} tooltip="دفتر معین"><LedgerIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>دفتر معین</span>}</NavLink>}
          
          {hasPermission('page:definitions:view') && (
            <div>
              <NavLink onClick={() => toggleMenu('definitions')} isCompact={isCompact} tooltip="تعاریف">
                <ClipboardListIcon className="w-5 h-5 shrink-0" />
                {!isCompact && <span className="flex-1 text-right">تعاریف</span>}
                {!isCompact && <ChevronDownIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${openMenu === 'definitions' ? 'rotate-180' : ''}`} />}
              </NavLink>
              {!isCompact && (
                  <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${openMenu === 'definitions' ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="pr-6 pl-2 py-2 mt-1 space-y-1 border-r-2 border-slate-200 dark:border-slate-600 mr-5">
                      {hasPermission('page:products:view') && <NavLink onClick={() => handleNav('products')} active={activePage === 'products'} isCompact={false} tooltip="محصولات"><PackageIcon className="w-5 h-5 shrink-0" />محصولات</NavLink>}
                      {hasPermission('page:services:view') && <NavLink onClick={() => handleNav('services')} active={activePage === 'services'} isCompact={false} tooltip="خدمات"><WrenchIcon className="w-5 h-5 shrink-0" />خدمات</NavLink>}
                      {hasPermission('page:costs:view') && <NavLink onClick={() => handleNav('costs')} active={activePage === 'costs'} isCompact={false} tooltip="هزینه‌ها"><TagIcon className="w-5 h-5 shrink-0" />هزینه‌های اضافی</NavLink>}
                    </div>
                  </div>
              )}
            </div>
          )}

          {hasPermission('page:invoices:view') && <NavLink onClick={() => handleTopLevelNavClick('invoices')} active={activePage === 'invoices'} isCompact={isCompact} tooltip="فاکتورها"><InvoiceIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>فاکتورها</span>}</NavLink>}
          {hasPermission('page:orders:view') && <NavLink onClick={() => handleTopLevelNavClick('orders')} active={activePage === 'orders'} isCompact={isCompact} tooltip="سفارشات"><OrdersIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>سفارشات</span>}</NavLink>}
          {hasPermission('page:financialTransactions:view') && <NavLink onClick={() => handleTopLevelNavClick('financialTransactions')} active={activePage === 'financialTransactions'} isCompact={isCompact} tooltip="دریافت و پرداخت"><ArrowsRightLeftIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>دریافت و پرداخت</span>}</NavLink>}
          {hasPermission('page:expenses:view') && <NavLink onClick={() => handleTopLevelNavClick('expenses')} active={activePage === 'expenses'} isCompact={isCompact} tooltip="هزینه‌ها"><ReceiptIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>هزینه‌های عمومی</span>}</NavLink>}
          {hasPermission('page:reports:view') && <NavLink onClick={() => handleTopLevelNavClick('reports')} active={activePage === 'reports'} isCompact={isCompact} tooltip="گزارشات"><ChartIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>گزارشات</span>}</NavLink>}
          {hasPermission('page:inventory:view') && <NavLink onClick={() => handleTopLevelNavClick('inventory')} active={activePage === 'inventory'} isCompact={isCompact} tooltip="موجودی انبار"><ArchiveBoxIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>موجودی انبار</span>}</NavLink>}
          {hasPermission('page:wastage:view') && <NavLink onClick={() => handleTopLevelNavClick('wastage')} active={activePage === 'wastage'} isCompact={isCompact} tooltip="ضایعات"><TrashIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>ضایعات</span>}</NavLink>}
          {hasPermission('page:shares:view') && <NavLink onClick={() => handleTopLevelNavClick('shares')} active={activePage === 'shares'} isCompact={isCompact} tooltip="سهام"><ShareIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>سهام</span>}</NavLink>}
          
           {hasPermission('page:partners:view') && (
            <div>
              <NavLink onClick={() => toggleMenu('partners')} isCompact={isCompact} tooltip="شرکا">
                <UserGroupIcon className="w-5 h-5 shrink-0" />
                {!isCompact && <span className="flex-1 text-right">شرکا</span>}
                {!isCompact && <ChevronDownIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${openMenu === 'partners' ? 'rotate-180' : ''}`} />}
              </NavLink>
              {!isCompact && (
                  <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${openMenu === 'partners' ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="pr-6 pl-2 py-2 mt-1 space-y-1 border-r-2 border-slate-200 dark:border-slate-600 mr-5">
                      <NavLink onClick={() => handleNav('partners')} active={activePage === 'partners'} isCompact={false} tooltip="لیست شرکا"><DotIcon className="w-5 h-5 shrink-0" />لیست شرکا</NavLink>}
                      {hasPermission('page:partnerReport:view') && <NavLink onClick={() => handleNav('partnerReport')} active={activePage === 'partnerReport'} isCompact={false} tooltip="گزارش شرکا"><DotIcon className="w-5 h-5 shrink-0" />گزارش شرکا</NavLink>}
                    </div>
                  </div>
              )}
            </div>
          )}
          
          {hasPermission('page:ai:view') && <NavLink onClick={() => handleTopLevelNavClick('ai')} active={activePage === 'ai'} isCompact={isCompact} tooltip="دستیار AI"><SparklesIcon className="w-5 h-5 shrink-0" />{!isCompact && <span>دستیار AI</span>}</NavLink>}

          {hasPermission('page:cashBox:view') && (
            <div>
              <NavLink onClick={() => toggleMenu('cashBox')} isCompact={isCompact} tooltip="صندوق">
                <CashIcon className="w-5 h-5 shrink-0" />
                {!isCompact && <span className="flex-1 text-right">صندوق</span>}
                {!isCompact && <ChevronDownIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${openMenu === 'cashBox' ? 'rotate-180' : ''}`} />}
              </NavLink>
              {!isCompact && (
                  <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${openMenu === 'cashBox' ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="pr-6 pl-2 py-2 mt-1 space-y-1 border-r-2 border-slate-200 dark:border-slate-600 mr-5">
                      {hasPermission('page:mainCashBox:view') && <NavLink onClick={() => handleNav('mainCashBox')} active={activePage === 'mainCashBox'} isCompact={false} tooltip="صندوق اصلی"><DotIcon className="w-5 h-5 shrink-0" />صندوق اصلی</NavLink>}
                      {hasPermission('page:vipCashBox:view') && <NavLink onClick={() => handleNav('vipCashBox')} active={activePage === 'vipCashBox'} isCompact={false} tooltip="صندوق VIP"><DotIcon className="w-5 h-5 shrink-0" />صندوق VIP</NavLink>}
                    </div>
                  </div>
              )}
            </div>
          )}
      </nav>
      
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {hasPermission('page:settings:view') && (
            <div>
              <NavLink onClick={() => toggleMenu('settings')} isCompact={isCompact} tooltip="تنظیمات">
                <SettingsIcon className="w-5 h-5 shrink-0" />
                {!isCompact && <span className="flex-1 text-right">تنظیمات</span>}
                {!isCompact && <ChevronDownIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${openMenu === 'settings' ? 'rotate-180' : ''}`} />}
              </NavLink>
              {!isCompact && (
                  <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${openMenu === 'settings' ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="pr-6 pl-2 py-2 mt-1 space-y-1 border-r-2 border-slate-200 dark:border-slate-600 mr-5">
                      {hasPermission('page:profile:view') && <NavLink onClick={() => handleNav('profile')} active={activePage === 'profile'} isCompact={false} tooltip="پروفایل"><UserIcon className="w-5 h-5 shrink-0" />پروفایل</NavLink>}
                      {hasPermission('page:fiscalYears:view') && <NavLink onClick={() => handleNav('fiscalYears')} active={activePage === 'fiscalYears'} isCompact={false} tooltip="مدیریت سال مالی"><DatabaseIcon className="w-5 h-5 shrink-0" />مدیریت سال مالی</NavLink>}
                      {hasPermission('page:userManagement:view') && <NavLink onClick={() => handleNav('userManagement')} active={activePage === 'userManagement'} isCompact={false} tooltip="مدیریت کاربران"><UserGroupIcon className="w-5 h-5 shrink-0" />مدیریت کاربران</NavLink>}
                      {hasPermission('page:personalization:view') && <NavLink onClick={() => handleNav('personalization')} active={activePage === 'personalization'} isCompact={false} tooltip="شخصی سازی"><PaintBrushIcon className="w-5 h-5 shrink-0" />شخصی سازی</NavLink>}
                      {hasPermission('page:shareSettings:view') && <NavLink onClick={() => handleNav('shareSettings')} active={activePage === 'shareSettings'} isCompact={false} tooltip="تنظیمات سهام"><ShareIcon className="w-5 h-5 shrink-0" />تنظیمات سهام</NavLink>}
                      {hasPermission('page:printSettings:view') && <NavLink onClick={() => handleNav('printSettings')} active={activePage === 'printSettings'} isCompact={false} tooltip="تنظیمات چاپ"><PrintIcon className="w-5 h-5 shrink-0" />تنظیمات چاپ</NavLink>}
                      {hasPermission('page:telegramSettings:view') && <NavLink onClick={() => handleNav('telegramSettings')} active={activePage === 'telegramSettings'} isCompact={false} tooltip="تنظیمات تلگرام"><SendIcon className="w-5 h-5 shrink-0" />تنظیمات تلگرام</NavLink>}
                      {hasPermission('page:aiSettings:view') && <NavLink onClick={() => handleNav('aiSettings')} active={activePage === 'aiSettings'} isCompact={false} tooltip="تنظیمات AI"><KeyIcon className="w-5 h-5 shrink-0" />تنظیمات AI</NavLink>}
                      {hasPermission('page:backup:view') && <NavLink onClick={() => handleNav('backup')} active={activePage === 'backup'} isCompact={false} tooltip="پشتیبان گیری"><DatabaseIcon className="w-5 h-5 shrink-0" />پشتیبان گیری</NavLink>}
                      {hasPermission('page:about:view') && <NavLink onClick={() => handleNav('about')} active={activePage === 'about'} isCompact={false} tooltip="درباره ما"><InfoIcon className="w-5 h-5 shrink-0" />درباره ما</NavLink>}
                    </div>
                  </div>
              )}
            </div>
        )}
      </div>
    </aside>
     {isMobileNavOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobileNav}></div>}
    </>
  );
};

export default Sidebar;