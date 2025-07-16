import React, { useState, FormEvent } from 'react';
import { UserAuthData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: UserAuthData | null;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
    const { themeSettings } = useTheme();
    const { changeUserPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('رمزهای عبور با هم تطابق ندارند.');
            return;
        }
        if (password.length < 6) {
            setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
            return;
        }

        setLoading(true);
        try {
            await changeUserPassword(user.username, password);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-custom shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        تغییر رمز عبور برای: <span className="font-mono">{user.username}</span>
                    </h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <Input label="رمز عبور جدید" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <Input label="تکرار رمز عبور جدید" name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 flex justify-end gap-3 rounded-b-custom">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-custom hover:bg-slate-100 dark:hover:bg-slate-600" disabled={loading}>
                            لغو
                        </button>
                        <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-custom shadow-sm ${colorClasses[themeSettings.color]} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading}>
                            {loading ? 'در حال بروزرسانی...' : 'تغییر رمز'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        <input id={name} name={name} {...props} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" />
    </div>
);

export default ChangePasswordModal;