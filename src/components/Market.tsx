import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface MarketListing {
  id: number;
  user_character_id: number;
  seller_id: number;
  seller_nickname: string;
  price: number;
  character_name: string;
  rarity_name: string;
  rarity_color: string;
  damage: number;
}

interface MarketProps {
  userId: number;
  userBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

export default function Market({ userId, userBalance, onBalanceUpdate }: MarketProps) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/market/listings');
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      toast.error('Failed to load market listings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleBuy = async (listingId: number, price: number) => {
    if (userBalance < price) {
      toast.error('Insufficient UNC balance');
      return;
    }

    try {
      const response = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, buyer_id: userId })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Character purchased successfully!');
        onBalanceUpdate(data.new_balance);
        fetchListings();
      } else {
        toast.error(data.error || 'Purchase failed');
      }
    } catch (error) {
      toast.error('Failed to purchase character');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading market...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Character Market</h2>
          <p className="text-muted-foreground">Buy characters from other players</p>
        </div>
        <Button onClick={fetchListings} variant="outline">
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Icon name="ShoppingCart" size={64} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No listings available</h3>
            <p className="text-muted-foreground">Check back later for new characters!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{listing.character_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">by {listing.seller_nickname}</p>
                  </div>
                  <Badge style={{ backgroundColor: listing.rarity_color }}>
                    {listing.rarity_name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon name="Zap" size={16} className="text-orange-500" />
                  <span className="font-semibold">{listing.damage}</span>
                  <span className="text-sm text-muted-foreground">Damage</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <div className="flex items-center gap-1">
                      <Icon name="Coins" size={16} className="text-accent" />
                      <span className="font-bold text-lg">{listing.price}</span>
                      <span className="text-sm text-muted-foreground">UNC</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleBuy(listing.id, listing.price)}
                    disabled={listing.seller_id === userId || userBalance < listing.price}
                  >
                    {listing.seller_id === userId ? (
                      <>
                        <Icon name="User" size={16} className="mr-2" />
                        Your Listing
                      </>
                    ) : userBalance < listing.price ? (
                      <>
                        <Icon name="Lock" size={16} className="mr-2" />
                        Insufficient Funds
                      </>
                    ) : (
                      <>
                        <Icon name="ShoppingCart" size={16} className="mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
