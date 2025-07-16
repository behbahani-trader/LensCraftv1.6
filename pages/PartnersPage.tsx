
import React, { useState, useEffect, useMemo } from 'react';
import { Partner, PartnerTransaction } from '../types';
import { useDb } from '../contexts/DbContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AddPartnerModal from '../components/AddPartnerModal';
import PartnerList from '../components/PartnerList';
import PartnerTransactionModal from '../components/PartnerTransactionModal';
import PartnerDetailsView from '../components/PartnerDetailsView';

const PartnersPage: React.FC = () => {
    const db = useDb();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);
    const [partnerForTx, setPartnerForTx] = useState<Partner | null>(null);
    const [view, setView] = useState<'list' | 'details'>('list');
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

    const { themeSettings } = useTheme();
    const { hasPermission } = useAuth();

    const fetchData = async () => {
        try {
            const [partnersData, transactionsData] = await Promise.all([
                db.partners.toArray(),
                db.partnerTransactions.toArray()
            ]);
            setPartners(partnersData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error("Failed to fetch partners data:", error);
        }
    };

    useEffect(() => {
        if(view === 'list') {
            fetchData();
        }
    }, [view, db]);
    
    const partnerBalances = useMemo(() => {
        const balances = new Map<string, number>();
        partners.forEach(p => {
            balances.set(p.id, p.initialBalance);
        });

        const sortedTransactions = [...transactions].sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

        sortedTransactions.forEach(tx => {
            // Update sender balance for transfers
            if (tx.type === 'transfer_out' && tx.relatedPartnerId) {
                let senderBalance = balances.get(tx.partnerId) || 0;
                balances.set(tx.partnerId, senderBalance - tx.amount);
            }
            // Update receiver balance for transfers
            if (tx.type === 'transfer_in' && tx.relatedPartnerId) {
                let receiverBalance = balances.get(tx.partnerId) || 0;
                 balances.set(tx.partnerId, receiverBalance + tx.amount);
            }
            // Update balance for deposits and withdrawals
            if (tx.type === 'deposit') {
                let balance = balances.get(tx.partnerId) || 0;
                balances.set(tx.partnerId, balance + tx.amount);
            }
            if(tx.type === 'withdrawal') {
                let balance = balances.get(tx.partnerId) || 0;
                balances.set(tx.partnerId, balance - tx.amount);
            }
        });
        
        // Re-calculate based on initial balance and all transactions
        partners.forEach(p => {
            let balance = p.initialBalance;
            const partnerTxs = transactions.filter(t => t.partnerId === p.id);
            partnerTxs.forEach(tx => {
                switch(tx.type) {
                    case 'deposit':
                    case 'transfer_in':
                        balance += tx.amount;
                        break;
                    case 'withdrawal':
                    case 'transfer_out':
                        balance -= tx.amount;
                        break;
                }
            });
            balances.set(p.id, balance);
        });


        return balances;
    }, [partners, transactions]);

    const handleSavePartner = async (partnerData: Omit<Partner, 'id'> & { id?: string }) => {
        try {
            if (partnerData.id) { // Update
                await db.partners.update(partnerData.id, { name: partnerData.name, initialBalance: partnerData.initialBalance });
            } else { // Create
                const newPartner: Partner = { ...partnerData, id: Date.now().toString() };
                await db.partners.add(newPartner);
            }
            await fetchData();
            setIsAddModalOpen(false);
            setPartnerToEdit(null);
        } catch(error) {
            console.error("Failed to save partner:", error);
        }
    };

    const handleDeletePartner = async (partnerId: string) => {
        if (window.confirm('آیا از حذف این شریک و تمام تراکنش‌های مالی مرتبط با او مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
            try {
                await db.transaction('rw', db.partners, db.partnerTransactions, async () => {
                    await db.partners.delete(partnerId);
                    
                    const relatedTransactions = await db.partnerTransactions
                        .where('partnerId').equals(partnerId)
                        .or('relatedPartnerId').equals(partnerId)
                        .toArray();
                        
                    const txIdsToDelete = relatedTransactions.map(tx => tx.id);
                    if (txIdsToDelete.length > 0) {
                        await db.partnerTransactions.bulkDelete(txIdsToDelete);
                    }
                });
                await fetchData();
            } catch (error) {
                console.error("Failed to delete partner:", error);
                alert('خطا در حذف شریک.');
            }
        }
    };

    const handleOpenAddModal = (partner: Partner | null) => {
        setPartnerToEdit(partner);
        setIsAddModalOpen(true);
    };

    const handleOpenTxModal = (partner: Partner) => {
        setPartnerForTx(partner);
        setIsTxModalOpen(true);
    };
    
    const handleViewDetails = (partner: Partner) => {
        setSelectedPartner(partner);
        setView('details');
    };

    const handleBackToList = () => {
        setSelectedPartner(null);
        setView('list');
    };

    const handleTransactionSuccess = () => {
        fetchData(); 
        setIsTxModalOpen(false);
        setPartnerForTx(null);
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
            {view === 'list' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لیست شرکا</h1>
                        {hasPermission('page:partners:create') && (
                            <button
                                onClick={() => handleOpenAddModal(null)}
                                className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                            >
                                افزودن شریک جدید
                            </button>
                        )}
                    </div>
                    
                    <div className="mt-6">
                        <PartnerList 
                            partners={partners}
                            balances={partnerBalances}
                            onEdit={hasPermission('page:partners:edit') ? handleOpenAddModal : undefined}
                            onDelete={hasPermission('page:partners:delete') ? handleDeletePartner : undefined}
                            onTransaction={hasPermission('page:partners:transaction') ? handleOpenTxModal : undefined}
                            onViewDetails={handleViewDetails}
                        />
                    </div>

                    <AddPartnerModal
                        isOpen={isAddModalOpen}
                        onClose={() => { setIsAddModalOpen(false); setPartnerToEdit(null); }}
                        onSave={handleSavePartner}
                        partnerToEdit={partnerToEdit}
                    />

                    <PartnerTransactionModal
                        isOpen={isTxModalOpen}
                        onClose={() => { setIsTxModalOpen(false); setPartnerForTx(null); }}
                        onSuccess={handleTransactionSuccess}
                        partner={partnerForTx}
                        allPartners={partners}
                    />
                </>
            )}

            {view === 'details' && selectedPartner && (
                 <PartnerDetailsView
                    partner={selectedPartner}
                    transactions={transactions.filter(t => t.partnerId === selectedPartner.id).sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))}
                    onBack={handleBackToList}
                />
            )}
        </div>
    );
};

export default PartnersPage;
