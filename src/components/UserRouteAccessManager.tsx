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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

interface AppRoute {
  key: string;
  path: string;
  label: string;
  description: string | null;
  group: string | null;
  sort_order: number;
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
  const [searchTerm, setSearchTerm] = useState("");

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

  // Agrupar rotas por grupo
  const groupedRoutes = routes?.reduce((acc, route) => {
    const group = route.group || 'outros';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(route);
    return acc;
  }, {} as Record<string, AppRoute[]>);

  // Filtrar rotas pela busca
  const filteredRoutes = routes?.filter(route => 
    route.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users?.find(u => u.user_id === selectedUserId);
  const grantedCount = userAccess?.filter(a => a.can_access).length || 0;
  const totalCount = routes?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Acessos de Usuários</CardTitle>
        <CardDescription>
          Controle quais rotas cada usuário pode acessar no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
              {grantedCount} de {totalCount} rotas liberadas
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
                      <div className="font-medium">{route.label}</div>
                      <div className="text-xs text-muted-foreground">{route.path}</div>
                      {route.description && (
                        <div className="text-xs text-muted-foreground">{route.description}</div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <Tabs defaultValue={Object.keys(groupedRoutes || {})[0]} className="w-full">
                <TabsList className="w-full flex-wrap h-auto">
                  {Object.keys(groupedRoutes || {}).map((group) => (
                    <TabsTrigger key={group} value={group} className="capitalize">
                      {group}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(groupedRoutes || {}).map(([group, groupRoutes]) => (
                  <TabsContent key={group} value={group} className="space-y-2 mt-4">
                    {groupRoutes.map((route) => (
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
                          <div className="font-medium">{route.label}</div>
                          <div className="text-xs text-muted-foreground">{route.path}</div>
                          {route.description && (
                            <div className="text-xs text-muted-foreground">{route.description}</div>
                          )}
                        </label>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
