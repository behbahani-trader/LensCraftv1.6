import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../constants';
import { ThemeColor } from '../types';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, themeSettings } = useTheme();

  const getActiveClasses = (color: ThemeColor) => {
      const colorMap: Record<ThemeColor, string> = {
        blue: "bg-blue-600 text-white",
        red: "bg-red-600 text-white",
        green: "bg-green-600 text-white",
        purple: "bg-purple-600 text-white",
        orange: "bg-orange-600 text-white",
      };
      return colorMap[color] || colorMap['blue'];
  }

  const activeClasses = getActiveClasses(themeSettings.color);
  const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600';

  return (
    <div className="p-1 rounded-custom bg-slate-200 dark:bg-slate-700/50 flex gap-1">
        <button
            onClick={() => { if (theme === 'dark') toggleTheme(); }}
            aria-pressed={theme === 'light'}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-custom transition-colors duration-200 text-sm font-medium ${
                theme === 'light' ? activeClasses : inactiveClasses
            }`}
        >
            <SunIcon className="w-5 h-5" />
            <span>روشن</span>
        </button>
        <button
            onClick={() => { if (theme === 'light') toggleTheme(); }}
            aria-pressed={theme === 'dark'}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-custom transition-colors duration-200 text-sm font-medium ${
                theme === 'dark' ? activeClasses : inactiveClasses
            }`}
        >
            <MoonIcon className="w-5 h-5" />
            <span>تاریک</span>
        </button>
    </div>
  );
};

export default ThemeToggle;
