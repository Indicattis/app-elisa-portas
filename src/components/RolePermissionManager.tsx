import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { UserRole, AppPermission, ROLE_LABELS } from '@/types/permissions';
import { ChevronRight } from 'lucide-react';

interface TabNode {
  id: string;
  key: string;
  label: string;
  permission: AppPermission | null;
  parent_key: string | null;
  children: TabNode[];
  active: boolean;
  tab_group: string;
  sort_order: number;
}

function buildTabTree(tabs: any[], tabGroup: string): TabNode[] {
  const filtered = tabs.filter((t: any) => t.tab_group === tabGroup);
  const nodes = new Map<string, TabNode>();
  
  // Create all nodes
  filtered.forEach((tab: any) => {
    nodes.set(tab.key, {
      ...tab,
      children: []
    });
  });
  
  // Build hierarchy
  const roots: TabNode[] = [];
  nodes.forEach(node => {
    if (node.parent_key) {
      const parent = nodes.get(node.parent_key);
      if (parent) {
        parent.children.push(node);
        parent.children.sort((a, b) => a.sort_order - b.sort_order);
      }
    } else {
      roots.push(node);
    }
  });
  
  return roots.sort((a, b) => a.sort_order - b.sort_order);
}

export function RolePermissionManager() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('atendente');
  const [selectedTabGroup, setSelectedTabGroup] = useState<'sidebar' | 'settings' | 'outros_paineis'>('sidebar');
  const queryClient = useQueryClient();

  // Fetch all active tabs
  const { data: tabs = [] } = useQuery({
    queryKey: ['app-tabs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_tabs')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch role permissions
  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', selectedRole);

      if (error) throw error;
      return data?.map(row => row.permission as AppPermission) || [];
    },
  });

  // Build tab tree
  const tabTree = useMemo(() => buildTabTree(tabs, selectedTabGroup), [tabs, selectedTabGroup]);

  // Mutation to update permissions
  const updatePermissions = useMutation({
    mutationFn: async ({ role, permissions }: { role: UserRole; permissions: AppPermission[] }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Remove all existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role);

      // Insert new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(
            permissions.map(permission => ({
              role,
              permission,
              created_by: user?.id
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['tabs-access'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('Permissões atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating permissions:', error);
      toast.error('Erro ao atualizar permissões');
    },
  });

  // Check if a tab is selected (with indeterminate support)
  const isTabSelected = (tab: TabNode): boolean | 'indeterminate' => {
    if (tab.permission && rolePermissions.includes(tab.permission)) {
      return true;
    }
    
    // For groups, check children
    if (tab.children.length > 0) {
      const childrenWithPermission = tab.children.filter(c => c.permission);
      if (childrenWithPermission.length === 0) return false;
      
      const selectedChildren = childrenWithPermission.filter(c => 
        c.permission && rolePermissions.includes(c.permission)
      );
      
      if (selectedChildren.length === 0) return false;
      if (selectedChildren.length === childrenWithPermission.length) return true;
      return 'indeterminate';
    }
    
    return false;
  };

  // Handle tab toggle (with hierarchy support)
  const handleTabToggle = (tab: TabNode, checked: boolean | 'indeterminate') => {
    let newPermissions = [...rolePermissions];
    
    // Collect all permissions from this tab and its children
    const collectPermissions = (node: TabNode): AppPermission[] => {
      const permissions: AppPermission[] = [];
      if (node.permission) permissions.push(node.permission);
      node.children.forEach(child => {
        permissions.push(...collectPermissions(child));
      });
      return permissions;
    };
    
    const affectedPermissions = collectPermissions(tab);
    
    if (checked === true) {
      // Add all permissions
      affectedPermissions.forEach(perm => {
        if (!newPermissions.includes(perm)) {
          newPermissions.push(perm);
        }
      });
    } else {
      // Remove all permissions
      newPermissions = newPermissions.filter(p => !affectedPermissions.includes(p));
    }

    updatePermissions.mutate({
      role: selectedRole,
      permissions: newPermissions
    });
  };

  // Render tab node recursively
  const renderTabNode = (node: TabNode, level = 0): JSX.Element => {
    const selected = isTabSelected(node);
    const isGroup = node.children.length > 0;
    
    // A node can be toggled if it has permission OR has children with permissions
    const hasAnyPermission = node.permission || node.children.some(c => {
      const checkRecursive = (n: TabNode): boolean => {
        if (n.permission) return true;
        return n.children.some(checkRecursive);
      };
      return checkRecursive(c);
    });
    
    return (
      <div key={node.key}>
        <div 
          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          style={{ marginLeft: level * 24 }}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => handleTabToggle(node, checked)}
            disabled={!hasAnyPermission || updatePermissions.isPending || isLoading}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isGroup && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <label className={`text-sm font-medium cursor-pointer ${isGroup ? 'text-foreground' : 'text-foreground/90'}`}>
                {node.label}
              </label>
              {!hasAnyPermission && (
                <span className="text-xs text-muted-foreground italic">
                  (sem permissão definida)
                </span>
              )}
            </div>
            {node.permission && (
              <p className="text-xs text-muted-foreground mt-1">
                Permissão: {node.permission}
              </p>
            )}
            {!node.permission && hasAnyPermission && isGroup && (
              <p className="text-xs text-muted-foreground mt-1">
                Grupo: controla {node.children.filter(c => c.permission).length} permissão(ões)
              </p>
            )}
          </div>
        </div>
        {node.children.map(child => renderTabNode(child, level + 1))}
      </div>
    );
  };

  const roles = Object.keys(ROLE_LABELS) as UserRole[];
  
  // Get all permissions from current tab tree
  const allCurrentPermissions = useMemo(() => {
    const collectAll = (nodes: TabNode[]): AppPermission[] => {
      const permissions: AppPermission[] = [];
      nodes.forEach(node => {
        if (node.permission) permissions.push(node.permission);
        permissions.push(...collectAll(node.children));
      });
      return permissions;
    };
    return collectAll(tabTree);
  }, [tabTree]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Permissões de Abas por Cargo</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Configure quais abas cada cargo pode acessar. Marcar um grupo concede acesso a todas as suas subabas.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Selecionar Cargo</label>
          <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Group Selector */}
        <Tabs value={selectedTabGroup} onValueChange={(v) => setSelectedTabGroup(v as 'sidebar' | 'settings' | 'outros_paineis')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sidebar">Abas da Sidebar</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="outros_paineis">Outros Painéis</TabsTrigger>
          </TabsList>

          <TabsContent value="sidebar" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 max-h-[500px] overflow-y-auto">
              {tabTree.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma aba encontrada para a sidebar
                </p>
              ) : (
                <div className="space-y-1">
                  {tabTree.map(node => renderTabNode(node))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 max-h-[500px] overflow-y-auto">
              {tabTree.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma aba encontrada para configurações
                </p>
              ) : (
                <div className="space-y-1">
                  {tabTree.map(node => renderTabNode(node))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="outros_paineis" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 max-h-[500px] overflow-y-auto">
              {tabTree.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma aba encontrada para outros painéis
                </p>
              ) : (
                <div className="space-y-1">
                  {tabTree.map(node => renderTabNode(node))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {rolePermissions.length} de {allCurrentPermissions.length} permissões concedidas
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                updatePermissions.mutate({
                  role: selectedRole,
                  permissions: rolePermissions.filter(p => !allCurrentPermissions.includes(p))
                });
              }}
              disabled={updatePermissions.isPending || !allCurrentPermissions.some(p => rolePermissions.includes(p))}
            >
              Remover Todas
            </Button>
            <Button
              onClick={() => {
                const newPermissions = [...new Set([...rolePermissions, ...allCurrentPermissions])];
                updatePermissions.mutate({
                  role: selectedRole,
                  permissions: newPermissions
                });
              }}
              disabled={updatePermissions.isPending || allCurrentPermissions.every(p => rolePermissions.includes(p))}
            >
              Conceder Todas
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}