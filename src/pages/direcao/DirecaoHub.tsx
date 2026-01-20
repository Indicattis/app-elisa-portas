import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, DollarSign, Factory, Truck, Target } from 'lucide-react';
import { SpaceParticles } from '@/components/SpaceParticles';

const menuItems = [
  { label: 'Vendas', icon: ShoppingCart, path: '/direcao/vendas' },
  { label: 'Faturamento', icon: DollarSign, path: '/direcao/faturamento' },
  { label: 'Gestão de Fábrica', icon: Factory, path: '/direcao/gestao-fabrica' },
  { label: 'Gestão de Instalações', icon: Truck, path: '/direcao/gestao-instalacao' },
  { label: 'Metas', icon: Target, path: '/direcao/metas' },
];

export default function DirecaoHub() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Partículas espaciais de fundo */}
      <SpaceParticles />
      
      {/* Botão de voltar */}
      <button
        onClick={() => navigate('/home')}
        className="absolute top-6 left-6 z-20 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 
                   border border-primary/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s ease 100ms'
        }}
      >
        <ArrowLeft className="w-5 h-5 text-white/80" />
      </button>

      {/* ========== VERSÃO MOBILE ========== */}
      <div className="md:hidden relative z-10 flex flex-col items-center justify-center px-6 py-10 w-full max-w-md">
        {/* Lista de botões */}
        <div className="w-full flex flex-col gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <button
                key={item.label}
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
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== VERSÃO DESKTOP ========== */}
      <div className="hidden md:flex relative z-10 flex-col items-center justify-center">
        {/* Grid de botões */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 200 + index * 100;
            
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-44 h-28 rounded-xl
                           bg-gradient-to-br from-blue-500 to-blue-700
                           hover:from-blue-400 hover:to-blue-600
                           flex flex-col items-center justify-center gap-2
                           text-white font-medium 
                           shadow-lg shadow-blue-500/30
                           hover:shadow-xl hover:shadow-blue-500/50
                           hover:scale-105
                           border border-blue-400/30
                           transition-all duration-300"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <Icon className="w-8 h-8" strokeWidth={1.5} />
                <span className="text-sm font-medium text-center px-2">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
