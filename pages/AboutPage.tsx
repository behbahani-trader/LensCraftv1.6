import React from 'react';

const AboutPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <SettingsCard title="درباره سیستم">
                <div className="space-y-4 text-slate-600 dark:text-slate-300">
                    <p>
                        Lens Craft یک سیستم جامع و مدرن برای مدیریت کسب‌وکار شماست. این برنامه با هدف ساده‌سازی فرآیندهای روزمره و ارائه دیدی شفاف از عملکرد مالی و فروش طراحی شده است. با Lens Craft می‌توانید به راحتی مشتریان، فاکتورها، و امور مالی خود را مدیریت کنید.
                    </p>
                    <p>
                        ویژگی‌های کلیدی سیستم عبارتند از:
                    </p>
                    <ul className="list-disc list-inside space-y-2 pr-4">
                        <li>داشبورد هوشمند برای دسترسی سریع به بخش‌های مهم</li>
                        <li>مدیریت جامع مشتریان و مشاهده دفتر معین هر مشتری</li>
                        <li>تعریف و مدیریت محصولات، خدمات و هزینه‌ها</li>
                        <li>ایجاد و مدیریت فاکتورهای فروش با جزئیات کامل</li>
                        <li>پیگیری وضعیت سفارشات خدمات از ثبت تا تکمیل</li>
                        <li>مدیریت صندوق‌های مالی (اصلی و VIP) با گزارش تراکنش‌ها</li>
                        <li>محاسبه خودکار و گزارش‌گیری سهام بر اساس خدمات</li>
                        <li>دستیار هوش مصنوعی برای تحلیل داده‌ها و پاسخ به سوالات کسب‌وکار</li>
                        <li>گزارشات پیشرفته از فروش، درآمد و مشتریان برتر</li>
                        <li>شخصی‌سازی کامل رابط کاربری (رنگ، فونت، تم روشن/تاریک)</li>
                        <li>قابلیت پشتیبان‌گیری و بازیابی امن اطلاعات</li>
                    </ul>
                </div>
            </SettingsCard>

            <SettingsCard title="اطلاعات سازنده">
                <div className="space-y-3">
                    <p className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <strong className="font-semibold">سازنده:</strong> سید محمد بهبهانی زاده
                    </p>
                    <p className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <strong className="font-semibold">موبایل:</strong>
                        <a href="tel:09123273390" className="text-blue-500 hover:text-blue-400 hover:underline" dir="ltr">09123273390</a>
                    </p>
                </div>
            </SettingsCard>
        </div>
    );
};

// Re-using SettingsCard from ProfilePage for consistent styling
const SettingsCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);


export default AboutPage;