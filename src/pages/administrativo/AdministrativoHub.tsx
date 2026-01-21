import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { DollarSign, Users, ShoppingCart, FileText, Package, Lock } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';

const menuItems = [
  { label: "Financeiro", icon: DollarSign, path: "/administrativo/financeiro", ativo: false },
  { label: "RH/DP", icon: Users, path: "/administrativo/rh-dp", ativo: false },
  { label: "Compras & Suprimentos", icon: ShoppingCart, path: "/administrativo/compras", ativo: false },
  { label: "Fiscal & Contábil", icon: FileText, path: "/administrativo/controladoria", ativo: false },
  { label: "Pedidos", icon: Package, path: "/administrativo/pedidos", ativo: true },
];

export default function AdministrativoHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = (item: typeof menuItems[0]) => {
    if (item.ativo) {
      navigate(item.path);
    } else {
      toast({
        title: "Em desenvolvimento",
        description: `A página ${item.label} estará disponível em breve.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo" }
        ]} 
        mounted={mounted} 
      />

      <SpaceParticles />

      {/* ========== VERSÃO MOBILE ========== */}
      <div className="md:hidden relative z-10 flex flex-col items-center px-6 py-10 w-full max-w-md">
        <div className="w-full flex flex-col gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item)}
                className={`w-full h-14 rounded-lg
                           flex items-center gap-4 px-5
                           font-medium 
                           border transition-all duration-300
                           ${item.ativo 
                             ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 active:scale-[0.98] text-white shadow-lg shadow-blue-500/20 border-blue-400/30' 
                             : 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                           }`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <Icon className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                {!item.ativo && <Lock className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== VERSÃO DESKTOP ========== */}
      <div className="hidden md:flex relative z-10 flex-col items-center gap-8">
        <div className="grid grid-cols-3 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 200 + index * 100;
            
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item)}
                className={`w-40 h-32 rounded-xl
                           flex flex-col items-center justify-center gap-3
                           font-medium border transition-all duration-300
                           ${item.ativo 
                             ? 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 text-white shadow-lg shadow-blue-500/30 border-blue-400/30 cursor-pointer' 
                             : 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                           }`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <div className="relative">
                  <Icon className="w-8 h-8" strokeWidth={1.5} />
                  {!item.ativo && (
                    <Lock className="w-3 h-3 absolute -top-1 -right-1" />
                  )}
                </div>
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
