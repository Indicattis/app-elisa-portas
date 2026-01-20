import { useNavigate } from "react-router-dom";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Container central */}
      <div className="relative w-[600px] h-[600px] flex items-center justify-center">
        
        {/* Anel decorativo da órbita */}
        <div className="absolute w-[420px] h-[420px] rounded-full border border-blue-500/20 animate-fade-in" />
        <div className="absolute w-[380px] h-[380px] rounded-full border border-blue-500/10 animate-fade-in" />
        
        {/* Logo central */}
        <div className="absolute z-10 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse-glow" />
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
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="absolute left-1/2 top-1/2 
                         w-24 h-24 rounded-full 
                         bg-gradient-to-br from-blue-500 to-blue-700
                         hover:from-blue-400 hover:to-blue-600
                         flex flex-col items-center justify-center gap-1.5
                         text-white font-medium 
                         shadow-lg shadow-blue-500/30
                         hover:shadow-xl hover:shadow-blue-500/50
                         hover:scale-110 
                         transition-all duration-300 ease-out
                         cursor-pointer
                         border border-blue-400/30"
              style={{
                animation: `orbit-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.12}s forwards, 
                           float 5s ease-in-out ${index * 0.8}s infinite,
                           pulse-glow 4s ease-in-out ${index * 0.5}s infinite`,
                ['--orbit-x' as string]: `calc(-50% + ${pos.x}px)`,
                ['--orbit-y' as string]: `calc(-50% + ${pos.y}px)`,
                opacity: 0
              }}
            >
              <Icon className="w-7 h-7" strokeWidth={1.5} />
              <span className="text-xs font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
        
      </div>
    </div>
  );
}
