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

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <SpaceParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-4 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" />
            </button>
            <h1 className="text-lg font-semibold text-white">Direção</h1>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 flex items-center justify-center p-4">
          {/* Mobile: Lista vertical */}
          <div className="md:hidden flex flex-col gap-3 w-full max-w-xs">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full h-14 rounded-xl
                           bg-gradient-to-br from-blue-500 to-blue-700
                           hover:from-blue-400 hover:to-blue-600
                           flex items-center justify-center gap-3
                           text-white font-medium 
                           shadow-lg shadow-blue-500/30
                           hover:shadow-xl hover:shadow-blue-500/50
                           hover:scale-105
                           border border-blue-400/30
                           transition-all duration-300"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 max-w-2xl">
            {menuItems.map((item) => (
              <button
                key={item.path}
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
              >
                <item.icon className="w-6 h-6" />
                <span className="text-sm text-center px-2">{item.label}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
