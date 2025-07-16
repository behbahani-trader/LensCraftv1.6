
import React, { useState, useEffect, useCallback } from 'react';
import { UserAuthData, Role } from '../types';
import { metaDb } from '../db';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import RoleFormModal from '../components/RoleFormModal';
import CreateUserModal from '../components/CreateUserModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

const TabButton: React.FC<{ name: string, active: boolean, onClick: () => void }> = ({ name, active, onClick }) => {
    const { themeSettings } = useTheme();
    const activeClasses = {
        blue: 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400',
        red: 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400',
        green: 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400',
        purple: 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400',
        orange: 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    };
    
    return (
        <button
            onClick={onClick}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                ${active
                    ? activeClasses[themeSettings.color]
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
        >
            {name}
        </button>
    );
};

const UserManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
    const { hasPermission } = useAuth();
    
    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    <TabButton name="کاربران" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <TabButton name="مدیریت نقش‌ها" active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} />
                </nav>
            </div>

            {activeTab === 'users' && (
                hasPermission('page:userManagement:view') 
                    ? <UsersManager /> 
                    : <AccessDenied message="شما اجازه مدیریت کاربران را ندارید." />
            )}
            {activeTab === 'roles' && (
                hasPermission('page:userManagement:manageRoles') 
                    ? <PermissionsManager /> 
                    : <AccessDenied message="شما اجازه مدیریت نقش‌ها و دسترسی‌ها را ندارید." />
            )}
        </div>
    );
};

const AccessDenied: React.FC<{message: string}> = ({ message }) => (
    <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/50 rounded-custom border border-yellow-300 dark:border-yellow-700">
        <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">دسترسی محدود</h3>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">{message}</p>
    </div>
);

const UsersManager: React.FC = () => {
    const { hasPermission, deleteUser } = useAuth();
    const { themeSettings } = useTheme();
    const [users, setUsers] = useState<UserAuthData[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserAuthData | null>(null);

    const fetchData = useCallback(async () => {
        const [usersData, rolesData] = await Promise.all([metaDb.users.toArray(), metaDb.roles.toArray()]);
        setUsers(usersData);
        setRoles(rolesData);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoleChange = async (username: string, newRoleId: string) => {
        await metaDb.users.update(username, { roleId: newRoleId });
        setUsers(users.map(u => u.username === username ? { ...u, roleId: newRoleId } : u));
    };

    const handleDeleteUser = async (username: string) => {
        if (window.confirm(`آیا از حذف کاربر "${username}" مطمئن هستید؟ این عمل غیرقابل بازگشت است.`)) {
            try {
                await deleteUser(username);
                fetchData();
            } catch (err: any) {
                alert(`خطا در حذف کاربر: ${err.message}`);
            }
        }
    };
    
    const handleOpenChangePass = (user: UserAuthData) => {
        setSelectedUser(user);
        setIsChangePassModalOpen(true);
    };

    const handleSuccess = () => {
        fetchData();
        setIsCreateModalOpen(false);
        setIsChangePassModalOpen(false);
        setSelectedUser(null);
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
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    لیست کاربران
                </h3>
                {hasPermission('page:userManagement:createUser') && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                    >
                        ایجاد کاربر جدید
                    </button>
                )}
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">نام کاربری</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">نقش</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {users.map(user => (
                                <tr key={user.username}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {hasPermission('page:userManagement:assignRoles') ? (
                                            <select
                                                value={user.roleId || ''}
                                                onChange={(e) => handleRoleChange(user.username, e.target.value)}
                                                disabled={user.username === 'mohammad'}
                                                className="appearance-none block w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-slate-900 dark:text-slate-100"
                                            >
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span>{roles.find(r => r.id === user.roleId)?.name || 'نامشخص'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-4 space-x-reverse">
                                        {hasPermission('page:userManagement:changePassword') && (
                                            <button onClick={() => handleOpenChangePass(user)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">تغییر رمز</button>
                                        )}
                                        {hasPermission('page:userManagement:deleteUser') && (
                                            <button onClick={() => handleDeleteUser(user.username)} disabled={user.username === 'mohammad'} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed">حذف</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleSuccess} />
            <ChangePasswordModal isOpen={isChangePassModalOpen} onClose={() => { setIsChangePassModalOpen(false); setSelectedUser(null); }} onSuccess={handleSuccess} user={selectedUser} />
        </div>
    );
};

const PermissionsManager: React.FC = () => {
    const { themeSettings } = useTheme();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

    const fetchRoles = useCallback(async () => setRoles(await metaDb.roles.toArray()), []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleSaveRole = async (roleData: Omit<Role, 'id'> & { id?: string }) => {
        try {
            if (roleData.id) { // Update
                await metaDb.roles.put({ ...roleData, id: roleData.id });
            } else { // Create
                const newRole = { ...roleData, id: Date.now().toString() };
                await metaDb.roles.add(newRole);
            }
            fetchRoles();
            setIsModalOpen(false);
            setRoleToEdit(null);
        } catch(error) {
            console.error("Failed to save role:", error);
        }
    };
    
    const handleDeleteRole = async (roleId: string) => {
        const userCount = await metaDb.users.where({ roleId }).count();
        if (userCount > 0) {
            alert(`نمی‌توان این نقش را حذف کرد زیرا ${userCount} کاربر به آن اختصاص داده شده‌اند.`);
            return;
        }
        if (window.confirm("آیا از حذف این نقش مطمئن هستید؟ این عمل غیرقابل بازگشت است.")) {
            await metaDb.roles.delete(roleId);
            fetchRoles();
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
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    لیست نقش‌ها
                </h3>
                <button
                    onClick={() => {
                        setRoleToEdit(null);
                        setIsModalOpen(true);
                    }}
                    className={`h-10 px-4 flex items-center flex-shrink-0 text-white font-semibold rounded-custom shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors ${colorClasses[themeSettings.color]}`}
                >
                    افزودن نقش جدید
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-custom border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">نام نقش</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">تعداد دسترسی‌ها</th>
                                <th className="relative px-6 py-3"><span className="sr-only">عملیات</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {roles.map(role => (
                                <tr key={role.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{role.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{role.permissions.length} دسترسی</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-4 space-x-reverse">
                                        <button onClick={() => { setRoleToEdit(role); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">ویرایش</button>
                                        <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={['admin', 'employee', 'no-access'].includes(role.id)}>حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <RoleFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveRole}
                roleToEdit={roleToEdit}
            />
        </div>
    );
};

export default UserManagementPage;
