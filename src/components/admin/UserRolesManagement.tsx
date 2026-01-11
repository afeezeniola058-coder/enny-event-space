import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RefreshCw, Shield, UserPlus, Trash2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  user_id: string;
  role: AppRole;
  role_id: string;
  full_name: string | null;
  email: string | null;
}

const UserRolesManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');

  // Fetch all user roles with profile information
  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      // First get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role');

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) return [];

      // Get all unique user IDs
      const userIds = [...new Set(roles.map(r => r.user_id))];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine roles with profile information
      const usersWithRoles: UserWithRole[] = roles.map(role => ({
        user_id: role.user_id,
        role: role.role,
        role_id: role.id,
        full_name: profileMap.get(role.user_id)?.full_name || null,
        email: profileMap.get(role.user_id)?.email || null,
      }));

      return usersWithRoles;
    },
  });

  // Mutation to assign a new role
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Role assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  // Mutation to revoke a role
  const revokeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Role revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke role: ${error.message}`);
    },
  });

  // Filter users based on search term
  const filteredUsers = usersWithRoles?.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // Group users by role for statistics
  const roleStats: Partial<Record<AppRole, number>> = usersWithRoles?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Partial<Record<AppRole, number>>) || {};

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithRoles?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.admin || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderators</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.moderator || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.user || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
          <CardDescription>Assign or revoke roles for users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.role_id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Change Role */}
                          <Select
                            value={selectedRole}
                            onValueChange={(value: AppRole) => setSelectedRole(value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignRoleMutation.mutate({ userId: user.user_id, role: selectedRole })}
                            disabled={assignRoleMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>

                          {/* Revoke Role */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={revokeRoleMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke the "{user.role}" role from {user.full_name || user.email || 'this user'}? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => revokeRoleMutation.mutate(user.role_id)}
                                >
                                  Revoke Role
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {searchTerm ? 'No users found matching your search' : 'No users found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRolesManagement;
