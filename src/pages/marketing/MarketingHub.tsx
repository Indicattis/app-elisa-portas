import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Database, DollarSign, Lock, ArrowLeft, Image, Users, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { FloatingProfileMenu } from '@/components/FloatingProfileMenu';
import { DelayedParticles } from '@/components/DelayedParticles';

const menuItems = [
  { label: "Performance", icon: TrendingUp, path: "/marketing/performance", ativo: true },
  { label: "Canais de Aquisição", icon: Database, path: "/marketing/canais-aquisicao", ativo: true },
  { label: "Investimentos", icon: DollarSign, path: "/marketing/investimentos", ativo: true },
  { label: "Mídias", icon: Image, path: "/marketing/midias", ativo: true },
  { label: "LTV", icon: Users, path: "/marketing/ltv", ativo: true },
  { label: "Conversões", icon: Copy, path: "/marketing/conversoes", ativo: true },
];

export default function MarketingHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = (item: typeof menuItems[0]) => {
    if (item.ativo) {
      navigate(item.path);
    } else {
      toast({
        title: "Em desenvolvimento",
        description: `A funcionalidade "${item.label}" está em desenvolvimento.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animação de partículas com fade-in */}
      <DelayedParticles />
      
      {/* Breadcrumb animado */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Marketing" }
        ]} 
        mounted={mounted} 
      />

      {/* Profile Menu */}
      <FloatingProfileMenu mounted={mounted} />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/home')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      {/* Conteúdo centralizado */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-10">
        {/* Título */}
        <div 
          className="mb-8 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">Marketing</h1>
          <p className="text-white/60 text-sm">Análise de performance e métricas</p>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full max-w-md flex flex-col gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <div
                key={item.label}
                className={`p-1.5 rounded-xl backdrop-blur-xl border transition-all
                           ${item.ativo 
                             ? 'bg-white/5 border-white/10' 
                             : 'bg-white/[0.02] border-white/5'}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <button
                  onClick={() => handleClick(item)}
                  disabled={!item.ativo}
                  className={`w-full h-12 rounded-lg
                             flex items-center gap-4 px-5
                             font-medium border transition-all
                             ${item.ativo 
                               ? 'bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30 text-white cursor-pointer hover:from-blue-400 hover:to-blue-600'
                               : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500 cursor-not-allowed'
                             }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${!item.ativo ? 'opacity-50' : ''}`} strokeWidth={1.5} />
                    {!item.ativo && (
                      <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-zinc-400" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${!item.ativo ? 'opacity-60' : ''}`}>{item.label}</span>
                  {!item.ativo && (
                    <Lock className="w-4 h-4 ml-auto text-zinc-500" strokeWidth={2} />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop Layout - Grid 3 colunas */}
        <div className="hidden md:flex gap-4 w-full max-w-3xl justify-center">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const delay = 100 + index * 80;
            
            return (
              <div
                key={item.label}
                className={`p-1.5 rounded-xl backdrop-blur-xl border transition-all flex-1 max-w-[200px]
                           ${item.ativo 
                             ? 'bg-white/5 border-white/10' 
                             : 'bg-white/[0.02] border-white/5'}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                }}
              >
                <button
                  onClick={() => handleClick(item)}
                  disabled={!item.ativo}
                  className={`w-full h-28 rounded-lg
                             flex flex-col items-center justify-center gap-3
                             font-medium border transition-all
                             ${item.ativo 
                               ? 'bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30 text-white cursor-pointer hover:from-blue-400 hover:to-blue-600'
                               : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500 cursor-not-allowed'
                             }`}
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${!item.ativo ? 'opacity-50' : ''}`} strokeWidth={1.5} />
                    {!item.ativo && (
                      <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-zinc-400" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${!item.ativo ? 'opacity-60' : ''}`}>{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
