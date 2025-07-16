
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import AddProductModal from '../components/AddProductModal';
import ProductList from '../components/ProductList';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDb } from '../contexts/DbContext';
import SearchInput from '../components/SearchInput';
import SearchEmptyState from '../components/SearchEmptyState';

const ProductsPage: React.FC = () => {
    const db = useDb();
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();
    
    const fetchProducts = async () => {
        try {
            const storedProducts = await db.products.where('type').equals('product').toArray();
            setProducts(storedProducts);
        } catch (error) {
            console.error("Failed to fetch products from DB", error);
            setProducts([]);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [db]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;
        const lowercasedFilter = searchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lowercasedFilter) ||
            (p.description && p.description.toLowerCase().includes(lowercasedFilter))
        );
    }, [products, searchTerm]);

    const handleSaveProduct = async (productData: Omit<Product, 'id'> & { id?: string }) => {
        try {
            if (productData.id) { // Update
                await db.products.put({ ...productData, id: productData.id, type: 'product' });
            } else { // Create
                const productWithId = { ...productData, id: Date.now().toString(), type: 'product' };
                await db.products.add(productWithId as Product);
            }
            fetchProducts();
        } catch(error) {
            console.error("Failed to save product to DB", error);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        try {
            const invoiceCount = await db.invoices.where('items.productId').equals(productId).count();
            if (invoiceCount > 0) {
                alert('این محصول قابل حذف نیست زیرا در یک یا چند فاکتور استفاده شده است.');
                return;
            }

            if (window.confirm('آیا از حذف این محصول مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
                await db.products.delete(productId);
                fetchProducts();
            }
        } catch (error) {
            console.error("Failed to delete product from DB", error);
            alert('خطا در حذف محصول.');
        }
    };

    const handleEditProduct = (product: Product) => {
        setItemToEdit(product);
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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لیست محصولات</h1>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجوی محصول..."
                    />
                    {hasPermission('page:products:create') && (
                        <button
                            onClick={handleCreateNew}
                            className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                        >
                            افزودن محصول جدید
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-6">
                {filteredProducts.length > 0 ? (
                    <ProductList 
                        products={filteredProducts} 
                        onEdit={hasPermission('page:products:edit') ? handleEditProduct : undefined} 
                        onDelete={hasPermission('page:products:delete') ? handleDeleteProduct : undefined} 
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
                onSaveProduct={handleSaveProduct}
                itemToEdit={itemToEdit}
                mode="product"
            />
        </div>
    );
};

export default ProductsPage;
