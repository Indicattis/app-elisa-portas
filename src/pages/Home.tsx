import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logoEmpresa from "@/assets/logo-empresa.png";
import { ShoppingCart, Factory, Shield, Truck, Building2 } from "lucide-react";

const menuItems = [
  { label: "Vendas", icon: ShoppingCart, path: "/dashboard/vendas", angle: 0 },
  { label: "Fábrica", icon: Factory, path: "/hub-fabrica", angle: 72 },
  { label: "Direção", icon: Shield, path: "/dashboard/direcao", angle: 144 },
  { label: "Logística", icon: Truck, path: "/dashboard/logistica", angle: 216 },
  { label: "Administrativo", icon: Building2, path: "/dashboard/administrativo", angle: 288 }
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

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Container central */}
      <div className="relative w-[600px] h-[600px] flex items-center justify-center">
        
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
          
          return (
            // Wrapper para posicionamento orbital
            <div
              key={item.label}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
                opacity: mounted ? 1 : 0,
                transform: mounted 
                  ? `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`
                  : 'translate(-50%, -50%) scale(0.2)',
              }}
            >
              {/* Botão com animação de flutuação */}
              <button
                onClick={() => navigate(item.path)}
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
                           transition-all duration-300
                           animate-float"
                style={{
                  animationDelay: `${index * 0.8}s`
                }}
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
