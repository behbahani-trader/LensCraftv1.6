import React, { useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Theme, ThemeColor, FontSize, BorderRadius, FontFamily, WidgetID } from '../types';
import ThemeToggle from '../components/ThemeToggle';
import { DragHandleIcon } from '../constants';

const colorOptions: { name: ThemeColor; label: string; class: string }[] = [
    { name: 'blue', label: 'آبی', class: 'bg-blue-500' },
    { name: 'red', label: 'قرمز', class: 'bg-red-500' },
    { name: 'green', label: 'سبز', class: 'bg-green-500' },
    { name: 'purple', label: 'بنفش', class: 'bg-purple-500' },
    { name: 'orange', label: 'نارنجی', class: 'bg-orange-500' },
];

const fontSizeOptions: { name: FontSize; label: string }[] = [
    { name: 'sm', label: 'کوچک' },
    { name: 'base', label: 'متوسط' },
    { name: 'lg', label: 'بزرگ' },
];

const borderRadiusOptions: { name: BorderRadius; label: string; class: string }[] = [
    { name: 'none', label: 'تیز', class: 'rounded-none' },
    { name: 'md', label: 'گرد', class: 'rounded-md' },
    { name: 'full', label: 'کپسولی', class: 'rounded-full' },
];

const fontFamilyOptions: { name: FontFamily; label: string; class: string }[] = [
    { name: 'Vazirmatn', label: 'وزیرمتن', class: 'font-vazir' },
    { name: 'IRANSans', label: 'ایران‌سنس', class: 'font-iransans' },
    { name: 'Roboto', label: 'روبوتو', class: 'font-roboto' },
    { name: 'Noto Sans', label: 'نوتو سنس', class: 'font-noto' },
];

const backgroundImages: { name: string; url: string; }[] = [
    { name: 'گرادیان آرام', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop' },
    { name: 'بافت تاریک', url: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=2070&auto=format&fit=crop' },
    { name: 'رنگ‌های پاستلی', url: 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=2070&auto=format&fit=crop' },
    { name: 'طرح هندسی', url: 'https://images.unsplash.com/photo-1529141434193-fdf426145b41?q=80&w=2070&auto=format&fit=crop' },
];

const WIDGET_NAMES: Record<WidgetID, string> = {
    quickStats: 'آمار سریع',
    quickAccess: 'دسترسی سریع',
    topCustomers: 'مشتریان برتر',
    recentInvoices: 'فاکتورهای اخیر',
};


const Personalization: React.FC = () => {
    const { theme, themeSettings, setThemeSettings, dashboardSettings, setDashboardSettings } = useTheme();
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const ActiveRingClasses = (color: ThemeColor) => {
        const ringColors: Record<ThemeColor, string> = {
            blue: 'ring-blue-500', red: 'ring-red-500', green: 'ring-green-500',
            purple: 'ring-purple-500', orange: 'ring-orange-500',
        };
        return ringColors[color];
    };
    
    const ActiveBgClasses = (color: ThemeColor) => {
        const bgColors: Record<ThemeColor, string> = {
            blue: 'bg-blue-500',
            red: 'bg-red-500',
            green: 'bg-green-500',
            purple: 'bg-purple-500',
            orange: 'bg-orange-500',
        };
        return bgColors[color];
    };
    
    const handleWidgetToggle = (id: WidgetID) => {
        setDashboardSettings(prev => ({
            ...prev,
            widgets: prev.widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w),
        }));
    };
    
    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const newWidgets = [...dashboardSettings.widgets];
        const draggedItemContent = newWidgets.splice(dragItem.current, 1)[0];
        newWidgets.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;

        setDashboardSettings(prev => ({ ...prev, widgets: newWidgets }));
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <SettingsCard title="مدیریت ویجت‌های داشبورد">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">ویجت‌های مورد نظر خود را با کشیدن و رها کردن مرتب کنید و با سوییچ، آن‌ها را فعال یا غیرفعال نمایید.</p>
                <ul className="space-y-2">
                    {dashboardSettings.widgets.map((widget, index) => (
                        <li 
                            key={widget.id}
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-custom transition-shadow duration-200 cursor-move hover:shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                <DragHandleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <ToggleSwitch checked={widget.enabled} onChange={() => handleWidgetToggle(widget.id)} />
                                <span className={`font-medium ${widget.enabled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 line-through'}`}>{WIDGET_NAMES[widget.id]}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </SettingsCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <SettingsCard title="حالت نمایش و سایدبار">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">نمایش برنامه را بین روشن و تاریک تغییر دهید.</p>
                    <ThemeToggle />
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 mt-6">حالت منوی کناری را برای استفاده بهینه از فضا انتخاب کنید.</p>
                     <div className="p-1 rounded-custom bg-slate-200 dark:bg-slate-700/50 flex gap-1">
                        <button onClick={() => setThemeSettings(s => ({...s, sidebarMode: 'full'}))} className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors ${themeSettings.sidebarMode === 'full' ? `text-white ${ActiveBgClasses(themeSettings.color)}` : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}`}>کامل</button>
                        <button onClick={() => setThemeSettings(s => ({...s, sidebarMode: 'compact'}))} className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors ${themeSettings.sidebarMode === 'compact' ? `text-white ${ActiveBgClasses(themeSettings.color)}` : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}`}>فشرده</button>
                    </div>
                </SettingsCard>

                <SettingsCard title="رنگ بندی">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">رنگ اصلی رابط کاربری را انتخاب کنید.</p>
                    <div className="flex items-center gap-4">
                        {colorOptions.map(opt => (
                            <button key={opt.name} onClick={() => setThemeSettings(s => ({...s, color: opt.name}))}
                                className={`w-8 h-8 rounded-full ${opt.class} transition hover:scale-110 ${themeSettings.color === opt.name ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${ActiveRingClasses(themeSettings.color)}` : ''}`}
                            ></button>
                        ))}
                    </div>
                </SettingsCard>
            </div>

            <SettingsCard title="فونت و ظاهر">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">اندازه فونت</h4>
                        <div className="p-1 rounded-custom bg-slate-200 dark:bg-slate-700/50 flex gap-1">
                             {fontSizeOptions.map(opt => (
                                <button key={opt.name} onClick={() => setThemeSettings(s => ({...s, fontSize: opt.name}))} className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors ${themeSettings.fontSize === opt.name ? `text-white ${ActiveBgClasses(themeSettings.color)}` : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}`}>{opt.label}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">گردی گوشه‌ها</h4>
                        <div className="p-1 rounded-custom bg-slate-200 dark:bg-slate-700/50 flex gap-1 items-center justify-around">
                            {borderRadiusOptions.map(opt => (
                                <button key={opt.name} onClick={() => setThemeSettings(s => ({...s, borderRadius: opt.name}))} className={`h-8 w-1/3 transition-all ${opt.class} ${themeSettings.borderRadius === opt.name ? `${ActiveBgClasses(themeSettings.color)}`: 'bg-white dark:bg-slate-600 hover:dark:bg-slate-500'}`}></button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">فونت برنامه</h4>
                        <select value={themeSettings.fontFamily} onChange={(e) => setThemeSettings(s => ({...s, fontFamily: e.target.value as FontFamily}))} className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                           {fontFamilyOptions.map(opt => <option key={opt.name} value={opt.name} className={opt.class}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
            </SettingsCard>
            
            <SettingsCard title="پس زمینه">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">تصویر یا رنگ پس زمینه برنامه را انتخاب کنید.</p>
                <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-custom mb-4">
                    <button onClick={() => setThemeSettings(s => ({...s, backgroundType: 'image'}))} className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors ${themeSettings.backgroundType === 'image' ? `text-white ${ActiveBgClasses(themeSettings.color)}` : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}`}>تصویر</button>
                    <button onClick={() => setThemeSettings(s => ({...s, backgroundType: 'color'}))} className={`w-full py-2 px-4 rounded-custom text-sm font-medium transition-colors ${themeSettings.backgroundType === 'color' ? `text-white ${ActiveBgClasses(themeSettings.color)}` : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}`}>رنگ</button>
                </div>
                 {themeSettings.backgroundType === 'image' ? (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {backgroundImages.map(img => (
                            <button key={img.name} onClick={() => setThemeSettings(s => ({...s, backgroundImage: img.url}))} className={`relative aspect-video rounded-md overflow-hidden transition-all ${themeSettings.backgroundImage === img.url ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${ActiveRingClasses(themeSettings.color)}` : ''}`}>
                                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                                    <p className="text-white text-xs font-semibold">{img.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                 ) : (
                    <div>
                         <label htmlFor="backgroundColor" className="text-sm text-slate-600 dark:text-slate-300 mb-2 block">رنگ پس زمینه و متن را انتخاب کنید:</label>
                         <div className="flex items-center gap-4">
                            <input id="backgroundColor" type="color" value={themeSettings.backgroundColor || '#ffffff'} onChange={e => setThemeSettings(s => ({...s, backgroundColor: e.target.value}))} className="w-16 h-10 p-1 bg-white rounded-md cursor-pointer" />
                            <input id="textColor" type="color" value={themeSettings.textColor || '#000000'} onChange={e => setThemeSettings(s => ({...s, textColor: e.target.value}))} className="w-16 h-10 p-1 bg-white rounded-md cursor-pointer" />
                            <button onClick={() => setThemeSettings(s => ({...s, backgroundColor: '', textColor: ''}))} className="text-xs text-slate-500 hover:underline">بازنشانی</button>
                         </div>
                    </div>
                 )}
            </SettingsCard>
        </div>
    );
};

const SettingsCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        {children}
    </div>
);

const ToggleSwitch: React.FC<{checked: boolean; onChange: () => void}> = ({ checked, onChange }) => {
    const { themeSettings } = useTheme();
    const activeBgColorClass = {
        blue: 'bg-blue-600', red: 'bg-red-600', green: 'bg-green-600',
        purple: 'bg-purple-600', orange: 'bg-orange-600',
    }[themeSettings.color];

    return (
        <button type="button" role="switch" aria-checked={checked} onClick={onChange}
            className={`${checked ? activeBgColorClass : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}>
            <span className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
        </button>
    );
};

export default Personalization;