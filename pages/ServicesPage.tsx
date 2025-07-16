
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import AddProductModal from '../components/AddProductModal';
import ProductList from '../components/ProductList';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../contexts/DbContext';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';

const ServicesPage: React.FC = () => {
    const db = useDb();
    const [services, setServices] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();
    
    const fetchServices = async () => {
        try {
            const storedServices = await db.products.where('type').equals('service').toArray();
            setServices(storedServices);
        } catch (error) {
            console.error("Failed to fetch services from DB", error);
            setServices([]);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [db]);

    const filteredServices = useMemo(() => {
        if (!searchTerm.trim()) return services;
        const lowercasedFilter = searchTerm.toLowerCase();
        return services.filter(s =>
            s.name.toLowerCase().includes(lowercasedFilter) ||
            (s.description && s.description.toLowerCase().includes(lowercasedFilter))
        );
    }, [services, searchTerm]);

    const handleSaveService = async (serviceData: Omit<Product, 'id'> & { id?: string }) => {
        try {
            if (serviceData.id) { // Update
                await db.products.put({ ...serviceData, id: serviceData.id, type: 'service' });
            } else { // Create
                const serviceWithId = { ...serviceData, id: Date.now().toString(), type: 'service' };
                await db.products.add(serviceWithId as Product);
            }
            fetchServices();
        } catch(error) {
            console.error("Failed to save service to DB", error);
        }
    };
    
    const handleDeleteService = async (serviceId: string) => {
        try {
            const invoiceCount = await db.invoices.where('items.productId').equals(serviceId).count();
            if (invoiceCount > 0) {
                alert('این خدمت قابل حذف نیست زیرا در یک یا چند فاکتور استفاده شده است.');
                return;
            }

            if (window.confirm('آیا از حذف این خدمت مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
                await db.products.delete(serviceId);
                fetchServices();
            }
        } catch (error) {
            console.error("Failed to delete service from DB", error);
            alert('خطا در حذف خدمت.');
        }
    };

    const handleEditService = (service: Product) => {
        setItemToEdit(service);
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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لیست خدمات</h1>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجوی خدمت..."
                    />
                    {hasPermission('page:services:create') && (
                        <button
                            onClick={handleCreateNew}
                            className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                        >
                            افزودن خدمت جدید
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-6">
                {filteredServices.length > 0 ? (
                    <ProductList 
                        products={filteredServices} 
                        onEdit={hasPermission('page:services:edit') ? handleEditService : undefined} 
                        onDelete={hasPermission('page:services:delete') ? handleDeleteService : undefined} 
                    />
                ) : searchTerm ? (
                    <SearchEmptyState />
                ) : (
                    <ProductList products={[]} />
                )}
            </div>

            <AddProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSaveProduct={handleSaveService}
                itemToEdit={itemToEdit}
                mode="service"
            />
        </div>
    );
};

export default ServicesPage;
