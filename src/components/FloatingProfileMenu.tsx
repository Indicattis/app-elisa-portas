import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PanelLeft, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface FloatingProfileMenuProps {
  mounted?: boolean;
}

export function FloatingProfileMenu({ mounted = true }: FloatingProfileMenuProps) {
  const navigate = useNavigate();
  const { userRole, signOut } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
              navigate('/painels');
              setProfileMenuOpen(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="text-sm">Painéis</span>
          </button>

          <button
            onClick={() => {
              navigate('/dashboard');
              setProfileMenuOpen(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => {
              navigate('/admin');
              setProfileMenuOpen(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Admin</span>
          </button>

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
