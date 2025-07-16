import React, { createContext, useState, useEffect, useContext } from 'react';
import { Theme, ThemeSettings, AppSettings, BorderRadius, FontFamily, AISettings, DashboardSettings, WidgetConfig, PrintSettings, LedgerPrintSettings, TelegramSettings, FiscalYear } from '../types';
import { metaDb } from '../db';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  aiSettings: AISettings;
  setAiSettings: React.Dispatch<React.SetStateAction<AISettings>>;
  dashboardSettings: DashboardSettings;
  setDashboardSettings: React.Dispatch<React.SetStateAction<DashboardSettings>>;
  printSettings: PrintSettings;
  setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettings>>;
  ledgerPrintSettings: LedgerPrintSettings;
  setLedgerPrintSettings: React.Dispatch<React.SetStateAction<LedgerPrintSettings>>;
  telegramSettings: TelegramSettings;
  setTelegramSettings: React.Dispatch<React.SetStateAction<TelegramSettings>>;
  fiscalYears: FiscalYear[];
  setFiscalYears: React.Dispatch<React.SetStateAction<FiscalYear[]>>;
  activeFiscalYearId: string | null;
  setActiveFiscalYearId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultWidgets: WidgetConfig[] = [
    { id: 'quickStats', enabled: true },
    { id: 'quickAccess', enabled: true },
    { id: 'topCustomers', enabled: true },
    { id: 'recentInvoices', enabled: true },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return 'light';
    const storedTheme = window.localStorage.getItem('theme') as Theme;
    if (storedTheme) return storedTheme;
    return 'light';
  });

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
     const defaultSettings: ThemeSettings = { 
        color: 'purple', 
        fontSize: 'base', 
        borderRadius: 'md', 
        fontFamily: 'Vazirmatn' as FontFamily,
        backgroundType: 'image',
        backgroundColor: '',
        backgroundImage: 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=2070&auto=format&fit=crop',
        textColor: '',
        sidebarMode: 'full',
     };
     if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
     const storedSettings = window.localStorage.getItem('themeSettings');
     try {
       return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
     } catch { return defaultSettings; }
  });
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
     const defaultSettings = { loginEnabled: false, loginRequired: false };
     if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
     const storedSettings = window.localStorage.getItem('appSettings');
     try {
        return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
     } catch { return defaultSettings; }
  });

  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const defaultSettings = { apiKey: '' };
    if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
    const storedSettings = window.localStorage.getItem('aiSettings');
    try {
      return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
    } catch { return defaultSettings; }
  });

  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(() => {
    const defaultSettings: TelegramSettings = {
      botToken: '',
      messageTemplate: 'فاکتور شماره {invoiceNumber} برای شما صادر شد.\nبا تشکر از خرید شما!',
    };
    if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
    const storedSettings = window.localStorage.getItem('telegramSettings');
    try {
      return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
    } catch { return defaultSettings; }
  });

  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(() => {
      const defaultSettings: DashboardSettings = {
          widgets: defaultWidgets,
          layout: 'grid',
      };
      if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
      const storedSettings = window.localStorage.getItem('dashboardSettings');
      try {
          const parsed = storedSettings ? JSON.parse(storedSettings) : defaultSettings;
          // Ensure all default widgets are present for existing users
          const allWidgetIds = new Set(parsed.widgets.map((w: WidgetConfig) => w.id));
          const missingWidgets = defaultWidgets.filter(w => !allWidgetIds.has(w.id));
          if (missingWidgets.length > 0) {
              parsed.widgets.push(...missingWidgets);
          }
          return { ...defaultSettings, ...parsed };
      } catch { return defaultSettings; }
  });
  
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    const defaultSettings: PrintSettings = {
        businessName: 'فروشگاه شما',
        businessAddress: 'ایران، تهران، میدان آزادی، خیابان آزادی، پلاک ۱',
        businessPhone: '۰۲۱-۶۶۱۲۳۴۵۶',
        businessEmail: 'your.email@example.com',
        logo: '',
        invoiceTitle: 'فاکتور فروش',
        invoiceFooter: 'از همکاری شما سپاسگزاریم!',
        paperSize: 'A4',
        fontSize: 'base',
    };
     if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
     const storedSettings = window.localStorage.getItem('printSettings');
     try {
       return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
     } catch { return defaultSettings; }
  });
  
  const [ledgerPrintSettings, setLedgerPrintSettings] = useState<LedgerPrintSettings>(() => {
    const defaultSettings: LedgerPrintSettings = {
        businessName: 'فروشگاه شما',
        businessAddress: 'ایران، تهران، میدان آزادی، خیابان آزادی، پلاک ۱',
        businessPhone: '۰۲۱-۶۶۱۲۳۴۵۶',
        businessEmail: 'your.email@example.com',
        logo: '',
        reportTitle: 'صورتحساب مشتری (دفتر معین)',
        showInvoices: true,
        showTransactions: true,
        paperSize: 'A4',
        fontSize: 'base',
    };
     if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
     const storedSettings = window.localStorage.getItem('ledgerPrintSettings');
     try {
       return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
     } catch { return defaultSettings; }
  });

  // --- Fiscal Year State ---
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [activeFiscalYearId, _setActiveFiscalYearId] = useState<string | null>(() => localStorage.getItem('activeFiscalYearId'));

  useEffect(() => {
    const loadFiscalYears = async () => {
        try {
            const years = await metaDb.fiscalYears.toArray();
            setFiscalYears(years);
            const currentActiveId = localStorage.getItem('activeFiscalYearId');
            if (!currentActiveId && years.length > 0) {
                // If no active year is set, default to the first one
                localStorage.setItem('activeFiscalYearId', years[0].id);
                _setActiveFiscalYearId(years[0].id);
            } else if (years.length > 0 && !years.some(y => y.id === currentActiveId)) {
                // If the stored active year is no longer valid, set to the first available one
                localStorage.setItem('activeFiscalYearId', years[0].id);
                _setActiveFiscalYearId(years[0].id);
            }
             else {
                _setActiveFiscalYearId(currentActiveId);
            }
        } catch (error) {
            console.error("Failed to load fiscal years:", error);
        }
    };
    loadFiscalYears();
  }, []);

  const setActiveFiscalYearId = (id: string) => {
      localStorage.setItem('activeFiscalYearId', id);
      _setActiveFiscalYearId(id);
      window.location.reload();
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
    const root = document.documentElement;
    const body = document.body;
    
    const BORDER_RADIUS_VAR_MAP: Record<BorderRadius, string> = {
      'none': '0rem', 'md': '0.5rem', 'full': '9999px',
    };
    root.style.setProperty('--border-radius', BORDER_RADIUS_VAR_MAP[themeSettings.borderRadius]);
    
    const FONT_FAMILY_MAP: Record<FontFamily, string> = {
        'Vazirmatn': 'Vazirmatn, sans-serif', 'Roboto': 'Roboto, sans-serif',
        'Noto Sans': '"Noto Sans", sans-serif', 'IRANSans': 'IRANSans, sans-serif'
    };
    document.body.style.fontFamily = FONT_FAMILY_MAP[themeSettings.fontFamily] || FONT_FAMILY_MAP['Vazirmatn'];

    body.style.backgroundImage = '';
    body.style.backgroundColor = '';
    body.style.color = '';

    if (themeSettings.backgroundType === 'image' && themeSettings.backgroundImage) {
        body.style.backgroundImage = `url('${themeSettings.backgroundImage}')`;
        body.style.backgroundSize = 'cover'; body.style.backgroundPosition = 'center'; body.style.backgroundAttachment = 'fixed';
    } else if (themeSettings.backgroundType === 'color' && themeSettings.backgroundColor) {
        body.style.backgroundColor = themeSettings.backgroundColor;
    }
    
    if (themeSettings.textColor) {
        body.style.color = themeSettings.textColor;
    }

  }, [themeSettings]);

  useEffect(() => localStorage.setItem('appSettings', JSON.stringify(appSettings)), [appSettings]);
  useEffect(() => localStorage.setItem('aiSettings', JSON.stringify(aiSettings)), [aiSettings]);
  useEffect(() => localStorage.setItem('telegramSettings', JSON.stringify(telegramSettings)), [telegramSettings]);
  useEffect(() => localStorage.setItem('dashboardSettings', JSON.stringify(dashboardSettings)), [dashboardSettings]);
  useEffect(() => localStorage.setItem('printSettings', JSON.stringify(printSettings)), [printSettings]);
  useEffect(() => localStorage.setItem('ledgerPrintSettings', JSON.stringify(ledgerPrintSettings)), [ledgerPrintSettings]);


  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const value = { theme, toggleTheme, themeSettings, setThemeSettings, appSettings, setAppSettings, aiSettings, setAiSettings, dashboardSettings, setDashboardSettings, printSettings, setPrintSettings, ledgerPrintSettings, setLedgerPrintSettings, telegramSettings, setTelegramSettings, fiscalYears, setFiscalYears, activeFiscalYearId, setActiveFiscalYearId };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};