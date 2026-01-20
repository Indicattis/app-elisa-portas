import { useNavigate } from "react-router-dom";
import { Truck, Car, CalendarDays, ArrowLeft } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";

const menuItems = [
  {
    title: "Expedição",
    description: "Agendamento de carregamentos",
    icon: Truck,
    path: "/logistica/expedicao",
  },
  {
    title: "Frota",
    description: "Gestão de veículos",
    icon: Car,
    path: "/logistica/frota",
  },
  {
    title: "Instalações",
    description: "Cronograma e equipes",
    icon: CalendarDays,
    path: "/logistica/instalacoes",
  },
];

export default function LogisticaHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <SpaceParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-4 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Logística</h1>
              <p className="text-sm text-white/60">Selecione a área</p>
            </div>
          </div>
        </header>

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
