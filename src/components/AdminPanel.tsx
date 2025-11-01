import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface User {
  id: number;
  nickname: string;
  unc_balance: number;
  is_admin: boolean;
}

interface Character {
  id: number;
  name: string;
  rarity_name: string;
  damage: number;
  is_limited: boolean;
}

interface Rarity {
  id: number;
  name: string;
  color: string;
  drop_chance: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  
  const [newCharName, setNewCharName] = useState('');
  const [newCharDamage, setNewCharDamage] = useState(100);
  const [newCharRarity, setNewCharRarity] = useState('');
  const [newCharLimited, setNewCharLimited] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState('');
  const [uncAmount, setUncAmount] = useState(0);
  
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, charsRes, raritiesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/characters'),
        fetch('/api/admin/rarities')
      ]);

      const usersData = await usersRes.json();
      const charsData = await charsRes.json();
      const raritiesData = await raritiesRes.json();

      setUsers(usersData.users || []);
      setCharacters(charsData.characters || []);
      setRarities(raritiesData.rarities || []);
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCharacter = async () => {
    if (!newCharName || !newCharRarity) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/create-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCharName,
          rarity_id: parseInt(newCharRarity),
          damage: newCharDamage,
          is_limited: newCharLimited
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Character created successfully!');
        setNewCharName('');
        setNewCharDamage(100);
        setNewCharRarity('');
        setNewCharLimited(false);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create character');
      }
    } catch (error) {
      toast.error('Failed to create character');
      console.error(error);
    }
  };

  const handleDeleteCharacter = async (charId: number) => {
    if (!confirm('Are you sure you want to delete this character?')) return;

    try {
      const response = await fetch('/api/admin/delete-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: charId })
      });

      if (response.ok) {
        toast.success('Character deleted');
        fetchData();
      } else {
        toast.error('Failed to delete character');
      }
    } catch (error) {
      toast.error('Failed to delete character');
      console.error(error);
    }
  };

  const handleGiveUNC = async () => {
    if (!selectedUser || uncAmount <= 0) {
      toast.error('Please select user and amount');
      return;
    }

    try {
      const response = await fetch('/api/admin/give-unc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(selectedUser),
          amount: uncAmount
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Gave ${uncAmount} UNC to user`);
        setSelectedUser('');
        setUncAmount(0);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to give UNC');
      }
    } catch (error) {
      toast.error('Failed to give UNC');
      console.error(error);
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          is_admin: !currentStatus
        })
      });

      if (response.ok) {
        toast.success(`Admin status updated`);
        fetchData();
      } else {
        toast.error('Failed to update admin status');
      }
    } catch (error) {
      toast.error('Failed to update admin status');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="Shield" size={32} className="text-accent" />
        <div>
          <h2 className="text-3xl font-bold">Admin Panel</h2>
          <p className="text-muted-foreground">Manage game content and users</p>
        </div>
      </div>

      <Tabs defaultValue="characters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Character</CardTitle>
              <CardDescription>Add a new character to the gacha pool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Character Name</label>
                  <Input
                    placeholder="Enter character name"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rarity</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={newCharRarity}
                    onChange={(e) => setNewCharRarity(e.target.value)}
                  >
                    <option value="">Select rarity...</option>
                    {rarities.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Damage</label>
                  <Input
                    type="number"
                    min="1"
                    value={newCharDamage}
                    onChange={(e) => setNewCharDamage(parseInt(e.target.value) || 100)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newCharLimited}
                      onChange={(e) => setNewCharLimited(e.target.checked)}
                    />
                    Limited Edition
                  </label>
                </div>
              </div>

              <Button onClick={handleCreateCharacter} className="w-full">
                <Icon name="Plus" size={16} className="mr-2" />
                Create Character
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Characters ({characters.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Damage</TableHead>
                    <TableHead>Limited</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((char) => (
                    <TableRow key={char.id}>
                      <TableCell className="font-medium">{char.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{char.rarity_name}</Badge>
                      </TableCell>
                      <TableCell>{char.damage}</TableCell>
                      <TableCell>
                        {char.is_limited ? (
                          <Badge variant="destructive">Limited</Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCharacter(char.id)}
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management ({users.length} users)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nickname</TableHead>
                    <TableHead>UNC Balance</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-medium">{user.nickname}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Icon name="Coins" size={14} className="text-accent" />
                          {user.unc_balance}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Give UNC to User</CardTitle>
              <CardDescription>Grant currency to players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Choose a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nickname} (Current: {u.unc_balance} UNC)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  min="1"
                  value={uncAmount}
                  onChange={(e) => setUncAmount(parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </div>

              <Button onClick={handleGiveUNC} className="w-full">
                <Icon name="Gift" size={16} className="mr-2" />
                Give UNC
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
