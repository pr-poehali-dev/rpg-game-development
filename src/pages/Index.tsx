import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AuthScreen from '@/components/AuthScreen';
import MainGame from '@/components/MainGame';

interface User {
  user_id: number;
  nickname: string;
  unc_balance: number;
  is_admin: boolean;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('gacha_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('gacha_user', JSON.stringify(userData));
    toast.success(`Welcome, ${userData.nickname}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gacha_user');
    toast.info('Logged out');
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, unc_balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem('gacha_user', JSON.stringify(updatedUser));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-3xl font-bold animate-pulse">⚡ Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!user ? (
        <AuthScreen onLogin={handleLogin} />
      ) : (
        <MainGame user={user} onLogout={handleLogout} onBalanceUpdate={updateBalance} />
      )}
    </div>
  );
}