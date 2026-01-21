import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CalendarDays } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";

const menuItems = [
  {
    title: "Gestão de Equipes",
    description: "Gerenciar equipes de instalação",
    icon: Users,
    path: "/logistica/instalacoes/equipes",
  },
  {
    title: "Cronograma",
    description: "Cronograma de instalações",
    icon: CalendarDays,
    path: "/logistica/instalacoes/cronograma",
  },
];

export default function InstalacoesHub() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Instalações" }
        ]} 
        mounted={mounted} 
      />

      <SpaceParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col pt-14">

        {/* Conteúdo */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full max-w-[300px] h-16 rounded-xl
                           bg-gradient-to-br from-blue-500 to-blue-700
                           hover:from-blue-400 hover:to-blue-600
                           flex items-center gap-4 px-4
                           text-white font-medium 
                           shadow-lg shadow-blue-500/30
                           hover:shadow-xl hover:shadow-blue-500/50
                           hover:scale-105
                           border border-blue-400/30
                           transition-all duration-300"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex flex-col items-start text-left">
                  <span>{item.title}</span>
                  <span className="text-xs font-normal opacity-80">{item.description}</span>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
