import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Search, Shield, Users, Settings } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole, AppPermission, PERMISSION_LABELS, ROLE_LABELS } from '@/types/permissions';

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  role: UserRole;
  ativo: boolean;
}

interface PermissionManagerProps {
  users: AdminUser[];
}

export function PermissionManager({ users }: PermissionManagerProps) {
  const {
    userRoles,
    rolePermissions,
    loading,
    assignRoleToUser,
    removeRoleFromUser,
    updateRolePermission,
    getUserRoles,
    getRolePermissions
  } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRole = async () => {
    if (selectedUser && selectedRole) {
      await assignRoleToUser(selectedUser, selectedRole);
      setSelectedUser('');
      setSelectedRole('');
    }
  };

  const handleRemoveRole = async (userRoleId: string) => {
    await removeRoleFromUser(userRoleId);
  };

  const handlePermissionToggle = async (role: UserRole, permission: AppPermission, currentValue: boolean) => {
    await updateRolePermission(role, permission, !currentValue);
  };

  const allRoles: UserRole[] = ['administrador', 'gerente_comercial', 'gerente_fabril', 'atendente'];
  const allPermissions = Object.keys(PERMISSION_LABELS) as AppPermission[];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários e Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissões por Role
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Atribuir Roles aos Usuários
              </CardTitle>
              <CardDescription>
                Gerencie quais roles cada usuário possui no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="user-select">Usuário</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.nome} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="role-select">Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAssignRole} disabled={!selectedUser || !selectedRole}>
                    Atribuir Role
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles Atribuídas</CardTitle>
              <CardDescription>
                Lista de todas as roles atribuídas aos usuários
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => {
                      const userRolesList = getUserRoles(user.user_id);
                      const userRoleAssignments = userRoles.filter(ur => ur.user_id === user.user_id);
                      
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{user.nome}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userRolesList.map(role => (
                                <Badge key={role} variant="outline">
                                  {ROLE_LABELS[role]}
                                </Badge>
                              ))}
                              {userRolesList.length === 0 && (
                                <span className="text-muted-foreground text-sm">Nenhuma role atribuída</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {userRoleAssignments.map(assignment => (
                                <Button
                                  key={assignment.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveRole(assignment.id)}
                                >
                                  Remover {ROLE_LABELS[assignment.role]}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissões por Role
              </CardTitle>
              <CardDescription>
                Configure quais abas/funcionalidades cada role pode acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {allRoles.map(role => {
                  const permissions = getRolePermissions(role);
                  
                  return (
                    <div key={role} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        {ROLE_LABELS[role]}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allPermissions.map(permission => {
                          const hasPermission = permissions.includes(permission);
                          const permissionInfo = PERMISSION_LABELS[permission];
                          
                          return (
                            <div key={permission} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex-1">
                                <Label htmlFor={`${role}-${permission}`} className="font-medium">
                                  {permissionInfo.label}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  {permissionInfo.description}
                                </p>
                              </div>
                              <Switch
                                id={`${role}-${permission}`}
                                checked={hasPermission}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(role, permission, hasPermission)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}