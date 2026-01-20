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
        <header className="sticky top-0 z-20 px-4 py-4 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" />
            </button>
            <h1 className="text-lg font-semibold text-white">Direção</h1>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4">
          <div className="max-w-md mx-auto flex flex-col gap-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full py-4 px-5 rounded-xl
                           bg-primary/5 border border-primary/10
                           hover:bg-primary/10
                           flex items-center gap-4
                           text-white font-medium 
                           backdrop-blur-xl
                           transition-all duration-300"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                  <item.icon className="w-5 h-5" />
                </div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
