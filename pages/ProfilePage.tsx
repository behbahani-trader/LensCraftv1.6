import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserIcon, LogoutIcon, LoginIcon } from '../constants';

const ProfilePage: React.FC = () => {
    const { currentUser, logout, hasPermission } = useAuth();
    const { themeSettings, appSettings, setAppSettings } = useTheme();
    
    const handleLoginRequiredToggle = () => {
        setAppSettings(s => ({ ...s, loginRequired: !s.loginRequired }));
    };

    const handleLoginToggle = () => {
        setAppSettings(s => ({ ...s, loginEnabled: !s.loginEnabled }));
    };

    const isAdmin = currentUser?.username === 'mohammad';
    const isGuest = currentUser?.username === 'کاربر مهمان';

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`p-4 rounded-full ${colorClasses[themeSettings.color]} text-white`}>
                       <UserIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentUser?.username}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                           {isGuest ? 'حالت مهمان' : 'کاربر برنامه'}
                        </p>
                    </div>
                </div>
            </div>

            {!isGuest && (
                 <SettingsCard title="اطلاعات حساب کاربری">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="نام کاربری" value={currentUser?.username || 'N/A'} />
                        <InfoField label="ایمیل" value="—" />
                        <InfoField label="تاریخ عضویت" value="۱۴۰۳/۰۱/۰۱" />
                         <InfoField label="نقش" value={isAdmin ? 'مدیر سیستم' : 'کاربر'} />
                    </div>
                </SettingsCard>
            )}
            
            {!isGuest && (
                <SettingsCard title="تغییر رمز عبور">
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">برای امنیت بیشتر، به صورت دوره‌ای رمز عبور خود را تغییر دهید.</p>
                     <form className="space-y-4 max-w-sm">
                        <Input id="current-password" label="رمز عبور فعلی" type="password" />
                        <Input id="new-password" label="رمز عبور جدید" type="password" />
                        <Input id="confirm-password" label="تکرار رمز عبور جدید" type="password" />
                        <div className="pt-2">
                             <button type="button" className={`px-4 py-2 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]} opacity-50 cursor-not-allowed`}>
                                بروزرسانی رمز عبور
                            </button>
                        </div>
                     </form>
                </SettingsCard>
            )}

            {hasPermission('page:settings:system') && (
                <SettingsCard title="تنظیمات سیستم">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-800 dark:text-slate-200">الزامی بودن ورود</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">در صورت فعال بودن، کاربران باید قبل از ورود به برنامه احراز هویت شوند.</p>
                        </div>
                        <ToggleSwitch checked={appSettings.loginRequired} onChange={handleLoginRequiredToggle} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-slate-800 dark:text-slate-200">فعال‌سازی ورود کاربران عادی</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">با غیرفعال کردن، فقط مدیر سیستم می‌تواند وارد شود. (فقط در حالت "الزامی بودن ورود" کاربرد دارد)</p>
                            </div>
                            <ToggleSwitch checked={appSettings.loginEnabled} onChange={handleLoginToggle} />
                        </div>
                    </div>
                </SettingsCard>
            )}

            {isGuest ? (
                 <SettingsCard title="ورود به حساب کاربری">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">برای دسترسی به تمام امکانات و تنظیمات، وارد حساب کاربری خود شوید یا یک حساب جدید بسازید.</p>
                     <div className="flex">
                        <button
                            onClick={logout}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-custom text-white font-semibold transition-colors duration-200 group ${colorClasses[themeSettings.color]}`}
                            aria-label="ورود یا ثبت نام"
                        >
                            <LoginIcon className="w-5 h-5" />
                            <span>ورود / ثبت‌نام</span>
                        </button>
                     </div>
                 </SettingsCard>
            ) : (
                <SettingsCard title="خروج از حساب">
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">با کلیک بر روی دکمه زیر از حساب کاربری خود خارج خواهید شد.</p>
                     <div className="flex">
                        <button
                            onClick={logout}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-custom
                                      bg-red-500 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-600
                                      text-white font-semibold
                                      transition-colors duration-200 group"
                            aria-label="خروج از حساب کاربری"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span>خروج</span>
                        </button>
                     </div>
                </SettingsCard>
            )}
        </div>
    );
};

const SettingsCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);

const InfoField: React.FC<{label: string, value: string}> = ({ label, value }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
    </div>
);

const Input: React.FC<{id: string, label: string, type: string}> = ({ id, label, type }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label}
        </label>
        <input
            id={id}
            type={type}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700/50 cursor-not-allowed text-slate-900 dark:text-slate-100"
            disabled
        />
    </div>
);

const ToggleSwitch: React.FC<{checked: boolean; onChange: () => void}> = ({ checked, onChange }) => {
    const { themeSettings } = useTheme();
    const activeBgColorClass = {
        blue: 'bg-blue-600',
        red: 'bg-red-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
        orange: 'bg-orange-600',
    }[themeSettings.color];

    const focusRingColorClass = {
        blue: 'focus:ring-blue-500',
        red: 'focus:ring-red-500',
        green: 'focus:ring-green-500',
        purple: 'focus:ring-purple-500',
        orange: 'focus:ring-orange-500',
    }[themeSettings.color];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`${
                checked ? activeBgColorClass : 'bg-slate-300 dark:bg-slate-600'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${focusRingColorClass}`}
        >
            <span className="sr-only">Use setting</span>
            <span
                aria-hidden="true"
                className={`${
                    checked ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
};

export default ProfilePage;