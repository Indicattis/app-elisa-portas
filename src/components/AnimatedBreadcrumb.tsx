import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface AnimatedBreadcrumbProps {
  items: BreadcrumbItem[];
  mounted?: boolean;
}

export function AnimatedBreadcrumb({ items, mounted = true }: AnimatedBreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40
                 flex items-center gap-1 px-2 py-1.5
                 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted 
          ? 'translateX(-50%) translateY(0) scale(1)' 
          : 'translateX(-50%) translateY(-20px) scale(0.95)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms'
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = !isLast && item.path;

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-white/30 mx-1" />
            )}
            
            {isLast ? (
              // Página atual - fundo azul
              <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 
                             text-white text-sm font-medium shadow-lg shadow-blue-500/20">
                {item.label}
              </span>
            ) : (
              // Páginas anteriores - fundo transparente
              <button
                onClick={() => isClickable && navigate(item.path!)}
                className={`px-4 py-1.5 rounded-full bg-transparent text-white/60 
                           text-sm font-medium transition-all duration-200
                           ${isClickable ? 'hover:text-white hover:bg-white/10 cursor-pointer' : 'cursor-default'}`}
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
