import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Lock, ArrowLeft, Home } from 'lucide-react';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';

export default function Forbidden() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Acesso Negado" }
        ]} 
        mounted={mounted} 
      />

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
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-col items-center px-6 py-10 w-full max-w-md">
        {/* Ícone de cadeado */}
        <div 
          className="mb-8 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.8)'
          }}
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <Lock className="w-14 h-14 text-red-400" strokeWidth={1.5} />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl -z-10" />
          </div>
        </div>

        {/* Título e descrição */}
        <div 
          className="text-center mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms'
          }}
        >
          <h1 className="text-2xl font-semibold text-white mb-3">Acesso Negado</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Você não tem permissão para acessar esta página.
            <br />
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>

        {/* Botão de retorno */}
        <div 
          className="w-full"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms'
          }}
        >
          <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <button
              onClick={() => navigate('/home')}
              className="w-full h-12 rounded-lg
                         flex items-center justify-center gap-3
                         font-medium border transition-all duration-300
                         bg-gradient-to-r from-blue-500 to-blue-700 
                         hover:from-blue-400 hover:to-blue-600 
                         text-white shadow-lg shadow-blue-500/20 
                         border-blue-400/30 cursor-pointer"
            >
              <Home className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium">Voltar para Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
