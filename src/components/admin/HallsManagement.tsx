import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';

interface Hall {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  price_per_hour: number;
  image_url: string | null;
  amenities: string[] | null;
}

const HallsManagement = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    price_per_hour: '',
    image_url: '',
    amenities: '',
  });

  const { data: halls, isLoading } = useQuery({
    queryKey: ['admin-halls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('halls')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Hall[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Hall, 'id'>) => {
      const { error } = await supabase.from('halls').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-halls'] });
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      toast.success('Hall created successfully');
      resetForm();
    },
    onError: (error) => toast.error('Failed to create hall: ' + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Hall) => {
      const { error } = await supabase.from('halls').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-halls'] });
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      toast.success('Hall updated successfully');
      resetForm();
    },
    onError: (error) => toast.error('Failed to update hall: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('halls').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-halls'] });
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      toast.success('Hall deleted successfully');
    },
    onError: (error) => toast.error('Failed to delete hall: ' + error.message),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', capacity: '', price_per_hour: '', image_url: '', amenities: '' });
    setEditingHall(null);
    setIsOpen(false);
  };

  const handleEdit = (hall: Hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      description: hall.description || '',
      capacity: String(hall.capacity),
      price_per_hour: String(hall.price_per_hour),
      image_url: hall.image_url || '',
      amenities: hall.amenities?.join(', ') || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hallData = {
      name: formData.name,
      description: formData.description || null,
      capacity: parseInt(formData.capacity),
      price_per_hour: parseFloat(formData.price_per_hour),
      image_url: formData.image_url || null,
      amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : null,
    };

    if (editingHall) {
      updateMutation.mutate({ id: editingHall.id, ...hallData });
    } else {
      createMutation.mutate(hallData);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Halls</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Hall</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingHall ? 'Edit Hall' : 'Add New Hall'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="price">Price/Hour (₦)</Label>
                  <Input id="price" type="number" value={formData.price_per_hour} onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input id="amenities" value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} placeholder="WiFi, Parking, AC" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {editingHall ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : halls && halls.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price/Hour</TableHead>
                  <TableHead>Amenities</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {halls.map((hall) => (
                  <TableRow key={hall.id}>
                    <TableCell className="font-medium">{hall.name}</TableCell>
                    <TableCell>{hall.capacity} guests</TableCell>
                    <TableCell>{formatPrice(hall.price_per_hour)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{hall.amenities?.join(', ') || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(hall)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(hall.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No halls found. Add your first hall!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default HallsManagement;
