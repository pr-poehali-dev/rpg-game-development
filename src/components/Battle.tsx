import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Character {
  id: number;
  character_id: number;
  name: string;
  damage: number;
  rarity_name: string;
  rarity_color: string;
}

interface BattleResult {
  winner: string;
  winner_character: string;
  loser_character: string;
  winner_damage: number;
  loser_damage: number;
  reward: number;
}

interface BattleProps {
  userId: number;
  onBalanceUpdate: (newBalance: number) => void;
}

export default function Battle({ userId, onBalanceUpdate }: BattleProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [opponent, setOpponent] = useState<Character | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [battling, setBattling] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/characters?user_id=${userId}`);
      const data = await response.json();
      setCharacters(data.characters || []);
    } catch (error) {
      toast.error('Failed to load characters');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [userId]);

  const findOpponent = async () => {
    if (!selectedCharacter) {
      toast.error('Please select a character first');
      return;
    }

    try {
      const response = await fetch(`/api/battle/find-opponent?user_id=${userId}&character_id=${selectedCharacter.id}`);
      const data = await response.json();
      
      if (response.ok && data.opponent) {
        setOpponent(data.opponent);
        setBattleResult(null);
        toast.success('Opponent found!');
      } else {
        toast.error('No opponent available');
      }
    } catch (error) {
      toast.error('Failed to find opponent');
      console.error(error);
    }
  };

  const startBattle = async () => {
    if (!selectedCharacter || !opponent) return;

    setBattling(true);
    setBattleResult(null);

    try {
      const response = await fetch('/api/battle/fight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_character_id: selectedCharacter.id,
          opponent_character_id: opponent.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setBattleResult(data.result);
        if (data.new_balance !== undefined) {
          onBalanceUpdate(data.new_balance);
        }
      } else {
        toast.error(data.error || 'Battle failed');
      }
    } catch (error) {
      toast.error('Failed to complete battle');
      console.error(error);
    } finally {
      setBattling(false);
    }
  };

  const resetBattle = () => {
    setOpponent(null);
    setBattleResult(null);
    setSelectedCharacter(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading battle arena...</p>
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <Icon name="Swords" size={64} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Characters Available</h3>
          <p className="text-muted-foreground">Spin the gacha to get characters for battle!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Battle Arena</h2>
        <p className="text-muted-foreground">Fight with your characters and earn rewards</p>
      </div>

      {!selectedCharacter ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Select Your Fighter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <Card 
                key={char.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
                onClick={() => setSelectedCharacter(char)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{char.name}</CardTitle>
                    <Badge style={{ backgroundColor: char.rarity_color }}>
                      {char.rarity_name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Icon name="Zap" size={20} className="text-orange-500" />
                    <span className="font-bold text-xl">{char.damage}</span>
                    <span className="text-sm text-muted-foreground">Damage</span>
                  </div>
                  <Button className="w-full mt-4">
                    <Icon name="Swords" size={16} className="mr-2" />
                    Select Fighter
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-center">Your Fighter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{selectedCharacter.name}</h3>
                  <Badge style={{ backgroundColor: selectedCharacter.rarity_color }}>
                    {selectedCharacter.rarity_name}
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Icon name="Zap" size={24} className="text-orange-500" />
                  <span className="font-bold text-3xl">{selectedCharacter.damage}</span>
                </div>
                <Progress value={100} className="h-3" />
              </CardContent>
            </Card>

            <Card className="flex items-center justify-center">
              <CardContent className="py-8">
                {battling ? (
                  <div className="text-center">
                    <Icon name="Swords" size={64} className="mx-auto mb-4 text-primary animate-pulse" />
                    <p className="font-semibold text-lg">Fighting...</p>
                  </div>
                ) : battleResult ? (
                  <div className="text-center">
                    {battleResult.winner === 'user' ? (
                      <>
                        <Icon name="Trophy" size={64} className="mx-auto mb-4 text-yellow-500" />
                        <p className="font-bold text-2xl text-green-600">Victory!</p>
                        <p className="text-muted-foreground mt-2">+{battleResult.reward} UNC</p>
                      </>
                    ) : (
                      <>
                        <Icon name="X" size={64} className="mx-auto mb-4 text-red-500" />
                        <p className="font-bold text-2xl text-red-600">Defeat</p>
                        <p className="text-muted-foreground mt-2">Better luck next time</p>
                      </>
                    )}
                  </div>
                ) : opponent ? (
                  <div className="text-center">
                    <Icon name="Swords" size={64} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="font-semibold text-lg">Ready to fight!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Icon name="Search" size={64} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="font-semibold text-lg">Find an opponent</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {opponent ? (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-center">Opponent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">{opponent.name}</h3>
                    <Badge style={{ backgroundColor: opponent.rarity_color }}>
                      {opponent.rarity_name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="Zap" size={24} className="text-orange-500" />
                    <span className="font-bold text-3xl">{opponent.damage}</span>
                  </div>
                  <Progress value={100} className="h-3" />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-20 text-center">
                  <Icon name="HelpCircle" size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Waiting for opponent...</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!opponent && !battleResult && (
              <Button size="lg" onClick={findOpponent}>
                <Icon name="Search" size={20} className="mr-2" />
                Find Opponent
              </Button>
            )}
            
            {opponent && !battleResult && !battling && (
              <Button size="lg" onClick={startBattle}>
                <Icon name="Swords" size={20} className="mr-2" />
                Start Battle
              </Button>
            )}

            {battleResult && (
              <Button size="lg" onClick={resetBattle}>
                <Icon name="RefreshCw" size={20} className="mr-2" />
                New Battle
              </Button>
            )}

            <Button size="lg" variant="outline" onClick={resetBattle}>
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Back to Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
