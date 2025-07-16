import React from 'react';

const MainContent: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent 
            bg-gradient-to-r 
            from-blue-500 to-teal-400 
            dark:from-blue-400 dark:to-teal-300 
            data-[theme-color='red']:from-red-500 data-[theme-color='red']:to-orange-400 
            dark:data-[theme-color='red']:from-red-400 dark:data-[theme-color='red']:to-orange-300 
            data-[theme-color='green']:from-green-500 data-[theme-color='green']:to-emerald-400 
            dark:data-[theme-color='green']:from-green-400 dark:data-[theme-color='green']:to-emerald-300 
            data-[theme-color='purple']:from-purple-500 data-[theme-color='purple']:to-pink-400 
            dark:data-[theme-color='purple']:from-purple-400 dark:data-[theme-color='purple']:to-pink-300 
            data-[theme-color='orange']:from-orange-500 data-[theme-color='orange']:to-amber-400 
            dark:data-[theme-color='orange']:from-orange-400 dark:data-[theme-color='orange']:to-amber-300 
            transition-all duration-300 animate-pulse">
            سلام دنیا
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            این یک رابط کاربری مدرن با ری اکت و تیلویند است.
          </p>
      </div>
    </div>
  );
};

export default MainContent;