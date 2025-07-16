
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../contexts/DbContext';
import { Page, Customer } from '../types';
import { SearchIcon, HomeIcon, LedgerIcon, InvoiceIcon, OrdersIcon, UserIcon, PackageIcon } from '../constants';

interface CommandPaletteProps {
    onClose: () => void;
    setActivePage: (page: Page, state?: any) => void;
    onSelectCustomer: (customer: Customer) => void;
}

type Command = {
    type: 'page' | 'customer' | 'action';
    id: string;
    title: string;
    group: string;
    icon?: React.ReactNode;
    action?: () => void;
};

const PAGE_ICONS: Record<string, React.ReactNode> = {
    home: <HomeIcon className="w-5 h-5" />,
    customerLedger: <LedgerIcon className="w-5 h-5" />,
    invoices: <InvoiceIcon className="w-5 h-5" />,
    orders: <OrdersIcon className="w-5 h-5" />,
    products: <PackageIcon className="w-5 h-5" />,
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, setActivePage, onSelectCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [commands, setCommands] = useState<Command[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const { hasPermission } = useAuth();
    const db = useDb();
    const inputRef = useRef<HTMLInputElement>(null);

    const PAGES_TO_SEARCH: { id: Page; title: string; permission: any }[] = [
        { id: 'home', title: 'داشبورد', permission: 'page:home:view' },
        { id: 'customerLedger', title: 'دفتر معین', permission: 'page:customerLedger:view' },
        { id: 'invoices', title: 'فاکتورها', permission: 'page:invoices:view' },
        { id: 'orders', title: 'سفارشات', permission: 'page:orders:view' },
        { id: 'products', title: 'محصولات', permission: 'page:products:view' },
        { id: 'services', title: 'خدمات', permission: 'page:services:view' },
        { id: 'reports', title: 'گزارشات', permission: 'page:reports:view' },
        { id: 'profile', title: 'پروفایل', permission: 'page:profile:view' },
    ];

    useEffect(() => {
        const fetchCommands = async () => {
            const pageCommands: Command[] = PAGES_TO_SEARCH
                .filter(p => hasPermission(p.permission))
                .map(p => ({
                    type: 'page',
                    id: `page-${p.id}`,
                    title: p.title,
                    group: 'صفحات',
                    icon: PAGE_ICONS[p.id] || <div className="w-5 h-5" />,
                    action: () => setActivePage(p.id)
                }));
            
            const customers = await db.customers.toArray();
            const customerCommands: Command[] = customers.map(c => ({
                type: 'customer',
                id: `customer-${c.id}`,
                title: `${c.firstName} ${c.lastName}`,
                group: 'مشتریان',
                icon: <UserIcon className="w-5 h-5" />,
                action: () => onSelectCustomer(c)
            }));

            // TODO: Add more actions like "Create Invoice" etc.

            setCommands([...pageCommands, ...customerCommands]);
        };

        fetchCommands();
        inputRef.current?.focus();
    }, [hasPermission, db]);

    const filteredCommands = useMemo(() => {
        if (!searchTerm) return commands;
        return commands.filter(cmd => cmd.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, commands]);

    const groupedCommands = useMemo(() => {
        return filteredCommands.reduce((acc, cmd) => {
            (acc[cmd.group] = acc[cmd.group] || []).push(cmd);
            return acc;
        }, {} as Record<string, Command[]>);
    }, [filteredCommands]);

    const flatCommands = useMemo(() => Object.values(groupedCommands).flat(), [groupedCommands]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => (i + 1) % flatCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => (i - 1 + flatCommands.length) % flatCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatCommands[activeIndex]) {
                flatCommands[activeIndex].action?.();
                onClose();
            }
        }
    };
    
    const activeItemRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        activeItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-[15vh]" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-custom shadow-2xl w-full max-w-2xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setActiveIndex(0); }}
                        onKeyDown={handleKeyDown}
                        placeholder="جستجو در دستورات یا صفحات..."
                        className="w-full bg-transparent p-4 pr-12 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 max-h-[50vh] overflow-y-auto">
                    {flatCommands.length > 0 ? (
                        <ul>
                            {Object.entries(groupedCommands).map(([group, cmds]) => (
                                <li key={group}>
                                    <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 sticky top-0">{group}</h3>
                                    <ul>
                                        {cmds.map(cmd => {
                                            const isSelected = cmd.id === flatCommands[activeIndex]?.id;
                                            return (
                                                <li
                                                    key={cmd.id}
                                                    ref={isSelected ? activeItemRef : null}
                                                    onClick={() => { cmd.action?.(); onClose(); }}
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                                >
                                                    <div className="text-slate-500 dark:text-slate-400">{cmd.icon}</div>
                                                    <span className="text-sm text-slate-800 dark:text-slate-200">{cmd.title}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-6 text-center text-sm text-slate-500">موردی یافت نشد.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
