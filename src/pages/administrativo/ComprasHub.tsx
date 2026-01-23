import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Truck, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { FloatingProfileMenu } from '@/components/FloatingProfileMenu';
import { ArrowLeft } from 'lucide-react';

const menuItems = [
  { label: "Estoque", icon: Package, path: "/administrativo/compras/estoque", ativo: true },
  { label: "Requisições", icon: FileText, path: "/administrativo/compras/requisicoes", ativo: true },
  { label: "Fornecedores", icon: Truck, path: "/administrativo/compras/fornecedores", ativo: true },
];

export default function ComprasHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = (item: typeof menuItems[0]) => {
    if (item.ativo) {
      navigate(item.path);
    } else {
      toast({
        title: "Em breve",
        description: `A seção "${item.label}" estará disponível em breve.`,
      });
    }
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Administrativo', path: '/administrativo' },
    { label: 'Compras' }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Breadcrumb animado */}
      <AnimatedBreadcrumb items={breadcrumbItems} mounted={mounted} />

      {/* Menu flutuante de perfil */}
      <FloatingProfileMenu />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/administrativo')}
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

      {/* Conteúdo principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Título */}
        <div 
          className="text-center mb-12"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms'
          }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Compras & Suprimentos</h1>
          <p className="text-white/60">Gestão de estoque, requisições e fornecedores</p>
        </div>

        {/* Menu Mobile - Lista Vertical */}
        <div className="md:hidden w-full max-w-sm space-y-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isDisabled = !item.ativo;
            
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item)}
                disabled={isDisabled}
                className={`w-full p-1.5 rounded-xl backdrop-blur-xl border transition-all duration-300
                  ${isDisabled 
                    ? 'bg-zinc-800/50 border-zinc-700/50 cursor-not-allowed' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${300 + index * 100}ms`
                }}
              >
                <div className="flex items-center gap-4 p-4 rounded-lg">
                  <div className={`p-3 rounded-lg shadow-lg
                    ${isDisabled 
                      ? 'bg-zinc-700 text-zinc-500' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-500/20'
                    }`}
                  >
                    {isDisabled ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-lg font-medium ${isDisabled ? 'text-zinc-500' : 'text-white'}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Menu Desktop - Grid 3 colunas */}
        <div className="hidden md:grid grid-cols-3 gap-6 max-w-4xl">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isDisabled = !item.ativo;
            
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item)}
                disabled={isDisabled}
                className={`group p-1.5 rounded-xl backdrop-blur-xl border transition-all duration-300
                  ${isDisabled 
                    ? 'bg-zinc-800/50 border-zinc-700/50 cursor-not-allowed' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                  }`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${300 + index * 100}ms`
                }}
              >
                <div className="flex flex-col items-center gap-4 p-8 rounded-lg">
                  <div className={`p-4 rounded-xl shadow-lg transition-all duration-300
                    ${isDisabled 
                      ? 'bg-zinc-700 text-zinc-500' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-500/20 group-hover:shadow-blue-500/40'
                    }`}
                  >
                    {isDisabled ? <Lock className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                  </div>
                  <span className={`text-lg font-medium ${isDisabled ? 'text-zinc-500' : 'text-white'}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
