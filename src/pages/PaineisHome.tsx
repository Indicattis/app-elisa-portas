import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, Map, BookOpen, Calendar, Calculator, LogOut, Home, LayoutDashboard, Lock, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";

const routeKeyMap: Record<string, string> = {
  '/paineis/tv-dashboard': 'tv_dashboard',
  '/paineis/mapa': 'mapa_autorizados',
  '/paineis/diario-bordo': 'diario_bordo',
  '/paineis/calendario': 'calendario',
  '/paineis/contador-vendas': 'contador_vendas',
  '/paineis/metas-vendas': 'paineis_metas_vendas',
};

const paineis = [
  {
    title: "Modo TV",
    description: "Dashboard para exibição em telas grandes",
    icon: Tv,
    path: "/paineis/tv-dashboard",
    color: "from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20",
  },
  {
    title: "Mapa de Autorizados",
    description: "Visualize autorizados no mapa",
    icon: Map,
    path: "/paineis/mapa",
    color: "from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20",
  },
  {
    title: "Diário de Bordo",
    description: "Registro de atas e reuniões",
    icon: BookOpen,
    path: "/paineis/diario-bordo",
    color: "from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20",
  },
  {
    title: "Calendário",
    description: "Gerencie eventos e compromissos",
    icon: Calendar,
    path: "/paineis/calendario",
    color: "from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20",
  },
  {
    title: "Contador de Vendas",
    description: "Acompanhe vendas em tempo real",
    icon: Calculator,
    path: "/paineis/contador-vendas",
    color: "from-pink-500/10 to-pink-600/10 hover:from-pink-500/20 hover:to-pink-600/20",
  },
  {
    title: "Metas de Vendas",
    description: "Progresso de metas com tiers e bonificações",
    icon: Target,
    path: "/paineis/metas-vendas",
    color: "from-amber-500/10 to-yellow-600/10 hover:from-amber-500/20 hover:to-yellow-600/20",
  },
];

const profileMenuItems = [
  { label: 'Home', icon: Home, path: '/home' },
];

export default function PaineisHome() {
  const navigate = useNavigate();
  const { user, userRole, signOut, hasBypassPermissions } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: userAccess } = useQuery({
    queryKey: ['user-paineis-access', user?.id, hasBypassPermissions],
    queryFn: async () => {
      if (!user?.id) return [];
      const routeKeys = Object.values(routeKeyMap);
      const { data } = await supabase
        .from('user_route_access')
        .select('route_key')
        .eq('user_id', user.id)
        .eq('can_access', true)
        .in('route_key', routeKeys);
      return data?.map(r => r.route_key) || [];
    },
    enabled: !!user?.id && !hasBypassPermissions,
  });

  const hasAccess = (path: string): boolean => {
    if (hasBypassPermissions) return true;
    const routeKey = routeKeyMap[path];
    if (!routeKey) return true;
    return userAccess?.includes(routeKey) || false;
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getUserInitials = (nome: string) => {
    if (!nome) return "U";
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const handleCardClick = (path: string, canAccess: boolean) => {
    if (canAccess) {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center overflow-hidden relative py-10">
      {/* Breadcrumb animado */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Painéis" }
        ]} 
        mounted={mounted} 
      />

      {/* Avatar flutuante */}
      {userRole && (
        <div className="fixed top-4 right-4 z-50" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="relative group"
          >
            <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg shadow-black/50 transition-all duration-300 group-hover:border-white/40 group-hover:scale-105">
              <AvatarImage src={userRole.foto_perfil_url || undefined} alt="Foto de perfil" />
              <AvatarFallback className="bg-zinc-800 text-white text-sm font-medium">
                {getUserInitials(userRole.nome || user?.email || '')}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Menu dropdown */}
          <div
            className={`absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-200 ${
              profileMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white truncate">{userRole.nome || user?.email}</p>
              <p className="text-xs text-white/50 capitalize">{userRole.role?.replace("_", " ")}</p>
            </div>
            
            <div className="py-1">
              {profileMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
              
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 flex items-center gap-3 text-red-400/80 hover:text-red-400 hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-5xl mt-16">
        {/* Título */}
        <div 
          className="text-center mb-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 100ms'
          }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Painéis e Dashboards
          </h1>
          <p className="text-white/50 mt-3 text-lg">
            Selecione um painel para visualizar informações específicas
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {paineis.map((painel, index) => {
            const canAccess = hasAccess(painel.path);
            const delay = 200 + index * 80;
            const Icon = painel.icon;
            
            return (
              <div
                key={painel.path}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
                }}
              >
                <button
                  onClick={() => handleCardClick(painel.path, canAccess)}
                  disabled={!canAccess}
                  className="w-full h-full text-left"
                >
                  <Card 
                    className={`relative h-full transition-all duration-300 border-white/10 bg-gradient-to-br ${painel.color} backdrop-blur-sm
                      ${canAccess 
                        ? 'hover:shadow-lg hover:shadow-black/30 hover:border-white/20 hover:scale-[1.02] cursor-pointer' 
                        : 'opacity-40 cursor-not-allowed'
                      }`}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${!canAccess ? 'opacity-50' : ''}`}>
                          <Icon className="h-6 w-6 text-white/80" />
                        </div>
                        <CardTitle className="text-xl text-white">{painel.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-white/50">
                        {painel.description}
                      </CardDescription>
                    </CardContent>
                    
                    {/* Ícone de cadeado para itens bloqueados */}
                    {!canAccess && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                  </Card>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
