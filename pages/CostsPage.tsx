import React, { useState, useEffect, useMemo } from 'react';
import { Cost } from '../types';
import AddCostModal from '../components/AddCostModal';
import CostList from '../components/CostList';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../contexts/DbContext';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';

const CostsPage: React.FC = () => {
    const [costs, setCosts] = useState<Cost[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Cost | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();
    const db = useDb();
    
    const fetchCosts = async () => {
        try {
            const storedCosts = await db.costs.toArray();
            setCosts(storedCosts);
        } catch (error) {
            console.error("Failed to fetch costs from DB", error);
            setCosts([]);
        }
    };

    useEffect(() => {
        fetchCosts();
    }, [db]);

    const filteredCosts = useMemo(() => {
        if (!searchTerm.trim()) return costs;
        const lowercasedFilter = searchTerm.toLowerCase();
        return costs.filter(c => c.name.toLowerCase().includes(lowercasedFilter));
    }, [costs, searchTerm]);

    const handleSaveCost = async (costData: Omit<Cost, 'id'> & { id?: string }) => {
        try {
            if (costData.id) { // Update
                await db.costs.put({ ...costData, id: costData.id });
            } else { // Create
                const costWithId = { ...costData, id: Date.now().toString() };
                await db.costs.add(costWithId);
            }
            fetchCosts();
        } catch(error) {
            console.error("Failed to save cost to DB", error);
        }
    };

    const handleDeleteCost = async (costId: string) => {
        if (window.confirm('آیا از حذف این هزینه مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
            try {
                // TODO: Check if this cost is used in any invoices before deleting
                await db.costs.delete(costId);
                fetchCosts();
            } catch (error) {
                console.error("Failed to delete cost:", error);
                alert('خطا در حذف هزینه.');
            }
        }
    };

    const handleEditCost = (cost: Cost) => {
        setItemToEdit(cost);
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setItemToEdit(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لیست هزینه‌های اضافی</h1>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجوی هزینه..."
                    />
                    {hasPermission('page:costs:create') && (
                        <button
                            onClick={handleCreateNew}
                            className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                        >
                            افزودن هزینه جدید
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-6">
                {filteredCosts.length > 0 ? (
                    <CostList 
                        costs={filteredCosts} 
                        onEdit={hasPermission('page:costs:edit') ? handleEditCost : undefined} 
                        onDelete={hasPermission('page:costs:delete') ? handleDeleteCost : undefined} 
                    />
                ) : searchTerm ? (
                    <SearchEmptyState />
                ) : (
                    <CostList costs={[]} />
                )}
            </div>

            <AddCostModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSaveCost={handleSaveCost}
                itemToEdit={itemToEdit}
            />
        </div>
    );
};

export default CostsPage;