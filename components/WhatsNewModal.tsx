import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SendIcon, ChartIcon, PrintIcon, SparklesIcon, DownloadCloudIcon } from '../constants';

interface WhatsNewModalProps {
    isOpen: boolean;
    onClose: () => void;
    version: string;
}

const features = [
    {
        icon: <SendIcon className="w-6 h-6 text-sky-500" />,
        title: "ارسال فاکتور با تلگرام",
        description: "تصویر فاکتورها را به سادگی و به صورت مستقیم برای مشتریان خود در تلگرام ارسال کنید."
    },
    {
        icon: <ChartIcon className="w-6 h-6 text-emerald-500" />,
        title: "نمودارهای تحلیلی پیشرفته",
        description: "گزارشات خدمات با نمودارهای میله‌ای، دایره‌ای و خطی برای تحلیل دقیق‌تر فروش غنی‌تر شد."
    },
    {
        icon: <PrintIcon className="w-6 h-6 text-slate-500" />,
        title: "تنظیمات چاپ حرفه‌ای",
        description: "ظاهر و محتوای فاکتورها و گزارشات چاپی را با لوگو و اطلاعات کسب‌وکار خود شخصی‌سازی کنید."
    },
    {
        icon: <SparklesIcon className="w-6 h-6 text-amber-500" />,
        title: "فرمان سریع (Ctrl+K) هوشمند",
        description: "با دستورات جدید، آیتم‌های مختلف را سریع‌تر ایجاد کرده و تم برنامه را تغییر دهید."
    },
    {
        icon: <DownloadCloudIcon className="w-6 h-6 text-violet-500" />,
        title: "قابلیت نصب برنامه (PWA)",
        description: "برنامه را روی دسکتاپ یا موبایل خود نصب کنید و از دسترسی سریع و آفلاین لذت ببرید."
    }
];

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose, version }) => {
    const { themeSettings } = useTheme();

    if (!isOpen) return null;

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 text-center border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">✨ تازه‌ها در نسخه {version}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">آخرین بهبودها و ویژگی‌های جدید را کشف کنید.</p>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-5">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-full">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{feature.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-center rounded-b-custom">
                    <button 
                        onClick={onClose} 
                        className={`px-8 py-2 text-base font-semibold text-white rounded-custom shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors ${colorClasses[themeSettings.color]}`}
                    >
                        فهمیدم، عالیه!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsNewModal;