import { useEffect, useState } from "react";
import { X, Trophy, Calendar, DollarSign, Flame, Ruler, Package, CheckCircle, Paintbrush, Truck } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { MetaProgressoInfo } from "@/hooks/useMetaProgresso";
import { cn } from "@/lib/utils";

interface MetaProgressoFlutuanteProps {
  metaInfo: MetaProgressoInfo | null;
  visible: boolean;
  onClose: () => void;
}

const getIconeMeta = (tipo: string) => {
  switch (tipo) {
    case 'solda': return Flame;
    case 'perfiladeira': return Ruler;
    case 'separacao': return Package;
    case 'qualidade': return CheckCircle;
    case 'pintura': return Paintbrush;
    case 'carregamento': return Truck;
    default: return Trophy;
  }
};

const getCorMeta = (tipo: string) => {
  switch (tipo) {
    case 'solda': return { bg: 'bg-orange-500/20', text: 'text-orange-400', progress: 'bg-orange-500' };
    case 'perfiladeira': return { bg: 'bg-blue-500/20', text: 'text-blue-400', progress: 'bg-blue-500' };
    case 'separacao': return { bg: 'bg-purple-500/20', text: 'text-purple-400', progress: 'bg-purple-500' };
    case 'qualidade': return { bg: 'bg-green-500/20', text: 'text-green-400', progress: 'bg-green-500' };
    case 'pintura': return { bg: 'bg-pink-500/20', text: 'text-pink-400', progress: 'bg-pink-500' };
    case 'carregamento': return { bg: 'bg-amber-500/20', text: 'text-amber-400', progress: 'bg-amber-500' };
    default: return { bg: 'bg-primary/20', text: 'text-primary', progress: 'bg-primary' };
  }
};

const getNomeMeta = (tipo: string) => {
  switch (tipo) {
    case 'solda': return 'Solda';
    case 'perfiladeira': return 'Perfiladeira';
    case 'separacao': return 'Separação';
    case 'qualidade': return 'Qualidade';
    case 'pintura': return 'Pintura';
    case 'carregamento': return 'Expedição';
    default: return tipo;
  }
};

const getUnidadeMeta = (tipo: string): string => {
  switch (tipo) {
    case 'solda': return 'portas';
    case 'perfiladeira': return 'm';
    case 'separacao': return 'itens';
    case 'qualidade': return 'pedidos';
    case 'pintura': return 'm²';
    case 'carregamento': return 'pedidos';
    default: return '';
  }
};

export function MetaProgressoFlutuante({ metaInfo, visible, onClose }: MetaProgressoFlutuanteProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!metaInfo || !isAnimating) return null;

  const { meta, progressoAtual, porcentagem } = metaInfo;
  const Icone = getIconeMeta(meta.tipo_meta);
  const cores = getCorMeta(meta.tipo_meta);
  const unidade = getUnidadeMeta(meta.tipo_meta);
  const nome = getNomeMeta(meta.tipo_meta);

  const formatValor = (valor: number) => {
    if (meta.tipo_meta === 'perfiladeira' || meta.tipo_meta === 'pintura') {
      return valor.toFixed(1);
    }
    return Math.round(valor).toString();
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl transition-all duration-300",
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between p-4 rounded-t-xl", cores.bg)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", cores.bg)}>
            <Icone className={cn("h-5 w-5", cores.text)} />
          </div>
          <div>
            <h4 className="font-semibold text-white">Meta de {nome}</h4>
            <p className="text-xs text-white/60">+1 ordem concluída!</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4 text-white/60" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">Progresso</span>
            <span className="font-semibold text-white">
              {formatValor(progressoAtual)} / {formatValor(meta.valor_meta)} {unidade}
            </span>
          </div>
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", cores.progress)}
              style={{ width: `${porcentagem}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-medium", cores.text)}>
              {porcentagem.toFixed(0)}% concluído
            </span>
            {porcentagem >= 100 && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Trophy className="h-3 w-3" />
                Meta atingida!
              </span>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-white/60">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">
              R$ {meta.recompensa_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(new Date(meta.data_inicio), "dd/MM")} - {format(new Date(meta.data_termino), "dd/MM")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
