import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SpaceParticles } from './SpaceParticles';

interface MinimalistLayoutProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

export function MinimalistLayout({ 
  title, 
  subtitle, 
  backPath = '/vendas', 
  children,
  headerActions 
}: MinimalistLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Partículas espaciais de fundo */}
      <SpaceParticles />
      
      {/* Container principal */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header minimalista */}
        <header className="sticky top-0 z-20 px-4 py-4 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(backPath)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-white/60">{subtitle}</p>
                )}
              </div>
            </div>
            
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </header>
        
        {/* Conteúdo */}
        <main className="flex-1 px-4 py-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
