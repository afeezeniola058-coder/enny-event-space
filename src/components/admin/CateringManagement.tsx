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

interface CateringPackage {
  id: string;
  name: string;
  description: string | null;
  price_per_person: number;
  menu_items: string[] | null;
  image_url: string | null;
  category: string | null;
}

const CateringManagement = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_person: '',
    menu_items: '',
    image_url: '',
    category: '',
  });

  const { data: packages, isLoading } = useQuery({
    queryKey: ['admin-catering'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catering_packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CateringPackage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<CateringPackage, 'id'>) => {
      const { error } = await supabase.from('catering_packages').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catering'] });
      queryClient.invalidateQueries({ queryKey: ['catering_packages'] });
      toast.success('Catering package created successfully');
      resetForm();
    },
    onError: (error) => toast.error('Failed to create package: ' + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: CateringPackage) => {
      const { error } = await supabase.from('catering_packages').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catering'] });
      queryClient.invalidateQueries({ queryKey: ['catering_packages'] });
      toast.success('Catering package updated successfully');
      resetForm();
    },
    onError: (error) => toast.error('Failed to update package: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catering_packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catering'] });
      queryClient.invalidateQueries({ queryKey: ['catering_packages'] });
      toast.success('Catering package deleted successfully');
    },
    onError: (error) => toast.error('Failed to delete package: ' + error.message),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price_per_person: '', menu_items: '', image_url: '', category: '' });
    setEditingPackage(null);
    setIsOpen(false);
  };

  const handleEdit = (pkg: CateringPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price_per_person: String(pkg.price_per_person),
      menu_items: pkg.menu_items?.join(', ') || '',
      image_url: pkg.image_url || '',
      category: pkg.category || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packageData = {
      name: formData.name,
      description: formData.description || null,
      price_per_person: parseFloat(formData.price_per_person),
      menu_items: formData.menu_items ? formData.menu_items.split(',').map(a => a.trim()) : null,
      image_url: formData.image_url || null,
      category: formData.category || null,
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, ...packageData });
    } else {
      createMutation.mutate(packageData);
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
        <CardTitle>Manage Catering Packages</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Package</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Add New Catering Package'}</DialogTitle>
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
                  <Label htmlFor="price">Price/Person (₦)</Label>
                  <Input id="price" type="number" value={formData.price_per_person} onChange={(e) => setFormData({ ...formData, price_per_person: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Nigerian, Continental" />
                </div>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor="menu">Menu Items (comma-separated)</Label>
                <Textarea id="menu" value={formData.menu_items} onChange={(e) => setFormData({ ...formData, menu_items: e.target.value })} placeholder="Jollof Rice, Fried Rice, Grilled Chicken" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPackage ? 'Update' : 'Create'}
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
        ) : packages && packages.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price/Person</TableHead>
                  <TableHead>Menu Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.category || '-'}</TableCell>
                    <TableCell>{formatPrice(pkg.price_per_person)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{pkg.menu_items?.slice(0, 3).join(', ') || '-'}{pkg.menu_items && pkg.menu_items.length > 3 && '...'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(pkg.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No catering packages found. Add your first package!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CateringManagement;
