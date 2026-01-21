import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpaceParticles } from './SpaceParticles';
import { AnimatedBreadcrumb, BreadcrumbItem } from './AnimatedBreadcrumb';

interface MinimalistLayoutProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  showParticles?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
}

export function MinimalistLayout({ 
  title, 
  subtitle, 
  backPath = '/vendas', 
  children,
  headerActions,
  showParticles = false,
  breadcrumbItems
}: MinimalistLayoutProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Breadcrumb animado */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <AnimatedBreadcrumb items={breadcrumbItems} mounted={mounted} />
      )}

      {/* Partículas espaciais de fundo - apenas se showParticles = true */}
      {showParticles && <SpaceParticles />}
      
      {/* Container principal */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header minimalista */}
        <header className="sticky top-0 z-20 px-4 py-4 bg-black/80 backdrop-blur-md border-b border-primary/10 mt-14">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
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
