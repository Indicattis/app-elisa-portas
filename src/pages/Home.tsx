import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logoPortasEnrolar from "@/assets/logo-portas-enrolar.ico";
import { ShoppingCart, Factory, Shield, Truck, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SpaceParticles } from "@/components/SpaceParticles";

const menuItems = [
  { label: "Vendas", icon: ShoppingCart, path: "/vendas", angle: 0 },
  { label: "Fábrica", icon: Factory, path: "/fabrica", angle: 72 },
  { label: "Direção", icon: Shield, path: "/direcao", angle: 144 },
  { label: "Logística", icon: Truck, path: "/logistica", angle: 216 },
  { label: "Administrativo", icon: Building2, path: "/administrativo", angle: 288 }
];

const getOrbitPosition = (angle: number, radius: number) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius
  };
};

export default function Home() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getUserInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Tag flutuante de perfil */}
      {userRole && (
        <div 
          className="fixed top-4 right-4 z-50 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.8)'
          }}
        >
          <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg shadow-black/50">
            <AvatarImage src={userRole.foto_perfil_url || undefined} alt={userRole.nome} />
            <AvatarFallback className="bg-blue-500/30 text-white font-medium">
              {getUserInitials(userRole.nome)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Partículas espaciais de fundo */}
      <SpaceParticles slowMode={hoveredIndex !== null} />
      
      {/* ========== VERSÃO MOBILE ========== */}
      <div className="md:hidden relative z-10 flex flex-col items-center px-6 py-10 w-full max-w-md">
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
            const isHovered = hoveredIndex === index;
            const hasHover = hoveredIndex !== null;
            const isOther = hasHover && !isHovered;
            
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="w-full h-14 rounded-lg
                           bg-gradient-to-r from-blue-500 to-blue-700
                           hover:from-blue-400 hover:to-blue-600
                           active:scale-[0.98]
                           flex items-center gap-4 px-5
                           text-white font-medium 
                           shadow-lg shadow-blue-500/20
                           border border-blue-400/30
                           transition-all duration-300"
                style={{
                  opacity: mounted ? (isOther ? 0.4 : 1) : 0,
                  transform: mounted 
                    ? `translateX(0) scale(${isOther ? 0.95 : 1})` 
                    : 'translateX(-30px)',
                  filter: isOther ? 'blur(2px)' : 'none',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${mounted ? '0ms' : delay + 'ms'}`
                }}
              >
                <Icon className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== VERSÃO DESKTOP ========== */}
      <div className="hidden md:flex relative z-10 w-[600px] h-[600px] items-center justify-center">
        
        {/* Anel decorativo da órbita */}
        <div 
          className="absolute w-[420px] h-[420px] rounded-full border border-blue-500/20 transition-all duration-1000"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.5)'
          }}
        />
        <div 
          className="absolute w-[380px] h-[380px] rounded-full border border-blue-500/10 transition-all duration-1000 delay-100"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.5)'
          }}
        />
        
        {/* Logo central */}
        <div 
          className="absolute z-10 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.8)'
          }}
        >
          <div className="relative">
            <div className="w-36 h-36 rounded-full bg-blue-500/20 flex items-center justify-center">
              <img 
                src={logoPortasEnrolar} 
                alt="Logo" 
                className="w-24 h-24 object-contain drop-shadow-2xl" 
              />
            </div>
          </div>
        </div>
        
        {/* Botões orbitais */}
        {menuItems.map((item, index) => {
          const pos = getOrbitPosition(item.angle, 190);
          const Icon = item.icon;
          const delay = 200 + index * 120;
          const isHovered = hoveredIndex === index;
          const hasHover = hoveredIndex !== null;
          const isOther = hasHover && !isHovered;
          
          return (
            <div
              key={item.label}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                opacity: mounted ? (isOther ? 0.35 : 1) : 0,
                transform: mounted 
                  ? `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${isOther ? 0.95 : 1})`
                  : 'translate(-50%, -50%) scale(0.2)',
                filter: isOther ? 'blur(3px)' : 'none',
                transitionDelay: mounted ? '0ms' : `${delay}ms`,
              }}
            >
              <button
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="w-24 h-24 rounded-full 
                           bg-gradient-to-br from-blue-500 to-blue-700
                           hover:from-blue-400 hover:to-blue-600
                           flex flex-col items-center justify-center gap-1.5
                           text-white font-medium 
                           shadow-lg shadow-blue-500/30
                           hover:shadow-xl hover:shadow-blue-500/50
                           hover:scale-110 
                           cursor-pointer
                           border border-blue-400/30
                           transition-all duration-300"
              >
                <Icon className="w-7 h-7" strokeWidth={1.5} />
                <span className="text-xs font-medium tracking-wide">{item.label}</span>
              </button>
            </div>
          );
        })}
        
      </div>
    </div>
  );
}
