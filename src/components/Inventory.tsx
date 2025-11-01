import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

interface InventoryProps {
  userId: number;
}

interface Character {
  id: number;
  name: string;
  damage: number;
  rarity: string;
  rarity_color: string;
  acquired_at: string;
}

export default function Inventory({ userId }: InventoryProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setCharacters([]);
      } catch (error) {
        toast.error('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin text-4xl mb-4">⚡</div>
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-20">
        <Icon name="Package" size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Empty Inventory</h2>
        <p className="text-muted-foreground mb-4">You haven't collected any characters yet</p>
        <p className="text-sm text-muted-foreground">Go to Spin section to get your first character!</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Collection</h2>
        <div className="text-sm text-muted-foreground">
          {characters.length} character{characters.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char) => (
          <Card 
            key={char.id}
            className="border-2 transition-all hover:scale-105 hover:shadow-xl"
            style={{ borderColor: `${char.rarity_color}40` }}
          >
            <CardContent className="p-4 space-y-3">
              <div 
                className="w-full h-40 rounded-lg flex items-center justify-center text-6xl border-2"
                style={{ 
                  borderColor: char.rarity_color,
                  boxShadow: `0 0 20px ${char.rarity_color}20`
                }}
              >
                🎴
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: char.rarity_color }}>
                  {char.rarity.toUpperCase()}
                </p>
                <h3 className="text-lg font-bold mb-1">{char.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Sword" size={16} />
                  <span>{char.damage} DMG</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
