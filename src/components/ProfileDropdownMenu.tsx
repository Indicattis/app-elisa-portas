import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, PanelLeft, Settings, Lock, Factory, User, Sun, Moon, Monitor } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const routeKeyMap: Record<string, string> = {
  '/paineis': 'paineis',
  '/admin': 'admin',
  '/producao': 'producao_hub',
};

const menuItems = [
  { label: 'Produção', icon: Factory, path: '/producao' },
  { label: 'Painéis', icon: PanelLeft, path: '/paineis' },
  { label: 'Admin', icon: Settings, path: '/admin' },
];

interface ProfileDropdownMenuProps {
  /**
   * Visual variant:
   * - 'glass' (default): dark glassmorphism — for dark hub pages.
   * - 'popover': uses themed popover tokens — for light/dark layouts with sidebar.
   */
  variant?: 'glass' | 'popover';
  /** Avatar size in pixels (default 40). */
  avatarSize?: number;
  /** Optional className for the avatar trigger wrapper. */
  className?: string;
}

/**
 * Reusable profile avatar + dropdown with theme switcher.
 * Handles its own open/close state and outside-click.
 */
export function ProfileDropdownMenu({
  variant = 'popover',
  avatarSize = 40,
  className,
}: ProfileDropdownMenuProps) {
  const navigate = useNavigate();
  const { user, userRole, signOut, hasBypassPermissions } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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
      return data?.map((r) => r.route_key) || [];
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
    const parts = nome.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!userRole) return null;

  const isGlass = variant === 'glass';

  // Theme classes for the panel
  const panelClass = isGlass
    ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/50'
    : 'bg-popover border border-border text-popover-foreground shadow-lg';

  const headerNameClass = isGlass ? 'text-white/80' : 'text-foreground';
  const headerEmailClass = isGlass ? 'text-white/40' : 'text-muted-foreground';
  const itemClass = isGlass
    ? 'text-white/70 hover:text-white hover:bg-white/10'
    : 'text-foreground/80 hover:text-foreground hover:bg-accent';
  const disabledItemClass = isGlass ? 'text-zinc-600' : 'text-muted-foreground/50';
  const lockColorClass = isGlass ? 'text-zinc-500' : 'text-muted-foreground';
  const logoutClass = isGlass
    ? 'text-red-400/80 hover:text-red-400 hover:bg-white/10'
    : 'text-destructive hover:text-destructive hover:bg-destructive/10';
  const dividerClass = isGlass ? 'border-white/10' : 'border-border';
  const themeLabelClass = isGlass ? 'text-white/40' : 'text-muted-foreground';
  const themeBtnActive = isGlass ? 'bg-white/15 text-white' : 'bg-accent text-accent-foreground';
  const themeBtnIdle = isGlass
    ? 'text-white/50 hover:text-white hover:bg-white/10'
    : 'text-muted-foreground hover:text-foreground hover:bg-accent';
  const avatarBorder = isGlass ? 'border-white/20 hover:border-blue-500/50' : 'border-border hover:border-primary/60';
  const avatarFallbackClass = isGlass ? 'bg-blue-500/30 text-white' : 'bg-primary/20 text-foreground';

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus:outline-none"
        aria-label="Abrir menu de perfil"
      >
        <Avatar
          className={cn('border-2 cursor-pointer transition-colors', avatarBorder)}
          style={{ width: avatarSize, height: avatarSize }}
        >
          <AvatarImage src={userRole.foto_perfil_url || undefined} alt={userRole.nome} />
          <AvatarFallback className={cn('font-medium', avatarFallbackClass)}>
            {getUserInitials(userRole.nome)}
          </AvatarFallback>
        </Avatar>
      </button>

      <div
        className={cn(
          'absolute right-0 mt-2 w-52 overflow-hidden rounded-lg z-50',
          panelClass,
        )}
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className={cn('px-3 py-2 border-b', dividerClass)}>
          <p className={cn('text-sm font-medium truncate', headerNameClass)}>{userRole.nome}</p>
          <p className={cn('text-xs truncate', headerEmailClass)}>{userRole.email}</p>
        </div>

        <div className="py-1">
          <button
            onClick={() => {
              navigate('/perfil');
              setOpen(false);
            }}
            className={cn('w-full px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer', itemClass)}
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
                    setOpen(false);
                  }
                }}
                disabled={!canAccess}
                className={cn(
                  'w-full px-3 py-2 flex items-center gap-3 transition-colors',
                  canAccess ? cn('cursor-pointer', itemClass) : cn('cursor-not-allowed', disabledItemClass),
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-4 h-4', !canAccess && 'opacity-50')} />
                  {!canAccess && <Lock className={cn('w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5', lockColorClass)} />}
                </div>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleLogout}
            className={cn('w-full px-3 py-2 flex items-center gap-3 transition-colors', logoutClass)}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>

        <div className={cn('border-t px-3 py-2', dividerClass)}>
          <p className={cn('text-[10px] uppercase tracking-wider mb-1.5', themeLabelClass)}>Tema</p>
          <div className="flex items-center gap-1">
            {(
              [
                { value: 'light', icon: Sun, label: 'Claro' },
                { value: 'dark', icon: Moon, label: 'Escuro' },
                { value: 'system', icon: Monitor, label: 'Sistema' },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={label}
                aria-label={label}
                className={cn(
                  'flex-1 h-8 rounded-md flex items-center justify-center transition-colors',
                  theme === value ? themeBtnActive : themeBtnIdle,
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}