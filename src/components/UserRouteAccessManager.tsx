import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Search, ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";

interface AppRoute {
  key: string;
  path: string;
  label: string;
  description: string | null;
  group: string | null;
  sort_order: number;
  interface?: string;
  parent_key?: string | null;
}

interface RouteTreeNode extends AppRoute {
  children: RouteTreeNode[];
}

interface UserRouteAccess {
  id: string;
  user_id: string;
  route_key: string;
  can_access: boolean;
}

export function UserRouteAccessManager() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedInterface, setSelectedInterface] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState("");

  // Função para construir árvore de rotas
  const buildRouteTree = (routes: AppRoute[], parentKey: string | null): RouteTreeNode[] => {
    // Identificar quais parent_keys existem na lista de rotas
    const existingKeys = new Set(routes.map(r => r.key));
    
    return routes
      .filter(route => {
        // Se parent_key é null, incluir
        if (route.parent_key === parentKey) return true;
        
        // Se o parentKey procurado é null e o parent_key da rota não existe na lista, 
        // tratar como raiz (órfã)
        if (parentKey === null && route.parent_key && !existingKeys.has(route.parent_key)) {
          return true;
        }
        
        return false;
      })
      .map(route => ({
        ...route,
        children: buildRouteTree(routes, route.key)
      }))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  // Buscar todos os usuários ativos
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, nome, role, setor')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Buscar todas as rotas disponíveis
  const { data: routes } = useQuery({
    queryKey: ['app-routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_routes' as any)
        .select('*')
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as unknown as AppRoute[];
    },
    enabled: isAdmin,
  });

  // Buscar acessos do usuário selecionado
  const { data: userAccess, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['user-route-access', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      
      const { data, error } = await supabase
        .from('user_route_access' as any)
        .select('*')
        .eq('user_id', selectedUserId);
      
      if (error) throw error;
      return data as unknown as UserRouteAccess[];
    },
    enabled: !!selectedUserId && isAdmin,
  });

  // Mutation para atualizar acessos
  const updateAccessMutation = useMutation({
    mutationFn: async ({ userId, routeKey, canAccess }: { userId: string; routeKey: string; canAccess: boolean }) => {
      if (canAccess) {
        // Adicionar acesso
        const { error } = await supabase
          .from('user_route_access' as any)
          .upsert({ user_id: userId, route_key: routeKey, can_access: true });
        
        if (error) throw error;
      } else {
        // Remover acesso
        const { error } = await supabase
          .from('user_route_access' as any)
          .delete()
          .eq('user_id', userId)
          .eq('route_key', routeKey);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-route-access', selectedUserId] });
      toast.success('Permissão atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
    },
  });

  // Mutation para liberar todas as rotas
  const grantAllMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!routes) return;
      
      const accesses = routes.map(route => ({
        user_id: userId,
        route_key: route.key,
        can_access: true,
      }));

      const { error } = await supabase
        .from('user_route_access' as any)
        .upsert(accesses);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-route-access', selectedUserId] });
      toast.success('Todos os acessos liberados');
    },
    onError: () => {
      toast.error('Erro ao liberar acessos');
    },
  });

  // Mutation para remover todos os acessos
  const revokeAllMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_route_access' as any)
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-route-access', selectedUserId] });
      toast.success('Todos os acessos removidos');
    },
    onError: () => {
      toast.error('Erro ao remover acessos');
    },
  });

  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>
          Apenas administradores podem gerenciar permissões de acesso.
        </AlertDescription>
      </Alert>
    );
  }

  const hasAccess = (routeKey: string) => {
    return userAccess?.some(access => access.route_key === routeKey && access.can_access) || false;
  };

  const handleToggle = (routeKey: string, checked: boolean) => {
    if (!selectedUserId) return;
    
    updateAccessMutation.mutate({
      userId: selectedUserId,
      routeKey,
      canAccess: checked,
    });
  };

  // Função para alternar acesso de uma pasta e todos os filhos
  const handleToggleFolder = (node: RouteTreeNode, checked: boolean) => {
    if (!selectedUserId) return;
    
    const toggleRecursive = (n: RouteTreeNode) => {
      handleToggle(n.key, checked);
      n.children.forEach(child => toggleRecursive(child));
    };
    
    toggleRecursive(node);
  };

  // Verificar se uma pasta tem todos os filhos com acesso
  const hasFolderAccess = (node: RouteTreeNode): boolean => {
    const hasOwnAccess = hasAccess(node.key);
    const allChildrenHaveAccess = node.children.length > 0 
      ? node.children.every(child => hasFolderAccess(child))
      : true;
    return hasOwnAccess && allChildrenHaveAccess;
  };

  // Filtrar rotas pela interface
  const filteredRoutesByInterface = routes?.filter(route => route.interface === selectedInterface) || [];
  
  // Construir árvore de rotas
  const routeTree = buildRouteTree(filteredRoutesByInterface, null);

  // Filtrar rotas pela busca
  const filteredRoutes = routes?.filter(route => 
    route.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users?.find(u => u.user_id === selectedUserId);
  const grantedCount = userAccess?.filter(a => a.can_access).length || 0;
  const totalCount = routes?.length || 0;

  // Componente recursivo para renderizar item da árvore
  const RouteTreeItem = ({ node, level = 0 }: { node: RouteTreeNode; level?: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children.length > 0;
    const paddingLeft = level * 16;

    if (hasChildren) {
      const folderHasAccess = hasFolderAccess(node);
      
      return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
          <div 
            className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded group"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <CollapsibleTrigger className="flex items-center gap-1 p-0 hover:bg-transparent">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <Checkbox
              id={`folder-${node.key}`}
              checked={folderHasAccess}
              onCheckedChange={(checked) => handleToggleFolder(node, checked as boolean)}
            />
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            <label
              htmlFor={`folder-${node.key}`}
              className="flex-1 text-sm font-medium cursor-pointer"
            >
              {node.label}
            </label>
          </div>
          <CollapsibleContent className="space-y-1">
            {node.children.map(child => (
              <RouteTreeItem key={child.key} node={child} level={level + 1} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded"
        style={{ paddingLeft: `${paddingLeft + 20}px` }}
      >
        <Checkbox
          id={`route-${node.key}`}
          checked={hasAccess(node.key)}
          onCheckedChange={(checked) => handleToggle(node.key, checked as boolean)}
        />
        <label
          htmlFor={`route-${node.key}`}
          className="flex-1 text-sm cursor-pointer"
        >
          <div className="font-medium">{node.label}</div>
          <div className="text-xs text-muted-foreground">{node.path}</div>
          {node.description && (
            <div className="text-xs text-muted-foreground">{node.description}</div>
          )}
        </label>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Acessos de Usuários</CardTitle>
        <CardDescription>
          Controle quais rotas cada usuário pode acessar no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
      {/* Tabs de Interface */}
      <Tabs value={selectedInterface} onValueChange={setSelectedInterface}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="instalacoes">Instalações</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="paineis">Painéis</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        </Tabs>

        {/* Seleção de usuário */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione o usuário</label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um usuário..." />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.nome} - {user.role} ({user.setor})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserId && (
          <>
            {/* Busca e ações em massa */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar rotas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => revokeAllMutation.mutate(selectedUserId)}
                disabled={revokeAllMutation.isPending}
              >
                Remover Todos
              </Button>
              <Button
                onClick={() => grantAllMutation.mutate(selectedUserId)}
                disabled={grantAllMutation.isPending}
              >
                Liberar Todos
              </Button>
            </div>

            {/* Contador */}
            <div className="text-sm text-muted-foreground">
              {grantedCount} de {filteredRoutesByInterface.length} rotas liberadas nesta interface
            </div>

            {/* Lista de rotas */}
            {isLoadingAccess ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : searchTerm ? (
              <div className="space-y-2">
                {filteredRoutes?.map((route) => (
                  <div key={route.key} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`route-${route.key}`}
                      checked={hasAccess(route.key)}
                      onCheckedChange={(checked) => handleToggle(route.key, checked as boolean)}
                    />
                    <label
                      htmlFor={`route-${route.key}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <div className="font-medium">
                        {route.parent_key && '↳ '}
                        {route.label}
                        {route.interface && route.interface !== 'dashboard' && (
                          <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                            {route.interface}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{route.path}</div>
                      {route.description && (
                        <div className="text-xs text-muted-foreground">{route.description}</div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-1">
                  {routeTree.map(node => (
                    <RouteTreeItem key={node.key} node={node} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
