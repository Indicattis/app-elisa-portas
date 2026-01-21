import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, CalendarDays, ClipboardList } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";

const menuItems = [
  {
    title: "Calendário Expedição",
    description: "Agendamento de carregamentos",
    icon: Truck,
    path: "/direcao/calendario-expedicao",
  },
  {
    title: "Cronograma",
    description: "Cronograma de instalações",
    icon: CalendarDays,
    path: "/hub-fabrica/instalacoes/cronograma",
  },
  {
    title: "Controle",
    description: "Controle de instalações",
    icon: ClipboardList,
    path: "/hub-fabrica/instalacoes/controle",
  },
];

export default function GestaoInstalacaoDirecao() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Direção", path: "/direcao" },
          { label: "Gestão de Instalações" }
        ]} 
        mounted={mounted} 
      />

      <SpaceParticles />

      {/* Lista de botões centralizada */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 w-full max-w-md">
        <div className="w-full flex flex-col gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
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
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <Icon className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-sm font-medium">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
