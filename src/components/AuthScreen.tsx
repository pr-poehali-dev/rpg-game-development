import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

interface AuthScreenProps {
  onLogin: (user: { user_id: number; nickname: string; unc_balance: number; is_admin: boolean }) => void;
}

const AUTH_URL = 'https://functions.poehali.dev/4892bef8-dd3a-4a26-ace5-a8d08dc73796';

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (action: 'login' | 'register') => {
    if (!nickname || !password) {
      toast.error('Please fill all fields');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      toast.error('Nickname: English letters, numbers, and underscore only');
      return;
    }

    if (password.length < 6 || password.length > 20) {
      toast.error('Password: 6-20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      toast.error('Password: English letters and numbers only');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, nickname, password })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Authentication failed');
        return;
      }

      onLogin(data);
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
            RNG GACHA
          </h1>
          <p className="text-muted-foreground">Enter the premium collection game</p>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Sparkles" size={24} className="text-accent" />
              Welcome
            </CardTitle>
            <CardDescription>Login or create new account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nickname</label>
                  <Input
                    placeholder="Universe"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth('login')}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleAuth('login')}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Login'}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nickname</label>
                  <Input
                    placeholder="YourNickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">English letters, numbers, underscore</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth('register')}
                  />
                  <p className="text-xs text-muted-foreground">6-20 characters, English letters and numbers</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleAuth('register')}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
