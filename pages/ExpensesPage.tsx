
import React, { useState, useEffect, useMemo } from 'react';
import { Expense } from '../types';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseList from '../components/ExpenseList';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../contexts/DbContext';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';

const ExpensesPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();
    const db = useDb();
    
    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const storedExpenses = await db.expenses.orderBy('date').reverse().toArray();
                setExpenses(storedExpenses);
            } catch (error) {
                console.error("Failed to fetch expenses from DB", error);
                setExpenses([]);
            }
        };
        fetchExpenses();
    }, [db]);

    const filteredExpenses = useMemo(() => {
        if (!searchTerm.trim()) return expenses;
        const lowercasedFilter = searchTerm.toLowerCase();
        return expenses.filter(exp =>
            exp.description.toLowerCase().includes(lowercasedFilter) ||
            exp.category.toLowerCase().includes(lowercasedFilter)
        );
    }, [expenses, searchTerm]);

    const handleAddExpense = async (newExpenseData: Omit<Expense, 'id'>) => {
        const expenseWithId: Expense = { ...newExpenseData, id: Date.now().toString() };
        try {
            await db.expenses.add(expenseWithId);
            setExpenses(prev => [expenseWithId, ...prev].sort((a,b) => b.date.localeCompare(a.date)));
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to add expense to DB", error);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (window.confirm('آیا از حذف این هزینه مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
            try {
                await db.expenses.delete(id);
                setExpenses(prev => prev.filter(exp => exp.id !== id));
            } catch (error) {
                console.error("Failed to delete expense:", error);
                alert("خطا در حذف هزینه.");
            }
        }
    };

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">هزینه‌های عمومی</h1>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجوی هزینه..."
                    />
                    {hasPermission('page:expenses:create') && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                        >
                            افزودن هزینه جدید
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-6">
                {filteredExpenses.length > 0 ? (
                    <ExpenseList 
                        expenses={filteredExpenses} 
                        onDelete={handleDeleteExpense} 
                    />
                ) : searchTerm ? (
                    <SearchEmptyState />
                ) : (
                    <ExpenseList expenses={[]} onDelete={handleDeleteExpense} />
                )}
            </div>

            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddExpense={handleAddExpense}
            />
        </div>
    );
};

export default ExpensesPage;
