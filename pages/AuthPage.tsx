import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppLogo } from '../constants';

const AuthPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const { themeSettings, appSettings } = useTheme();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4" data-theme-color={themeSettings.color}>
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <AppLogo className="w-16 h-16 text-blue-600 data-[theme-color='red']:text-red-500 data-[theme-color='green']:text-green-500 data-[theme-color='purple']:text-purple-500 data-[theme-color='orange']:text-orange-500 transition-colors" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-custom shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
                        {isLoginView ? 'خوش آمدید' : 'ایجاد حساب کاربری'}
                    </h2>
                    <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">
                        {isLoginView ? 'برای ادامه وارد حساب خود شوید' : 'برای ساخت حساب جدید، فرم زیر را پر کنید'}
                    </p>
                    
                    {!appSettings.loginEnabled && (
                        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-r-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 rounded-custom mb-6 text-sm" role="alert">
                            <p><strong>توجه:</strong> ورود و ثبت‌نام برای کاربران عادی در حال حاضر غیرفعال است. فقط مدیر سیستم می‌تواند وارد شود.</p>
                        </div>
                    )}

                    {isLoginView ? <LoginForm /> : <RegisterForm />}

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLoginView(!isLoginView)}
                            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            {isLoginView ? 'حساب کاربری ندارید؟ ثبت نام کنید' : 'قبلا ثبت نام کرده‌اید؟ وارد شوید'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuthFormButton: React.FC<{ text: string; loading: boolean }> = ({ text, loading }) => {
    const { themeSettings } = useTheme();
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

    return (
        <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-custom shadow-sm text-sm font-medium text-white ${colorClasses[themeSettings.color]} focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? 'در حال پردازش...' : text}
        </button>
    );
};


const LoginForm: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <AuthInput id="login-username" label="نام کاربری" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            <AuthInput id="login-password" label="رمز عبور" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <AuthFormButton text="ورود" loading={loading} />
        </form>
    );
};

const RegisterForm: React.FC = () => {
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if(password.length < 6) {
            setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await register(username, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <AuthInput id="reg-username" label="نام کاربری" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            <AuthInput id="reg-password" label="رمز عبور" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <AuthFormButton text="ثبت نام" loading={loading} />
        </form>
    );
};


interface AuthInputProps {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const AuthInput: React.FC<AuthInputProps> = ({ id, label, type, value, onChange, required }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label}
        </label>
        <input
            id={id}
            name={type}
            type={type}
            required={required}
            value={value}
            onChange={onChange}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-custom shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
        />
    </div>
);


export default AuthPage;