import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Briefcase, Building2, Users, LogOut, LayoutDashboard, Tv, ArrowLeft, FileText } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";

const menuItems = [
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Permissões", icon: Shield, path: "/admin/permissions" },
  { label: "Cargos", icon: Briefcase, path: "/admin/roles" },
  { label: "Empresas", icon: Building2, path: "/admin/companies" },
  { label: "Logs", icon: FileText, path: "/admin/logs" },
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
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Admin" }
        ]} 
        mounted={mounted} 
      />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/home')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      

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
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* ========== VERSÃO MOBILE ========== */}
      <div className="md:hidden relative z-10 flex flex-col items-center justify-center px-6 py-10 w-full max-w-md">
        <div className="w-full flex flex-col gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <div
                key={item.path}
                className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                           transition-all duration-300"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full h-12 rounded-lg
                             bg-gradient-to-r from-blue-500 to-blue-700
                             hover:from-blue-400 hover:to-blue-600
                             active:scale-[0.98]
                             flex items-center gap-4 px-5
                             text-white font-medium 
                             shadow-lg shadow-blue-500/20
                             border border-blue-400/30
                             transition-all duration-300"
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== VERSÃO DESKTOP ========== */}
      <div className="hidden md:flex relative z-10 flex-col items-center justify-center px-6 py-10 w-full max-w-md">
        <div className="w-full flex flex-col gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <div
                key={item.path}
                className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                           transition-all duration-300"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full h-12 rounded-lg
                             bg-gradient-to-r from-blue-500 to-blue-700
                             hover:from-blue-400 hover:to-blue-600
                             active:scale-[0.98]
                             flex items-center gap-4 px-5
                             text-white font-medium 
                             shadow-lg shadow-blue-500/20
                             border border-blue-400/30
                             transition-all duration-300"
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
