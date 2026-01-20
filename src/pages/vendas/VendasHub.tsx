import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Users, 
  BookOpen, 
  FileText, 
  Handshake,
  ArrowLeft
} from 'lucide-react';
import { SpaceParticles } from '@/components/SpaceParticles';
import logoEmpresa from '/lovable-uploads/8a65a7c4-6922-4d04-be9a-0ddd0393a735.png';

const menuItems = [
  { label: 'Minhas Vendas', icon: ShoppingCart, path: '/vendas/minhas-vendas' },
  { label: 'Meus Clientes', icon: Users, path: '/vendas/meus-clientes' },
  { label: 'Catálogo', icon: BookOpen, path: '/vendas/catalogo' },
  { label: 'Meus Orçamentos', icon: FileText, path: '/vendas/meus-orcamentos' },
  { label: 'Meus Parceiros', icon: Handshake, path: '/vendas/meus-parceiros' },
];

export default function VendasHub() {
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
        className="absolute top-6 left-6 z-20 p-3 rounded-lg bg-white/5 hover:bg-white/10 
                   border border-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s ease 100ms'
        }}
      >
        <ArrowLeft className="w-5 h-5 text-white/80" />
      </button>

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

        {/* Título */}
        <h1 
          className="text-2xl font-bold text-white mb-6 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.5s ease 200ms'
          }}
        >
          Vendas
        </h1>

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
      <div className="hidden md:flex relative z-10 flex-col items-center">
        {/* Logo central */}
        <div 
          className="mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full animate-pulse" />
            <img 
              src={logoEmpresa} 
              alt="Logo" 
              className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl" 
            />
          </div>
        </div>

        {/* Título */}
        <h1 
          className="text-3xl font-bold text-white mb-10"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.5s ease 200ms'
          }}
        >
          Vendas
        </h1>

        {/* Grid de botões */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 200 + index * 100;
            
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="group w-44 h-32 rounded-xl
                           bg-gradient-to-br from-blue-500/20 to-blue-700/20
                           hover:from-blue-500/40 hover:to-blue-700/40
                           active:scale-[0.98]
                           flex flex-col items-center justify-center gap-3
                           text-white font-medium 
                           shadow-lg shadow-blue-500/10
                           border border-blue-400/20 hover:border-blue-400/40
                           backdrop-blur-sm
                           transition-all duration-300"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <div className="p-3 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
