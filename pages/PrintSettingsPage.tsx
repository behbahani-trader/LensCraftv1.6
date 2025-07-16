import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PrintSettings, LedgerPrintSettings, ThemeColor } from '../types';

const PrintSettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'invoice' | 'ledger'>('invoice');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    <TabButton name="تنظیمات فاکتور" active={activeTab === 'invoice'} onClick={() => setActiveTab('invoice')} />
                    <TabButton name="تنظیمات دفتر معین" active={activeTab === 'ledger'} onClick={() => setActiveTab('ledger')} />
                </nav>
            </div>

            {activeTab === 'invoice' && <InvoicePrintSettings />}
            {activeTab === 'ledger' && <LedgerPrintSettingsForm />}
        </div>
    );
};

const TabButton: React.FC<{ name: string, active: boolean, onClick: () => void }> = ({ name, active, onClick }) => {
    const { themeSettings } = useTheme();
    const activeClasses = {
        blue: 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400',
        red: 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400',
        green: 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400',
        purple: 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400',
        orange: 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    };
    
    return (
        <button
            onClick={onClick}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${active
                    ? activeClasses[themeSettings.color]
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
        >
            {name}
        </button>
    );
};


const InvoicePrintSettings: React.FC = () => {
    const { printSettings, setPrintSettings, themeSettings } = useTheme();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPrintSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPrintSettings(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
         <SettingsCard title="شخصی‌سازی چاپ فاکتور">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                اطلاعات و ظاهر فاکتورهای چاپی خود را در این بخش تنظیم کنید.
            </p>

            <BusinessInfoForm settings={printSettings} setSettings={setPrintSettings} handleLogoChange={handleLogoChange}/>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Input label="عنوان فاکتور" name="invoiceTitle" value={printSettings.invoiceTitle || ''} onChange={handleChange} placeholder="مثال: صورتحساب فروش" />
            </div>
            <div className="mt-4">
                <label htmlFor="invoiceFooter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">متن پاورقی</label>
                <textarea id="invoiceFooter" name="invoiceFooter" value={printSettings.invoiceFooter || ''} onChange={handleChange} rows={3} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" placeholder="مثال: شماره حساب یا پیام تشکر"></textarea>
            </div>
             <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <PaperSizeSelector value={printSettings.paperSize || 'A4'} onChange={(val) => setPrintSettings(p => ({...p, paperSize: val}))} themeColor={themeSettings.color} />
                 <FontSizeSelector value={printSettings.fontSize || 'base'} onChange={(val) => setPrintSettings(p => ({...p, fontSize: val}))} themeColor={themeSettings.color} />
            </div>
        </SettingsCard>
    );
};

const LedgerPrintSettingsForm: React.FC = () => {
    const { ledgerPrintSettings, setLedgerPrintSettings, themeSettings } = useTheme();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setLedgerPrintSettings(prev => ({ ...prev, [name]: val }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLedgerPrintSettings(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <SettingsCard title="شخصی‌سازی چاپ دفتر معین">
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                اطلاعات و ظاهر پرینت دفتر معین مشتریان را در این بخش تنظیم کنید.
            </p>
             <BusinessInfoForm settings={ledgerPrintSettings} setSettings={setLedgerPrintSettings} handleLogoChange={handleLogoChange}/>

             <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Input label="عنوان گزارش" name="reportTitle" value={ledgerPrintSettings.reportTitle || ''} onChange={handleChange} placeholder="مثال: صورت وضعیت مشتری" />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">بخش‌های قابل نمایش</h4>
                 <div className="space-y-2">
                    <Checkbox label="نمایش جدول فاکتورها" name="showInvoices" checked={ledgerPrintSettings.showInvoices ?? true} onChange={handleChange} />
                    <Checkbox label="نمایش جدول تراکنش‌های مالی" name="showTransactions" checked={ledgerPrintSettings.showTransactions ?? true} onChange={handleChange} />
                 </div>
            </div>

             <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                <PaperSizeSelector value={ledgerPrintSettings.paperSize || 'A4'} onChange={(val) => setLedgerPrintSettings(p => ({...p, paperSize: val}))} themeColor={themeSettings.color} />
                <FontSizeSelector value={ledgerPrintSettings.fontSize || 'base'} onChange={(val) => setLedgerPrintSettings(p => ({...p, fontSize: val}))} themeColor={themeSettings.color} />
            </div>
        </SettingsCard>
    )
}

// --- Shared Components ---
const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <input id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
    </div>
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" name={name} {...props} className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700" />
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
    </label>
);


const BusinessInfoForm: React.FC<{settings: any, setSettings: React.Dispatch<any>, handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ settings, setSettings, handleLogoChange}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings((prev: any) => ({ ...prev, [name]: value }));
    };

    return <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="نام کسب‌وکار" name="businessName" value={settings.businessName || ''} onChange={handleChange} />
            <Input label="تلفن" name="businessPhone" value={settings.businessPhone || ''} onChange={handleChange} />
        </div>
        <div className="mt-4">
            <Input label="آدرس" name="businessAddress" value={settings.businessAddress || ''} onChange={handleChange} />
        </div>
        <div className="mt-4">
            <Input label="ایمیل" name="businessEmail" value={settings.businessEmail || ''} onChange={handleChange} />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">لوگوی کسب‌وکار</label>
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-custom flex items-center justify-center overflow-hidden">
                    {settings.logo ? <img src={settings.logo} alt="لوگو" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">بدون لوگو</span>}
                </div>
                <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoChange} />
                <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">
                    انتخاب تصویر...
                </label>
                {settings.logo && (
                    <button onClick={() => setSettings((p:any) => ({...p, logo: ''}))} className="text-xs text-red-500 hover:underline">حذف لوگو</button>
                )}
            </div>
        </div>
    </>
}

const SegmentedButton: React.FC<{label: string, active: boolean, onClick: () => void, themeColor: ThemeColor}> = ({label, active, onClick, themeColor}) => {
    const colorClasses: Record<ThemeColor, string> = {
        blue: 'bg-blue-600 text-white', red: 'bg-red-600 text-white', green: 'bg-green-600 text-white',
        purple: 'bg-purple-600 text-white', orange: 'bg-orange-600 text-white',
    };
    return (
        <button onClick={onClick} className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors ${active ? colorClasses[themeColor] : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}`}>{label}</button>
    )
}

const PaperSizeSelector: React.FC<{value: 'A4' | 'A5', onChange: (val: 'A4' | 'A5') => void, themeColor: ThemeColor}> = ({ value, onChange, themeColor }) => (
    <div>
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">اندازه کاغذ</h4>
        <div className="p-1 rounded-custom bg-slate-200 dark:bg-slate-700/50 flex gap-1">
            <SegmentedButton label="A4" active={value === 'A4'} onClick={() => onChange('A4')} themeColor={themeColor}/>
            <SegmentedButton label="A5" active={value === 'A5'} onClick={() => onChange('A5')} themeColor={themeColor}/>
        </div>
    </div>
);

const FontSizeSelector: React.FC<{value: 'sm'|'base'|'lg', onChange: (val: 'sm'|'base'|'lg') => void, themeColor: ThemeColor}> = ({ value, onChange, themeColor }) => (
    <div>
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">اندازه فونت</h4>
        <div className="p-1 rounded-custom bg-slate-200 dark:bg-slate-700/50 flex gap-1">
            <SegmentedButton label="کوچک" active={value === 'sm'} onClick={() => onChange('sm')} themeColor={themeColor}/>
            <SegmentedButton label="متوسط" active={value === 'base'} onClick={() => onChange('base')} themeColor={themeColor}/>
            <SegmentedButton label="بزرگ" active={value === 'lg'} onClick={() => onChange('lg')} themeColor={themeColor}/>
        </div>
    </div>
);


export default PrintSettingsPage;