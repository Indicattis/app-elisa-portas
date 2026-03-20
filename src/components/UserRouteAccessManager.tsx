import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Loader2, Search, ChevronRight, ChevronDown, Folder, FolderOpen, 
  Home, Globe, Shield, Users, Minus, Plus, User, Settings, PanelLeft, Factory
} from "lucide-react";

// Rotas do Menu Flutuante - aparecem em todas as interfaces
const FLOATING_MENU_ROUTES = ['admin', 'paineis', 'producao_hub'];
const floatingMenuConfig: Record<string, { label: string; icon: any; color: string }> = {
  'admin': { label: 'Admin', icon: Settings, color: 'blue' },
  'paineis': { label: 'Painéis', icon: PanelLeft, color: 'purple' },
  'producao_hub': { label: 'Produção', icon: Factory, color: 'emerald' },
};

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

// Estilo minimalista consistente
const sectionWrapperClass = "p-1.5 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-900/10 backdrop-blur-xl border border-blue-500/20";
const labelClass = "text-xs font-semibold text-blue-300/80 uppercase tracking-wider";
const inputClass = "h-10 bg-blue-500/5 border-blue-500/20 text-white placeholder:text-blue-200/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30";

// Interfaces disponíveis
const interfaces = [
  { value: 'padrao', label: 'Padrão', icon: Home },
  { value: 'producao', label: 'Produção', icon: Users },
  { value: 'paineis', label: 'Painéis', icon: Users },
  { value: 'admin', label: 'Admin', icon: Shield },
];

export function UserRouteAccessManager() {
  const { } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedInterface, setSelectedInterface] = useState<string>('padrao');
  const [searchTerm, setSearchTerm] = useState("");

  // Função para construir árvore de rotas
  const buildRouteTree = (routes: AppRoute[], parentKey: string | null): RouteTreeNode[] => {
    const existingKeys = new Set(routes.map(r => r.key));
    
    return routes
      .filter(route => {
        if (route.parent_key === parentKey) return true;
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
        .select('user_id, nome, role, setor, foto_perfil_url')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
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
        const { error } = await supabase
          .from('user_route_access' as any)
          .upsert({ user_id: userId, route_key: routeKey, can_access: true });
        if (error) throw error;
      } else {
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
      toast.success('Permissão atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar permissão');
    },
  });

  // Mutation para liberar todas as rotas da interface atual
  const grantAllMutation = useMutation({
    mutationFn: async (userId: string) => {
      const interfaceRoutes = routes?.filter(r => r.interface === selectedInterface) || [];
      const accesses = interfaceRoutes.map(route => ({
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
      toast.success('Acessos liberados');
    },
    onError: () => {
      toast.error('Erro ao liberar acessos');
    },
  });

  // Mutation para remover todos os acessos da interface atual
  const revokeAllMutation = useMutation({
    mutationFn: async (userId: string) => {
      const interfaceRoutes = routes?.filter(r => r.interface === selectedInterface) || [];
      const routeKeys = interfaceRoutes.map(r => r.key);
      
      const { error } = await supabase
        .from('user_route_access' as any)
        .delete()
        .eq('user_id', userId)
        .in('route_key', routeKeys);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-route-access', selectedUserId] });
      toast.success('Acessos removidos');
    },
    onError: () => {
      toast.error('Erro ao remover acessos');
    },
  });

  if (!isAdmin) {
    return (
      <Alert className="bg-red-500/10 border-red-500/30">
        <AlertDescription className="text-red-400">
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
    updateAccessMutation.mutate({ userId: selectedUserId, routeKey, canAccess: checked });
  };

  const handleToggleFolder = (node: RouteTreeNode, checked: boolean) => {
    if (!selectedUserId) return;
    const toggleRecursive = (n: RouteTreeNode) => {
      handleToggle(n.key, checked);
      n.children.forEach(child => toggleRecursive(child));
    };
    toggleRecursive(node);
  };

  const hasFolderAccess = (node: RouteTreeNode): boolean => {
    const hasOwnAccess = hasAccess(node.key);
    const allChildrenHaveAccess = node.children.length > 0 
      ? node.children.every(child => hasFolderAccess(child))
      : true;
    return hasOwnAccess && allChildrenHaveAccess;
  };

  const filteredRoutesByInterface = routes?.filter(route => route.interface === selectedInterface) || [];
  const routeTree = buildRouteTree(filteredRoutesByInterface, null);
  
  const filteredRoutes = searchTerm 
    ? routes?.filter(route => 
        route.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.path.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const selectedUser = users?.find(u => u.user_id === selectedUserId);
  const grantedCount = userAccess?.filter(a => 
    filteredRoutesByInterface.some(r => r.key === a.route_key) && a.can_access
  ).length || 0;

  // Componente recursivo para renderizar item da árvore
  const RouteTreeItem = ({ node, level = 0 }: { node: RouteTreeNode; level?: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children.length > 0;
    const paddingLeft = level * 20;
    const isHomeRoute = node.key === 'home';
    const isHub = node.key.endsWith('_hub');

    if (hasChildren) {
      const folderHasAccess = hasFolderAccess(node);
      
      return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-0.5">
          <div 
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all cursor-pointer
                       ${isHub
                         ? folderHasAccess
                           ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-2 border-amber-500/40 shadow-lg shadow-amber-500/10'
                           : 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-2 border-amber-500/20'
                         : folderHasAccess 
                           ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30' 
                           : 'bg-white/5 border border-white/10 hover:border-blue-500/30'}`}
            style={{ marginLeft: `${paddingLeft}px` }}
          >
            <CollapsibleTrigger className="p-0 hover:bg-transparent" asChild>
              <button className="p-1 rounded hover:bg-white/10 transition-colors">
                {isOpen ? (
                  <ChevronDown className={`h-4 w-4 ${isHub ? 'text-amber-400' : 'text-blue-400'}`} />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/50" />
                )}
              </button>
            </CollapsibleTrigger>
            
            <Checkbox
              id={`folder-${node.key}`}
              checked={folderHasAccess}
              onCheckedChange={(checked) => handleToggleFolder(node, checked as boolean)}
              className={isHub 
                ? "border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                : "border-blue-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"}
            />
            
            {isOpen ? (
              <FolderOpen className={`h-4 w-4 ${isHub ? 'text-amber-400' : 'text-blue-400'}`} />
            ) : (
              <Folder className="h-4 w-4 text-white/50" />
            )}
            
            <label htmlFor={`folder-${node.key}`} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isHub ? 'text-amber-200' : 'text-white'}`}>{node.label}</span>
                {isHub && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Hub Principal
                  </span>
                )}
                <span className="text-xs text-white/40">({node.children.length} sub-rotas)</span>
              </div>
              
            </label>
          </div>
          
          <CollapsibleContent className="space-y-0.5 mt-0.5">
            {node.children.map(child => (
              <RouteTreeItem key={child.key} node={child} level={level + 1} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    const routeHasAccess = hasAccess(node.key);

    return (
      <div 
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all
                   ${isHomeRoute
                     ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/10 border border-green-500/30'
                     : routeHasAccess 
                       ? 'bg-gradient-to-r from-blue-500/15 to-blue-600/5 border border-blue-500/25' 
                       : 'bg-white/5 border border-white/10 hover:border-white/20'}`}
        style={{ marginLeft: `${paddingLeft + 28}px` }}
      >
        {isHomeRoute ? (
          <Globe className="h-4 w-4 text-green-400" />
        ) : (
          <Checkbox
            id={`route-${node.key}`}
            checked={routeHasAccess}
            onCheckedChange={(checked) => handleToggle(node.key, checked as boolean)}
            className="border-blue-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
        )}
        
        <label htmlFor={`route-${node.key}`} className="flex-1 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{node.label}</span>
            {isHomeRoute && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Acesso Universal
              </span>
            )}
          </div>
        </label>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com título */}
      <div className={sectionWrapperClass}>
        <div className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Gerenciar Permissões</h2>
            <p className="text-sm text-white/50">Controle o acesso às rotas do sistema</p>
          </div>
        </div>
      </div>

      {/* Seleção de Interface */}
      <div className={sectionWrapperClass}>
        <div className="px-4 py-3 border-b border-blue-500/10 bg-gradient-to-r from-blue-500/10 to-transparent">
          <span className={labelClass}>Interface</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {interfaces.map((iface) => {
              const Icon = iface.icon;
              const isSelected = selectedInterface === iface.value;
              const routeCount = routes?.filter(r => r.interface === iface.value).length || 0;
              
              return (
                <button
                  key={iface.value}
                  onClick={() => setSelectedInterface(iface.value)}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1
                             ${isSelected 
                               ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/20' 
                               : 'bg-white/5 border-white/10 hover:border-blue-500/30'}`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-400' : 'text-white/50'}`} />
                  <span className={`text-xs font-medium ${isSelected ? 'text-blue-300' : 'text-white/70'}`}>
                    {iface.label}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-blue-400/70' : 'text-white/40'}`}>
                    {routeCount} rotas
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seleção de Usuário */}
      <div className={sectionWrapperClass}>
        <div className="px-4 py-3 border-b border-blue-500/10 bg-gradient-to-r from-blue-500/10 to-transparent">
          <span className={labelClass}>Usuário</span>
        </div>
        <div className="p-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className={`${inputClass} w-full`}>
              <SelectValue placeholder="Selecione um usuário..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              {users?.map((user) => (
                <SelectItem 
                  key={user.user_id} 
                  value={user.user_id}
                  className="text-white hover:bg-white/10 focus:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-400" />
                    <span>{user.nome}</span>
                    <span className="text-white/40">• {user.role}</span>
                    {user.setor && <span className="text-white/30">({user.setor})</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Usuário Selecionado Info */}
      {selectedUser && (
        <div className={sectionWrapperClass}>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {selectedUser.foto_perfil_url ? (
                  <img src={selectedUser.foto_perfil_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {selectedUser.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                )}
              </div>
              <div>
                <p className="text-white font-medium">{selectedUser.nome}</p>
                <p className="text-xs text-white/50">{selectedUser.role} • {selectedUser.setor}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">{grantedCount}</p>
                <p className="text-xs text-white/50">de {filteredRoutesByInterface.length} rotas</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeAllMutation.mutate(selectedUserId)}
                  disabled={revokeAllMutation.isPending}
                  className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Remover
                </Button>
                <Button
                  size="sm"
                  onClick={() => grantAllMutation.mutate(selectedUserId)}
                  disabled={grantAllMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30 text-white hover:from-blue-600 hover:to-blue-800"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Liberar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Flutuante - Permissões Rápidas */}
      {selectedUser && (
        <div className={sectionWrapperClass}>
          <div className="px-4 py-3 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 to-transparent">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider">
                Menu Flutuante
              </span>
              <span className="text-xs text-amber-400/50 ml-2">• Botões de acesso rápido em todas as telas</span>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {FLOATING_MENU_ROUTES.map((routeKey) => {
                const config = floatingMenuConfig[routeKey];
                const route = routes?.find(r => r.key === routeKey);
                const routeHasAccess = hasAccess(routeKey);
                const Icon = config.icon;
                
                const colorClasses = {
                  blue: {
                    active: 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
                    inactive: 'from-blue-500/5 to-blue-600/5 border-blue-500/20',
                    icon: 'text-blue-400',
                    checkbox: 'border-blue-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                  },
                  purple: {
                    active: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
                    inactive: 'from-purple-500/5 to-purple-600/5 border-purple-500/20',
                    icon: 'text-purple-400',
                    checkbox: 'border-purple-500/50 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500',
                  },
                  emerald: {
                    active: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40',
                    inactive: 'from-emerald-500/5 to-emerald-600/5 border-emerald-500/20',
                    icon: 'text-emerald-400',
                    checkbox: 'border-emerald-500/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500',
                  },
                };
                
                const colors = colorClasses[config.color as keyof typeof colorClasses];
                
                return (
                  <div
                    key={routeKey}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all border-2
                               bg-gradient-to-r ${routeHasAccess ? colors.active : colors.inactive}
                               ${routeHasAccess ? 'shadow-lg' : ''}`}
                  >
                    <Checkbox
                      id={`floating-${routeKey}`}
                      checked={routeHasAccess}
                      onCheckedChange={(checked) => handleToggle(routeKey, checked as boolean)}
                      className={colors.checkbox}
                    />
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                    <label htmlFor={`floating-${routeKey}`} className="flex-1 cursor-pointer">
                      <span className="text-sm font-medium text-white">{config.label}</span>
                      {route && (
                        <p className="text-xs text-white/40 mt-0.5">{route.path}</p>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Busca e Lista de Rotas */}
      {selectedUserId && (
        <div className={sectionWrapperClass}>
          <div className="px-4 py-3 border-b border-blue-500/10 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between">
            <span className={labelClass}>Rotas Disponíveis</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} pl-9 h-8 text-sm`}
              />
            </div>
          </div>
          
          <div className="p-4">
            {isLoadingAccess ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : searchTerm ? (
              <div className="space-y-2">
                {filteredRoutes?.map((route) => (
                  <div 
                    key={route.key} 
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all
                               ${hasAccess(route.key)
                                 ? 'bg-gradient-to-r from-blue-500/15 to-blue-600/5 border border-blue-500/25'
                                 : 'bg-white/5 border border-white/10 hover:border-white/20'}`}
                  >
                    <Checkbox
                      id={`search-${route.key}`}
                      checked={hasAccess(route.key)}
                      onCheckedChange={(checked) => handleToggle(route.key, checked as boolean)}
                      className="border-blue-500/50 data-[state=checked]:bg-blue-500"
                    />
                    <label htmlFor={`search-${route.key}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{route.label}</span>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-white/10 text-white/50">
                          {route.interface}
                        </span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{route.path}</div>
                    </label>
                  </div>
                ))}
                {filteredRoutes?.length === 0 && (
                  <p className="text-center py-8 text-white/40">Nenhuma rota encontrada</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {routeTree.length > 0 ? (
                  routeTree.map(node => (
                    <RouteTreeItem key={node.key} node={node} />
                  ))
                ) : (
                  <p className="text-center py-8 text-white/40">
                    Nenhuma rota encontrada para esta interface
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
