import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useTheme } from '../contexts/ThemeContext';
import { useDb } from '../contexts/DbContext';
import { SparklesIcon, KeyIcon } from '../constants';

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">در حال تحلیل داده‌ها، لطفا صبر کنید...</p>
    </div>
);

const SuggestionChip: React.FC<{ text: string; onClick: () => void; disabled: boolean }> = ({ text, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {text}
    </button>
);

const ResponseDisplay: React.FC<{ htmlContent: string }> = ({ htmlContent }) => (
    <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: htmlContent }} />
);

const AIPage: React.FC = () => {
    const { themeSettings, aiSettings } = useTheme();
    const db = useDb();
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const apiKey = aiSettings.apiKey;

    const handleGenerate = async (query?: string) => {
        const currentQuery = query || prompt;
        if (!currentQuery.trim() || isLoading) return;

        if (!apiKey) {
            setError('کلید API تنظیم نشده است. لطفا از بخش تنظیمات AI کلید خود را وارد کنید.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResponse('');
        if(query) setPrompt(query);

        try {
            const ai = new GoogleGenAI({ apiKey });

            const [customers, invoices, products, transactions, costs, shares, partners, partnerTransactions, expenses, wastages] = await Promise.all([
                db.customers.toArray(),
                db.invoices.toArray(),
                db.products.toArray(),
                db.cashTransactions.toArray(),
                db.costs.toArray(),
                db.shares.toArray(),
                db.partners.toArray(),
                db.partnerTransactions.toArray(),
                db.expenses.toArray(),
                db.wastages.toArray(),
            ]);

            const businessData = { customers, invoices, products, transactions, costs, shares, partners, partnerTransactions, expenses, wastages };
            const dataString = JSON.stringify(businessData);
            
            const systemInstruction = "You are an expert business analyst named 'Lensa', the AI assistant for the 'Lens Craft' application. Your role is to analyze the provided JSON data and answer user questions in Persian. The data model includes: 'customers' (client list), 'products' (includes goods and services), 'invoices' (sales records linking customers and products, with payment details), 'transactions' (all cash flow from/to main and VIP cash boxes, linked to invoices), 'costs' (pre-defined extra costs for invoices), 'shares' (profit sharing records from services sold in invoices), 'partners' (business partners), 'partnerTransactions' (financial movements between partners and the business), 'expenses' (general business expenses like rent, salaries, etc.), and 'wastages' (records of scrapped items or materials and their associated cost). Provide clear, actionable insights and well-formatted responses using Markdown. Always be friendly, helpful, and address the user in Persian.";
            
            const userContent = `Here is all my business data in JSON format:\n${dataString}\n\nBased on this data, please answer my question: "${currentQuery}"`;

            const resultStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: userContent,
                config: {
                    systemInstruction: systemInstruction,
                },
            });

            let fullResponse = '';
            for await (const chunk of resultStream) {
                fullResponse += chunk.text;
                setResponse(fullResponse);
            }

        } catch (err: any) {
            console.error("AI Assistant Error:", err);
            let errorMessage = 'متاسفانه در ارتباط با دستیار هوش مصنوعی خطایی رخ داد.';
            if (err.message && err.message.includes('API key not valid')) {
                errorMessage = 'کلید API وارد شده معتبر نیست. لطفا آن را در بخش تنظیمات AI بررسی کنید.';
            } else {
                 errorMessage = 'متاسفانه در ارتباط با دستیار هوش مصنوعی خطایی رخ داد. لطفا از اتصال اینترنت و صحیح بودن کلید API اطمینان حاصل کنید.';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const formattedResponse = useMemo(() => {
        if (!response) return '';
        
        let html = response
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-2">$1</h3>');

        // Process lists
        const listRegex = /((?:^- .*(?:\n|$))+)/gm;
        html = html.replace(listRegex, (match) => {
            const items = match.trim().split('\n').map(item => `<li class="ml-4">${item.substring(2).trim()}</li>`).join('');
            return `<ul class="list-disc space-y-1 my-3">${items}</ul>`;
        });
        
        return html;
    }, [response]);

    const suggestionPrompts = [
        "تحلیل کلی از وضعیت فروش به من بده.",
        "کدام مشتریان بیشترین خرید را داشته‌اند؟",
        "کدام محصولات یا خدمات پرفروش‌ترین هستند؟",
        "بیشترین هزینه‌های عمومی من در کدام دسته‌ها بوده است؟",
        "میزان کل هزینه ضایعات چقدر است؟",
        "یک پیشنهاد برای افزایش فروش بر اساس داده‌ها ارائه بده.",
    ];

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    
    if (!apiKey) {
        return (
             <div className="max-w-4xl mx-auto text-center p-8 bg-yellow-50 dark:bg-yellow-900/50 rounded-custom border border-yellow-300 dark:border-yellow-700">
                <KeyIcon className="w-12 h-12 mx-auto text-yellow-500" />
                <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mt-4">نیاز به تنظیمات اولیه</h2>
                <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                    برای فعال‌سازی دستیار هوش مصنوعی، ابتدا باید کلید API خود را وارد کنید.
                </p>
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                    لطفا به بخش <span className="font-bold">تنظیمات &gt; تنظیمات AI</span> در منوی کناری مراجعه کنید.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center p-6 bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50">
                <SparklesIcon className={`w-12 h-12 mx-auto text-blue-500 data-[theme-color='red']:text-red-500 data-[theme-color='green']:text-green-500 data-[theme-color='purple']:text-purple-500 data-[theme-color='orange']:text-orange-500 transition-colors`} data-theme-color={themeSettings.color}/>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">دستیار هوش مصنوعی کسب‌وکار شما</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">از من در مورد فروش، مشتریان و روند کسب‌وکارتان بپرسید تا به شما کمک کنم.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50 space-y-4">
                 <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">چند پیشنهاد برای شروع:</p>
                    {suggestionPrompts.map(p => (
                        <SuggestionChip key={p} text={p} onClick={() => handleGenerate(p)} disabled={isLoading}/>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                        placeholder="سوال خود را اینجا بنویسید..."
                        className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-slate-50 dark:bg-slate-700/50 focus:ring-blue-500 focus:border-blue-500 transition w-full text-slate-900 dark:text-slate-100"
                        rows={3}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleGenerate()}
                        disabled={isLoading}
                        className={`w-full sm:w-auto px-6 py-2 text-white font-semibold rounded-custom shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                            isLoading ? 'bg-slate-400 dark:bg-slate-500 cursor-not-allowed' : `${colorClasses[themeSettings.color]}`
                        }`}
                    >
                        {isLoading ? 'در حال پردازش...' : 'ارسال'}
                    </button>
                </div>
            </div>

            {(isLoading || response || error) && (
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-custom border border-slate-200 dark:border-slate-700/50 min-h-[12rem]">
                    {isLoading && !response && <LoadingSpinner />}
                    {error && <p className="text-red-500">{error}</p>}
                    {response && <ResponseDisplay htmlContent={formattedResponse} />}
                </div>
            )}
        </div>
    );
};

export default AIPage;