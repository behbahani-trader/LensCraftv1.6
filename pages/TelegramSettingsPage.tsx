import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SendIcon } from '../constants';

const TelegramSettingsPage: React.FC = () => {
    const { telegramSettings, setTelegramSettings, themeSettings } = useTheme();
    const [settings, setSettings] = useState({
        botToken: '',
        messageTemplate: '',
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        setSettings(telegramSettings);
    }, [telegramSettings]);

    const handleSave = () => {
        setTelegramSettings(settings);
        setMessage('تنظیمات ربات تلگرام با موفقیت ذخیره شد.');
        setTimeout(() => setMessage(''), 3000);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
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
        <div className="max-w-4xl mx-auto space-y-8">
            <SettingsCard title="تنظیمات ربات تلگرام">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    برای ارسال فاکتور از طریق تلگرام، ابتدا یک ربات در تلگرام بسازید (با صحبت کردن با <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500">@BotFather</a>) و توکن آن را در اینجا وارد کنید.
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-900/50 border-r-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 rounded-custom mb-6 text-sm" role="alert">
                    <p><strong>مهم:</strong> توکن ربات شما فقط در حافظه مرورگر شما (localStorage) ذخیره می‌شود و به هیچ سروری ارسال نمی‌گردد. در حفظ و نگهداری آن کوشا باشید.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="botToken" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                           توکن ربات تلگرام (Bot Token)
                        </label>
                        <input
                            id="botToken"
                            name="botToken"
                            type="password"
                            value={settings.botToken}
                            onChange={handleChange}
                            placeholder="توکن ربات خود را اینجا وارد کنید"
                            className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                     <div>
                        <label htmlFor="messageTemplate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                           قالب پیام ارسالی
                        </label>
                        <textarea
                            id="messageTemplate"
                            name="messageTemplate"
                            value={settings.messageTemplate}
                            onChange={handleChange}
                            rows={4}
                            className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                        />
                         <p className="text-xs text-slate-400 mt-1">
                            می‌توانید از تگ‌های زیر در متن پیام خود استفاده کنید:
                             <code className="bg-slate-200 dark:bg-slate-700 text-xs px-1 rounded-sm mx-1 font-mono">{'{customerName}'}</code>
                             برای نام مشتری و
                             <code className="bg-slate-200 dark:bg-slate-700 text-xs px-1 rounded-sm mx-1 font-mono">{'{invoiceNumber}'}</code>
                             برای شماره فاکتور.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end">
                    <button
                        onClick={handleSave}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${themeColorClass}`}
                    >
                        ذخیره تنظیمات
                    </button>
                </div>
                 {message && (
                    <div className="mt-4 text-sm text-green-600 dark:text-green-400">
                        {message}
                    </div>
                )}
            </SettingsCard>
        </div>
    );
};

const SettingsCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);


export default TelegramSettingsPage;