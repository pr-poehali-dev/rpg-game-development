import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface TradeOffer {
  id: number;
  sender_id: number;
  sender_nickname: string;
  receiver_id: number;
  receiver_nickname: string;
  sender_unc: number;
  receiver_unc: number;
  sender_characters: Array<{ id: number; name: string; rarity_name: string; rarity_color: string }>;
  receiver_characters: Array<{ id: number; name: string; rarity_name: string; rarity_color: string }>;
  status: string;
  created_at: string;
}

interface User {
  id: number;
  nickname: string;
}

interface TradeProps {
  userId: number;
  userBalance: number;
}

export default function Trade({ userId, userBalance }: TradeProps) {
  const [incomingOffers, setIncomingOffers] = useState<TradeOffer[]>([]);
  const [outgoingOffers, setOutgoingOffers] = useState<TradeOffer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [offerUNC, setOfferUNC] = useState(0);
  const [requestUNC, setRequestUNC] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trade/offers?user_id=${userId}`);
      const data = await response.json();
      setIncomingOffers(data.incoming || []);
      setOutgoingOffers(data.outgoing || []);
    } catch (error) {
      toast.error('Failed to load trade offers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/trade/users');
      const data = await response.json();
      setUsers(data.users?.filter((u: User) => u.id !== userId) || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchUsers();
  }, [userId]);

  const handleCreateOffer = async () => {
    if (!selectedUser) {
      toast.error('Please select a player');
      return;
    }

    if (offerUNC > userBalance) {
      toast.error('Insufficient UNC balance');
      return;
    }

    try {
      const response = await fetch('/api/trade/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: parseInt(selectedUser),
          sender_unc: offerUNC,
          receiver_unc: requestUNC
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Trade offer sent!');
        setSelectedUser('');
        setOfferUNC(0);
        setRequestUNC(0);
        fetchOffers();
      } else {
        toast.error(data.error || 'Failed to create offer');
      }
    } catch (error) {
      toast.error('Failed to send trade offer');
      console.error(error);
    }
  };

  const handleAcceptOffer = async (offerId: number) => {
    try {
      const response = await fetch('/api/trade/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, user_id: userId })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Trade completed!');
        fetchOffers();
      } else {
        toast.error(data.error || 'Failed to accept offer');
      }
    } catch (error) {
      toast.error('Failed to accept trade');
      console.error(error);
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      const response = await fetch('/api/trade/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId })
      });

      if (response.ok) {
        toast.success('Trade offer rejected');
        fetchOffers();
      } else {
        toast.error('Failed to reject offer');
      }
    } catch (error) {
      toast.error('Failed to reject trade');
      console.error(error);
    }
  };

  const renderTradeOffer = (offer: TradeOffer, isIncoming: boolean) => {
    const otherPlayer = isIncoming ? offer.sender_nickname : offer.receiver_nickname;
    const offerUNC = isIncoming ? offer.sender_unc : offer.receiver_unc;
    const requestUNC = isIncoming ? offer.receiver_unc : offer.sender_unc;

    return (
      <Card key={offer.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{otherPlayer}</CardTitle>
              <CardDescription>
                {new Date(offer.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={offer.status === 'pending' ? 'default' : 'secondary'}>
              {offer.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                {isIncoming ? 'They offer:' : 'You offer:'}
              </p>
              {offerUNC > 0 && (
                <div className="flex items-center gap-2">
                  <Icon name="Coins" size={16} className="text-accent" />
                  <span className="font-semibold">{offerUNC} UNC</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                {isIncoming ? 'They request:' : 'You request:'}
              </p>
              {requestUNC > 0 && (
                <div className="flex items-center gap-2">
                  <Icon name="Coins" size={16} className="text-accent" />
                  <span className="font-semibold">{requestUNC} UNC</span>
                </div>
              )}
            </div>
          </div>

          {offer.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              {isIncoming ? (
                <>
                  <Button 
                    className="flex-1" 
                    onClick={() => handleAcceptOffer(offer.id)}
                  >
                    <Icon name="Check" size={16} className="mr-2" />
                    Accept
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleRejectOffer(offer.id)}
                  >
                    <Icon name="X" size={16} className="mr-2" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleRejectOffer(offer.id)}
                >
                  <Icon name="X" size={16} className="mr-2" />
                  Cancel Offer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Trade Center</h2>
        <p className="text-muted-foreground">Exchange UNC and characters with other players</p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Offer</TabsTrigger>
          <TabsTrigger value="incoming">
            Incoming ({incomingOffers.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing ({outgoingOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Trade Offer</CardTitle>
              <CardDescription>Send a trade proposal to another player</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Player</label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Choose a player...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.nickname}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">You Offer (UNC)</label>
                  <Input 
                    type="number"
                    min="0"
                    max={userBalance}
                    value={offerUNC}
                    onChange={(e) => setOfferUNC(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">You Request (UNC)</label>
                  <Input 
                    type="number"
                    min="0"
                    value={requestUNC}
                    onChange={(e) => setRequestUNC(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                  />
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={handleCreateOffer}
                disabled={!selectedUser || (offerUNC === 0 && requestUNC === 0)}
              >
                <Icon name="Send" size={16} className="mr-2" />
                Send Trade Offer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming" className="space-y-4">
          {incomingOffers.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Icon name="Inbox" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No incoming offers</h3>
                <p className="text-muted-foreground">You'll see trade proposals from other players here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {incomingOffers.map(offer => renderTradeOffer(offer, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4">
          {outgoingOffers.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Icon name="Send" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No outgoing offers</h3>
                <p className="text-muted-foreground">Create a trade offer to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {outgoingOffers.map(offer => renderTradeOffer(offer, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
