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

interface DecorationPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  image_url: string | null;
  style: string | null;
}

const DecorationsManagement = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<DecorationPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: '',
    image_url: '',
    style: '',
  });

  const { data: packages, isLoading } = useQuery({
    queryKey: ['admin-decorations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decoration_packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DecorationPackage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<DecorationPackage, 'id'>) => {
      const { error } = await supabase.from('decoration_packages').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-decorations'] });
      queryClient.invalidateQueries({ queryKey: ['decoration_packages'] });
      toast.success('Decoration package created successfully');
      resetForm();
    },
    onError: (error) => toast.error('Failed to create package: ' + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: DecorationPackage) => {
      const { error } = await supabase.from('decoration_packages').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-decorations'] });
      queryClient.invalidateQueries({ queryKey: ['decoration_packages'] });
      toast.success('Decoration package updated successfully');
      resetForm();
    },
    onError: (error) => toast.error('Failed to update package: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('decoration_packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-decorations'] });
      queryClient.invalidateQueries({ queryKey: ['decoration_packages'] });
      toast.success('Decoration package deleted successfully');
    },
    onError: (error) => toast.error('Failed to delete package: ' + error.message),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', features: '', image_url: '', style: '' });
    setEditingPackage(null);
    setIsOpen(false);
  };

  const handleEdit = (pkg: DecorationPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: String(pkg.price),
      features: pkg.features?.join(', ') || '',
      image_url: pkg.image_url || '',
      style: pkg.style || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packageData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      features: formData.features ? formData.features.split(',').map(a => a.trim()) : null,
      image_url: formData.image_url || null,
      style: formData.style || null,
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
        <CardTitle>Manage Decoration Packages</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Package</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Add New Decoration Package'}</DialogTitle>
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
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="style">Style</Label>
                  <Input id="style" value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value })} placeholder="e.g., Modern, Classic" />
                </div>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea id="features" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} placeholder="Floral arrangements, LED lighting, Table settings" />
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
                  <TableHead>Style</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.style || '-'}</TableCell>
                    <TableCell>{formatPrice(pkg.price)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{pkg.features?.slice(0, 3).join(', ') || '-'}{pkg.features && pkg.features.length > 3 && '...'}</TableCell>
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
          <p className="text-center text-muted-foreground py-8">No decoration packages found. Add your first package!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DecorationsManagement;
