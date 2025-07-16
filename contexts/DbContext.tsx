import React, { createContext, useContext, useMemo } from 'react';
import { getDbForFiscalYear } from '../db';
import { useTheme } from './ThemeContext';
import Dexie from 'dexie';

// Define a type for the DB instance that getDbForFiscalYear returns
type FiscalDb = ReturnType<typeof getDbForFiscalYear>;

const DbContext = createContext<FiscalDb | null>(null);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeFiscalYearId } = useTheme();

    const db = useMemo(() => {
        if (activeFiscalYearId) {
            try {
                return getDbForFiscalYear(activeFiscalYearId);
            } catch (error) {
                console.error("Error getting DB for fiscal year:", error);
                return null;
            }
        }
        return null;
    }, [activeFiscalYearId]);

    // This loading state is crucial. It prevents the app from rendering
    // with a null DB context while the active fiscal year is being determined.
    if (!activeFiscalYearId) {
         return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-300">در حال بارگذاری اطلاعات سال مالی...</p>
                </div>
            </div>
        );
    }
    
    if (!db) {
         return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-4">
                    <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                        سال مالی انتخاب نشده است
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        برای ادامه، لطفا به بخش <b className="font-bold">تنظیمات &gt; مدیریت سال مالی</b> رفته و یک سال مالی را فعال کنید.
                    </p>
                </div>
            </div>
        );
    }

    return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};

export const useDb = () => {
    const context = useContext(DbContext);
    if (!context) {
        throw new Error("useDb must be used within a DbProvider. This usually means a fiscal year is not active.");
    }
    return context;
};
