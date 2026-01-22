import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logoPortasEnrolar from "@/assets/logo-portas-enrolar.ico";
import { ShoppingCart, Factory, Shield, Truck, Building2, LogOut, LayoutDashboard, PanelLeft, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";

const menuItems = [
  { label: "Direção", icon: Shield, path: "/direcao", isGold: true },
  { label: "Vendas", icon: ShoppingCart, path: "/vendas" },
  { label: "Fábrica", icon: Factory, path: "/fabrica" },
  { label: "Logística", icon: Truck, path: "/logistica" },
  { label: "Administrativo", icon: Building2, path: "/administrativo" }
];

export default function Home() {
  const navigate = useNavigate();
  const { userRole, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Breadcrumb animado */}
      <AnimatedBreadcrumb 
        items={[{ label: "Home" }]} 
        mounted={mounted} 
      />

      {/* Tag flutuante de perfil */}
      {userRole && (
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
      )}

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-col items-center px-6 py-10 w-full max-w-md">
        {/* Logo */}
        <div 
          className="mb-8 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-20px)'
          }}
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-blue-500/20 flex items-center justify-center">
              <img 
                src={logoPortasEnrolar} 
                alt="Logo" 
                className="w-20 h-20 object-contain drop-shadow-2xl" 
              />
            </div>
          </div>
        </div>

        {/* Lista de botões */}
        <div className="w-full flex flex-col gap-3">
        {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <div
                key={item.label}
                className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${mounted ? '0ms' : delay + 'ms'}`
                }}
              >
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full h-12 rounded-lg
                             flex items-center gap-4 px-5
                             text-white font-medium border
                             ${item.isGold 
                               ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 border-amber-300/50 shadow-lg shadow-amber-500/20' 
                               : 'bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30'
                             }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
