import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

const GACHA_URL = 'https://functions.poehali.dev/bac86030-2e90-4d21-845d-4dcc0153bc1b';

interface GachaSpinProps {
  userId: number;
}

interface CooldownStatus {
  can_spin: boolean;
  free_spins: number;
  seconds_until_ready: number;
}

interface Character {
  user_character_id: number;
  character_id: number;
  name: string;
  damage: number;
  image_url: string | null;
  rarity: string;
  rarity_color: string;
}

export default function GachaSpin({ userId }: GachaSpinProps) {
  const [cooldown, setCooldown] = useState<CooldownStatus | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [lastPull, setLastPull] = useState<Character | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchCooldown = async () => {
    try {
      const response = await fetch(GACHA_URL, {
        method: 'GET',
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setCooldown(data);
      setTimeLeft(data.seconds_until_ready);
    } catch (error) {
      toast.error('Failed to fetch cooldown');
    }
  };

  useEffect(() => {
    fetchCooldown();
  }, [userId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && cooldown && !cooldown.can_spin) {
      fetchCooldown();
    }
  }, [timeLeft]);

  const handleSpin = async () => {
    setSpinning(true);
    setShowResult(false);
    
    try {
      const response = await fetch(GACHA_URL, {
        method: 'POST',
        headers: { 'X-User-Id': userId.toString() }
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Spin failed');
        return;
      }

      setTimeout(() => {
        setLastPull(data);
        setShowResult(true);
        setSpinning(false);
        fetchCooldown();
        
        const rarityMessages: Record<string, string> = {
          'Mythic': '🔥 MYTHIC! INCREDIBLE!',
          'Legendary': '⭐ Legendary pull!',
          'Epic': '💜 Epic character!',
          'Rare': '💙 Rare find!',
          'Common': '✨ New character!'
        };
        
        toast.success(rarityMessages[data.rarity] || 'Character obtained!');
      }, 2000);
    } catch (error) {
      toast.error('Network error');
      setSpinning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canSpin = cooldown?.can_spin || cooldown?.free_spins > 0;
  const progressValue = cooldown ? ((600 - timeLeft) / 600) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Character Summon
        </h2>
        <p className="text-muted-foreground">Test your luck and collect powerful characters</p>
      </div>

      <Card className="border-2 border-primary/20 shadow-xl">
        <CardContent className="p-8 space-y-6">
          {spinning ? (
            <div className="text-center py-20 space-y-4">
              <div className="text-6xl animate-spin">✨</div>
              <p className="text-2xl font-bold text-primary animate-pulse">Summoning...</p>
            </div>
          ) : showResult && lastPull ? (
            <div className="text-center py-8 space-y-4 animate-scale-in">
              <div 
                className="mx-auto w-48 h-48 rounded-2xl flex items-center justify-center text-8xl border-4 shadow-2xl"
                style={{ 
                  borderColor: lastPull.rarity_color,
                  boxShadow: `0 0 40px ${lastPull.rarity_color}40`
                }}
              >
                {lastPull.image_url ? (
                  <img src={lastPull.image_url} alt={lastPull.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  '🎴'
                )}
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: lastPull.rarity_color }}>
                  {lastPull.rarity.toUpperCase()}
                </p>
                <h3 className="text-3xl font-bold mb-2">{lastPull.name}</h3>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Icon name="Sword" size={20} />
                  <span className="text-xl font-semibold">{lastPull.damage} DMG</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="text-8xl mb-4">🎴</div>
              <p className="text-xl text-muted-foreground">Ready to summon?</p>
            </div>
          )}

          <div className="space-y-4">
            {!canSpin && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cooldown</span>
                  <span className="font-bold">{formatTime(timeLeft)}</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            )}

            {cooldown && cooldown.free_spins > 0 && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-center">
                <p className="text-sm font-bold text-accent">
                  🎁 {cooldown.free_spins} Free Spin{cooldown.free_spins > 1 ? 's' : ''} Available!
                </p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full text-lg font-bold py-6"
              onClick={handleSpin}
              disabled={!canSpin || spinning}
            >
              {spinning ? (
                'Spinning...'
              ) : !canSpin ? (
                <>
                  <Icon name="Clock" size={20} className="mr-2" />
                  Cooldown: {formatTime(timeLeft)}
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={20} className="mr-2" />
                  Summon Character
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardContent className="p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Icon name="Info" size={18} />
            Drop Rates
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }}></span>
                Mythic
              </span>
              <span className="font-mono">1%</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></span>
                Legendary
              </span>
              <span className="font-mono">4%</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#A855F7' }}></span>
                Epic
              </span>
              <span className="font-mono">10%</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }}></span>
                Rare
              </span>
              <span className="font-mono">25%</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9CA3AF' }}></span>
                Common
              </span>
              <span className="font-mono">60%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
