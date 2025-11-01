import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import GachaSpin from '@/components/GachaSpin';
import Inventory from '@/components/Inventory';
import Market from '@/components/Market';
import Trade from '@/components/Trade';
import Battle from '@/components/Battle';
import AdminPanel from '@/components/AdminPanel';

interface User {
  user_id: number;
  nickname: string;
  unc_balance: number;
  is_admin: boolean;
}

interface MainGameProps {
  user: User;
  onLogout: () => void;
  onBalanceUpdate: (newBalance: number) => void;
}

type Section = 'gacha' | 'inventory' | 'market' | 'trade' | 'battle' | 'admin';

export default function MainGame({ user, onLogout, onBalanceUpdate }: MainGameProps) {
  const [activeSection, setActiveSection] = useState<Section>('gacha');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RNG GACHA
            </h1>
            {user.is_admin && (
              <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded">
                ADMIN
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="flex items-center gap-2 py-2 px-4">
                <Icon name="Coins" size={20} className="text-accent" />
                <span className="font-bold text-lg">{user.unc_balance}</span>
                <span className="text-sm text-muted-foreground">UNC</span>
              </CardContent>
            </Card>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.nickname}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <Icon name="LogOut" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-2">
            <Button
              variant={activeSection === 'gacha' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('gacha')}
              className="gap-2"
            >
              <Icon name="Sparkles" size={18} />
              Spin
            </Button>
            <Button
              variant={activeSection === 'inventory' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('inventory')}
              className="gap-2"
            >
              <Icon name="Package" size={18} />
              Inventory
            </Button>
            <Button
              variant={activeSection === 'market' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('market')}
              className="gap-2"
            >
              <Icon name="ShoppingCart" size={18} />
              Market
            </Button>
            <Button
              variant={activeSection === 'trade' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('trade')}
              className="gap-2"
            >
              <Icon name="ArrowLeftRight" size={18} />
              Trade
            </Button>
            <Button
              variant={activeSection === 'battle' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('battle')}
              className="gap-2"
            >
              <Icon name="Swords" size={18} />
              Battle
            </Button>
            {user.is_admin && (
              <Button
                variant={activeSection === 'admin' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('admin')}
                className="gap-2 bg-accent/20"
              >
                <Icon name="Settings" size={18} />
                Admin
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeSection === 'gacha' && <GachaSpin userId={user.user_id} />}
        {activeSection === 'inventory' && <Inventory userId={user.user_id} />}
        {activeSection === 'market' && (
          <Market 
            userId={user.user_id} 
            userBalance={user.unc_balance}
            onBalanceUpdate={onBalanceUpdate}
          />
        )}
        {activeSection === 'trade' && (
          <Trade 
            userId={user.user_id}
            userBalance={user.unc_balance}
          />
        )}
        {activeSection === 'battle' && (
          <Battle 
            userId={user.user_id}
            onBalanceUpdate={onBalanceUpdate}
          />
        )}
        {activeSection === 'admin' && user.is_admin && <AdminPanel />}
      </main>
    </div>
  );
}