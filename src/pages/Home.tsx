import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logoEmpresa from "@/assets/logo-empresa.png";
import { ShoppingCart, Factory, Shield, Truck, Building2 } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
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
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
            <img 
              src={logoEmpresa} 
              alt="Logo" 
              className="w-24 h-24 object-contain relative z-10 drop-shadow-2xl" 
            />
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
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
            <img 
              src={logoEmpresa} 
              alt="Logo" 
              className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl" 
            />
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
