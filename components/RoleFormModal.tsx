import React, { useState, useEffect, FormEvent } from 'react';
import { Role, Permission } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { ALL_PERMISSIONS } from '../constants';

interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: Omit<Role, 'id'> & { id?: string }) => void;
    roleToEdit: Role | null;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ isOpen, onClose, onSave, roleToEdit }) => {
    const { themeSettings } = useTheme();
    const [name, setName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (roleToEdit) {
                setName(roleToEdit.name);
                setSelectedPermissions(new Set(roleToEdit.permissions));
            } else {
                setName('');
                setSelectedPermissions(new Set());
            }
            setError('');
        }
    }, [isOpen, roleToEdit]);
    
    const handlePermissionChange = (permission: Permission, isChecked: boolean) => {
        const newPermissions = new Set(selectedPermissions);
        if (isChecked) {
            newPermissions.add(permission);
        } else {
            newPermissions.delete(permission);
        }
        setSelectedPermissions(newPermissions);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('نام نقش اجباری است.');
            return;
        }
        onSave({ id: roleToEdit?.id, name, permissions: Array.from(selectedPermissions) });
    };

    if (!isOpen) return null;

    const groupedPermissions = ALL_PERMISSIONS.reduce((acc, permission) => {
        (acc[permission.group] = acc[permission.group] || []).push(permission);
        return acc;
    }, {} as Record<string, typeof ALL_PERMISSIONS>);

    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };
    const themeColorClass = colorClasses[themeSettings.color];

    const modalTitle = roleToEdit ? `ویرایش نقش: ${roleToEdit.name}` : 'افزودن نقش جدید';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-3xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{modalTitle}</h2>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <div>
                            <label htmlFor="roleName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نام نقش</label>
                            <input
                                id="roleName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">دسترسی‌ها</h3>
                            <div className="space-y-4">
                                {Object.entries(groupedPermissions).map(([group, permissions]) => (
                                    <div key={group}>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 pb-1 mb-2">{group}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                                            {permissions.map(p => (
                                                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.has(p.id)}
                                                        onChange={e => handlePermissionChange(p.id, e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
                                                    />
                                                    <span className="text-slate-700 dark:text-slate-300">{p.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600">لغو</button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${themeColorClass}`}>ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleFormModal;