import React from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './Dashboard';

function App() {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Dashboard /> : <AuthPage />;
}

export default App;