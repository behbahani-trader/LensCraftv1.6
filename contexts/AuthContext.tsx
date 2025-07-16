import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, UserAuthData, Permission, Role } from '../types';
import { useTheme } from './ThemeContext';
import { metaDb } from '../db';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  createUser: (username: string, pass: string) => Promise<void>;
  deleteUser: (username: string) => Promise<void>;
  changeUserPassword: (username: string, pass: string) => Promise<void>;
  updateCurrentUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER = {
    username: 'mohammad',
    password: '318533'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { appSettings } = useTheme();
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const storedUserJson = sessionStorage.getItem('currentUser');
            const hasExplicitlyLoggedOut = sessionStorage.getItem('explicitLogout') === 'true';

            if (storedUserJson) {
                const storedUser = JSON.parse(storedUserJson);
                setCurrentUser(storedUser);
                if (hasExplicitlyLoggedOut) {
                    sessionStorage.removeItem('explicitLogout');
                }
            } else if (!appSettings.loginRequired && !hasExplicitlyLoggedOut) {
                setCurrentUser({ username: 'کاربر مهمان', permissions: [] });
            } else {
                setCurrentUser(null);
            }
        };
        checkUser();
    }, [appSettings.loginRequired]);

    const isAuthenticated = !!currentUser && currentUser.username !== 'کاربر مهمان';
    
    const updateCurrentUser = (updatedUser: Partial<User>) => {
        setCurrentUser(prev => {
            if (!prev) return null;
            const newUser = { ...prev, ...updatedUser };
            sessionStorage.setItem('currentUser', JSON.stringify(newUser));
            return newUser;
        });
    };

    const login = async (username: string, pass: string): Promise<void> => {
        const isDefaultUser = username === DEFAULT_USER.username && pass === DEFAULT_USER.password;

        if (!appSettings.loginEnabled && !isDefaultUser) {
            throw new Error('ورود برای کاربران عادی غیرفعال است.');
        }

        const userAuthData = await metaDb.users.get(username);

        if (isDefaultUser || (userAuthData && userAuthData.password === pass)) {
            let roleId = userAuthData?.roleId;

            if (isDefaultUser && !roleId) {
                roleId = 'admin';
                if(!userAuthData) {
                    await metaDb.users.add({ username, password: pass, roleId });
                } else if (!userAuthData.roleId) {
                    await metaDb.users.update(username, { roleId });
                }
            }
            
            let userPermissions: Permission[] = [];
            if(roleId) {
                const role = await metaDb.roles.get(roleId);
                if (role) {
                    userPermissions = role.permissions;
                }
            } else if (!isDefaultUser) {
                const noAccessRole = await metaDb.roles.get('no-access');
                roleId = noAccessRole?.id;
                userPermissions = noAccessRole?.permissions || [];
                await metaDb.users.update(username, { roleId });
            }
            
            // Customer ID is not set here. It will be set in Dashboard after a DB context is available.
            const user: User = { username, roleId, permissions: userPermissions };
            
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            sessionStorage.removeItem('explicitLogout');
        } else {
            throw new Error('نام کاربری یا رمز عبور اشتباه است.');
        }
    };
    
    const createUser = async (username: string, pass: string): Promise<void> => {
        if (!username.trim() || !pass.trim()) {
             throw new Error('نام کاربری و رمز عبور نمی‌توانند خالی باشند.');
        }
        if (username === 'کاربر مهمان' || username === 'mohammad') {
            throw new Error('این نام کاربری برای استفاده مجاز نمی باشد.');
        }
        const userExists = await metaDb.users.get(username);
        if (userExists) {
            throw new Error('این نام کاربری قبلا ثبت شده است.');
        }

        const noAccessRole = await metaDb.roles.get('no-access');
        const newUser: UserAuthData = { username, password: pass, roleId: noAccessRole?.id };
        await metaDb.users.add(newUser);
    };

    const register = async (username: string, pass: string): Promise<void> => {
        if (!appSettings.loginEnabled) {
            throw new Error('ثبت‌نام در حال حاضر غیرفعال است.');
        }
        await createUser(username, pass);
        await login(username, pass);
    };

    const deleteUser = async (username: string): Promise<void> => {
        if (username === 'mohammad') {
            throw new Error('نمی‌توان مدیر اصلی سیستم را حذف کرد.');
        }
        // Deleting customer link must be done from within a component with fiscal DB access
        // For now, we only delete the user from the meta DB.
        await metaDb.users.delete(username);
    };

    const changeUserPassword = async (username: string, pass: string): Promise<void> => {
        if(!pass || pass.length < 6) {
             throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد.');
        }
        await metaDb.users.update(username, { password: pass });
    };

    const logout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        sessionStorage.setItem('explicitLogout', 'true');
    };

    const hasPermission = (permission: Permission): boolean => {
        if (currentUser?.username === 'mohammad') return true;
        if (currentUser?.customerId) return false;
        return currentUser?.permissions?.includes(permission) ?? false;
    };


    const value = { isAuthenticated, currentUser, login, register, logout, hasPermission, createUser, deleteUser, changeUserPassword, updateCurrentUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};