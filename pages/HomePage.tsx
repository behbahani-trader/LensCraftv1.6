import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Page, WidgetID } from '../types';
import { 
    QuickStatsWidget, 
    QuickAccessWidget, 
    TopCustomersWidget, 
    RecentInvoicesWidget 
} from '../components/DashboardWidgets';

const WIDGET_MAP: Record<WidgetID, React.ComponentType<any>> = {
    quickStats: QuickStatsWidget,
    quickAccess: QuickAccessWidget,
    topCustomers: TopCustomersWidget,
    recentInvoices: RecentInvoicesWidget,
};

export const HomePage: React.FC<{ setActivePage: (page: Page, state?: any) => void }> = ({ setActivePage }) => {
    const { currentUser } = useAuth();
    const { dashboardSettings } = useTheme();

    const enabledWidgets = dashboardSettings.widgets.filter(w => w.enabled);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    خوش آمدید، {currentUser?.username}!
                </h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                    خلاصه‌ای از وضعیت کسب و کار شما در یک نگاه.
                </p>
            </div>

            {enabledWidgets.length > 0 ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {enabledWidgets.map(widgetConfig => {
                        const WidgetComponent = WIDGET_MAP[widgetConfig.id];
                        return WidgetComponent ? <WidgetComponent key={widgetConfig.id} setActivePage={setActivePage} /> : null;
                    })}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-custom border border-dashed border-slate-300 dark:border-slate-700">
                     <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">داشبورد خالی است</h3>
                     <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        برای نمایش اطلاعات، به صفحه <button onClick={() => setActivePage('personalization')} className="font-bold text-blue-600 dark:text-blue-400">شخصی‌سازی</button> بروید و ویجت‌های مورد نظر خود را فعال کنید.
                    </p>
                </div>
            )}
        </div>
    );
};