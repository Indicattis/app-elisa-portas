import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PanelLeft, Settings, Lock, Factory, User, ClipboardList } from 'lucide-react';
import { MinhasTarefasFullscreen } from '@/components/MinhasTarefasFullscreen';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mapeamento de rotas para route_keys
const routeKeyMap: Record<string, string> = {
  '/paineis': 'paineis',
  '/admin': 'admin',
  '/producao': 'producao_hub',
};

// Definir itens do menu
const menuItems = [
  { label: 'Produção', icon: Factory, path: '/producao' },
  { label: 'Painéis', icon: PanelLeft, path: '/paineis' },
  { label: 'Admin', icon: Settings, path: '/admin' },
];

interface FloatingProfileMenuProps {
  mounted?: boolean;
}

export function FloatingProfileMenu({ mounted = true }: FloatingProfileMenuProps) {
  const navigate = useNavigate();
  const { user, userRole, signOut, hasBypassPermissions } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [minhasTarefasOpen, setMinhasTarefasOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Buscar permissões do usuário para os itens do menu
  const { data: userAccess } = useQuery({
    queryKey: ['user-profile-menu-access', user?.id, hasBypassPermissions],
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

  const getUserInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!userRole) return null;

  return (
    <div 
      ref={profileMenuRef}
      className="fixed top-4 right-4 z-50 transition-all duration-700"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.8)'
      }}
    >
      <div className="flex items-center gap-2">
        {/* Botão Minhas Tarefas */}
        <button
          onClick={() => setMinhasTarefasOpen(true)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/50 flex items-center justify-center text-white/70 hover:text-white hover:border-blue-500/50 transition-colors active:scale-95"
        >
          <ClipboardList className="w-5 h-5" />
        </button>

        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="focus:outline-none"
        >
          <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg shadow-black/50 cursor-pointer hover:border-blue-500/50 transition-colors">
            <AvatarImage src={userRole.foto_perfil_url || undefined} alt={userRole.nome} />
            <AvatarFallback className="bg-blue-500/30 text-white font-medium">
              {getUserInitials(userRole.nome)}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>

      {/* Dropdown Menu */}
      <div 
        className="absolute top-14 right-0 w-48 overflow-hidden
                   bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg
                   shadow-xl shadow-black/50"
        style={{
          opacity: profileMenuOpen ? 1 : 0,
          transform: profileMenuOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
          pointerEvents: profileMenuOpen ? 'auto' : 'none',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <div className="px-3 py-2 border-b border-white/10">
          <p className="text-white/80 text-sm font-medium truncate">{userRole.nome}</p>
          <p className="text-white/40 text-xs truncate">{userRole.email}</p>
        </div>

        <div className="py-1">
          <button
            onClick={() => {
              navigate('/perfil');
              setProfileMenuOpen(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">Meu Perfil</span>
          </button>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const canAccess = hasAccess(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (canAccess) {
                    navigate(item.path);
                    setProfileMenuOpen(false);
                  }
                }}
                disabled={!canAccess}
                className={`w-full px-3 py-2 flex items-center gap-3 transition-colors
                  ${canAccess 
                    ? 'text-white/70 hover:text-white hover:bg-white/10 cursor-pointer' 
                    : 'text-zinc-600 cursor-not-allowed'
                  }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${!canAccess ? 'opacity-50' : ''}`} />
                  {!canAccess && (
                    <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-zinc-500" />
                  )}
                </div>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 flex items-center gap-3 text-red-400/80 hover:text-red-400 hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
