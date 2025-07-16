
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../types';
import { useDb } from '../contexts/DbContext';
import { ShareIcon } from '../constants';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};

const ShareSettingsPage: React.FC = () => {
    const { themeSettings } = useTheme();
    const db = useDb();
    const [services, setServices] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = React.useState('');

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const servicesFromDb = await db.products.where('type').equals('service').toArray();
                setServices(servicesFromDb);
            } catch (error) {
                console.error("Failed to fetch services:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, [db]);

    const handleShareChange = (serviceId: string, customerType: 'normal' | 'vip', inputType: 'main' | 'commission', value: string) => {
        const inputValue = parseFloat(value) || 0;
        setServices(currentServices =>
            currentServices.map(s => {
                if (s.id === serviceId) {
                    const price = s.price;
                    let mainShareValue: number;
                    let commissionShareValue: number;

                    if (inputType === 'commission') {
                        commissionShareValue = inputValue;
                        mainShareValue = price - commissionShareValue;
                    } else { // inputType is 'main'
                        mainShareValue = inputValue;
                        commissionShareValue = price - mainShareValue;
                    }
                    
                    const currentSettings = s.shareSettings || {
                        normal: { mainShare: 0, commissionShare: 0 },
                        vip: { mainShare: 0, commissionShare: 0 },
                    };
                    const updatedSettings = { ...currentSettings };
                     updatedSettings[customerType] = {
                        mainShare: mainShareValue,
                        commissionShare: commissionShareValue,
                    };
                    return {
                        ...s,
                        shareSettings: updatedSettings
                    };
                }
                return s;
            })
        );
    };

    const handleSaveAll = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await db.products.bulkPut(services);
            setMessage('تغییرات با موفقیت ذخیره شد.');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Failed to save share settings", error);
            setMessage('خطا در ذخیره تغییرات.');
        } finally {
            setIsLoading(false);
        }
    };

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <SettingsCard title="تنظیمات تقسیم سهام خدمات">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                   در این بخش می‌توانید سهام را برای مشتریان عادی و VIP به صورت مجزا تعریف کنید.
                </p>

                {isLoading ? (
                    <p>در حال بارگذاری خدمات...</p>
                ) : services.length === 0 ? (
                    <div className="text-center py-10 px-6 bg-slate-50 dark:bg-slate-800 rounded-custom border border-slate-200 dark:border-slate-700/50">
                        <ShareIcon className="mx-auto h-10 w-10 text-slate-400" />
                        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">هیچ خدمتی ثبت نشده است</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">برای تعریف سهام، ابتدا باید از بخش "تعاریف" یک خدمت ایجاد کنید.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSaveAll}>
                        <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-sm">
                                        <tr>
                                            <th rowSpan={2} className="px-4 py-3 text-right font-medium align-bottom">نام خدمت</th>
                                            <th rowSpan={2} className="px-4 py-3 text-right font-medium align-bottom">قیمت</th>
                                            <th colSpan={2} className="px-4 py-2 text-center font-medium border-b border-l border-r border-slate-200 dark:border-slate-600">مشتری عادی</th>
                                            <th colSpan={2} className="px-4 py-2 text-center font-medium border-b border-slate-200 dark:border-slate-600">مشتری VIP</th>
                                        </tr>
                                        <tr>
                                            <th className="px-4 py-2 text-right font-medium border-l border-r border-slate-200 dark:border-slate-600">سهم کارمزد</th>
                                            <th className="px-4 py-2 text-right font-medium border-l border-r border-slate-200 dark:border-slate-600">سهم اصلی</th>
                                            <th className="px-4 py-2 text-right font-medium border-l border-r border-slate-200 dark:border-slate-600">سهم اصلی</th>
                                            <th className="px-4 py-2 text-right font-medium">سهم کارمزد</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                        {services.map(service => {
                                            const normalShares = service.shareSettings?.normal || { mainShare: 0, commissionShare: 0 };
                                            const vipShares = service.shareSettings?.vip || { mainShare: 0, commissionShare: 0 };
                                            
                                            return (
                                                <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm">
                                                    <td className="px-4 py-2 whitespace-nowrap font-semibold">{service.name}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap font-mono">{formatCurrency(service.price)}</td>
                                                    
                                                    {/* Normal Customer */}
                                                    <td className="px-4 py-2 w-36 border-l border-r border-slate-200 dark:border-slate-600">
                                                        <input type="number" value={normalShares.commissionShare} onChange={(e) => handleShareChange(service.id, 'normal', 'commission', e.target.value)} className="w-full h-9 px-2 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700/50" />
                                                    </td>
                                                    <td className="px-4 py-2 w-36 border-l border-r border-slate-200 dark:border-slate-600">
                                                        <div className="w-full h-9 px-2 flex items-center justify-start font-mono text-slate-600 dark:text-slate-300">
                                                           {formatCurrency(normalShares.mainShare)}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* VIP Customer */}
                                                    <td className="px-4 py-2 w-36 border-l border-r border-slate-200 dark:border-slate-600">
                                                        <input type="number" value={vipShares.mainShare} onChange={(e) => handleShareChange(service.id, 'vip', 'main', e.target.value)} className="w-full h-9 px-2 border border-slate-300 dark:border-slate-600 rounded-custom bg-slate-50 dark:bg-slate-700/50" />
                                                    </td>
                                                     <td className="px-4 py-2 w-36">
                                                        <div className="w-full h-9 px-2 flex items-center justify-start font-mono text-slate-600 dark:text-slate-300">
                                                           {formatCurrency(vipShares.commissionShare)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-end gap-4">
                            {message && (
                                <div className="text-sm text-green-600 dark:text-green-400 transition-opacity duration-300">
                                    {message}
                                </div>
                            )}
                            <button type="submit" disabled={isLoading} className={`px-6 py-2 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${themeColorClass} ${isLoading ? 'opacity-50 cursor-wait' : ''}`}>
                                {isLoading ? 'در حال ذخیره...' : 'ذخیره تمام تغییرات'}
                            </button>
                        </div>
                    </form>
                )}
            </SettingsCard>
        </div>
    );
};

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);

export default ShareSettingsPage;
