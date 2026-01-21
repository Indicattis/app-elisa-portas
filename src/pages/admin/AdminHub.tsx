import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Briefcase, Building2, Users, ArrowLeft, LogOut, LayoutDashboard, Tv } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { label: "Permissões", icon: Shield, path: "/admin/permissions" },
  { label: "Cargos", icon: Briefcase, path: "/admin/roles" },
  { label: "Empresas", icon: Building2, path: "/admin/companies" },
  { label: "Usuários", icon: Users, path: "/admin/users" },
];

export default function AdminHub() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, userRole, signOut } = useAuth();

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <SpaceParticles />

      {/* Avatar flutuante */}
      {user && (
        <div ref={profileMenuRef} className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="focus:outline-none"
          >
            <Avatar className="h-10 w-10 border-2 border-white/20 hover:border-blue-500/50 cursor-pointer transition-all duration-300">
              <AvatarImage src={userRole?.foto_perfil_url || undefined} alt="Foto de perfil" />
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {getUserInitials(user.email || "")}
              </AvatarFallback>
            </Avatar>
          </button>

          <div
            className="absolute top-14 right-0 w-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden"
            style={{
              opacity: profileMenuOpen ? 1 : 0,
              transform: profileMenuOpen ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.95)",
              pointerEvents: profileMenuOpen ? "auto" : "none",
              transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white truncate">{userRole?.nome || user.email}</p>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>

            <button
              onClick={() => navigate("/painels")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              <Tv className="w-4 h-4" />
              Painéis
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Botão voltar */}
        <button
          onClick={() => navigate("/home")}
          className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 
                     border border-primary/10 transition-all duration-300"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(-20px)",
            transition: "all 0.5s ease 100ms",
          }}
        >
          <ArrowLeft className="w-5 h-5 text-white/80" />
        </button>

        {/* Título */}
        <div
          className="pt-20 pb-8 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s",
          }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Administração</h1>
          <p className="text-white/60 text-sm">Configurações e controle do sistema</p>
        </div>

        {/* Menu - Mobile */}
        <div className="md:hidden flex-1 flex flex-col justify-center px-6 pb-20 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all duration-200 flex items-center gap-4"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateX(0)" : "translateX(-40px)",
                  transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.15 + index * 0.08}s`,
                }}
              >
                <Icon className="w-6 h-6" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Menu - Desktop */}
        <div className="hidden md:flex flex-1 flex-col justify-center items-center pb-20 gap-4 max-w-md mx-auto w-full px-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-4"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(20px)",
                  transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.15 + index * 0.08}s`,
                }}
              >
                <Icon className="w-6 h-6" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
