import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { KeyIcon } from '../constants';

const AISettingsPage: React.FC = () => {
    const { aiSettings, setAiSettings, themeSettings } = useTheme();
    const [apiKey, setApiKey] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        setApiKey(aiSettings.apiKey || '');
    }, [aiSettings.apiKey]);

    const handleSave = () => {
        setAiSettings({ apiKey });
        setMessage('کلید API با موفقیت ذخیره شد.');
        setTimeout(() => setMessage(''), 3000);
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
            <SettingsCard title="تنظیمات دستیار هوش مصنوعی">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    برای استفاده از دستیار هوش مصنوعی، باید کلید API خود را از Google AI Studio دریافت و در اینجا وارد کنید.
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-900/50 border-r-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 rounded-custom mb-6 text-sm" role="alert">
                    <p><strong>مهم:</strong> کلید API شما فقط در حافظه مرورگر شما (localStorage) ذخیره می‌شود و به هیچ سروری ارسال نمی‌گردد. این کلید برای ارتباط مستقیم با سرویس Gemini استفاده می‌شود.</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        کلید API جمنای (Gemini API Key)
                    </label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="کلید خود را اینجا وارد کنید"
                        className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                    />
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        چگونه کلید API دریافت کنم؟
                    </a>
                    <button
                        onClick={handleSave}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${themeColorClass}`}
                    >
                        ذخیره
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


export default AISettingsPage;