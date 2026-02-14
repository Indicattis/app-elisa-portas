import { useNavigate } from "react-router-dom";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Hammer, Package, CheckSquare, Truck, Boxes,
  ClipboardCheck, Paintbrush, PackageCheck, Wrench,
  Building2, History, Rows3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Botao {
  label: string;
  icon: LucideIcon;
  path: string;
  countKey?: string;
}

const BOTOES: Botao[] = [
  { label: "Solda", icon: Hammer, path: "/producao/solda", countKey: "solda" },
  { label: "Perfiladeira", icon: Rows3, path: "/producao/perfiladeira", countKey: "perfiladeira" },
  { label: "Separação", icon: Package, path: "/producao/separacao", countKey: "separacao" },
  { label: "Qualidade", icon: CheckSquare, path: "/producao/qualidade", countKey: "qualidade" },
  { label: "Pintura", icon: Paintbrush, path: "/producao/pintura", countKey: "pintura" },
  { label: "Embalagem", icon: PackageCheck, path: "/producao/embalagem", countKey: "embalagem" },
  { label: "Carregamento", icon: Truck, path: "/producao/carregamento", countKey: "carregamento" },
  { label: "Instalações", icon: Wrench, path: "/producao/instalacoes" },
  { label: "Terceirização", icon: Building2, path: "/producao/terceirizacao" },
  { label: "Estoque", icon: ClipboardCheck, path: "/producao/conferencia-estoque" },
  { label: "Almoxarifado", icon: Boxes, path: "/producao/conferencia-almox" },
];

export default function ProducaoHome() {
  const navigate = useNavigate();
  const { data: ordensCount } = useOrdensCount();

  const getCount = (key?: string) => {
    if (!key || !ordensCount) return 0;
    return (ordensCount as Record<string, number>)[key] || 0;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produção</h1>
            <p className="text-sm text-white/50">Acesse os painéis de produção</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/producao/meu-historico')}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <History className="h-4 w-4 mr-2" />
            Meu Histórico
          </Button>
        </div>

        {/* Grid de botões */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {BOTOES.map((btn) => {
            const Icon = btn.icon;
            const count = getCount(btn.countKey);
            return (
              <button
                key={btn.path}
                onClick={() => navigate(btn.path)}
                className="group relative flex flex-col items-center gap-3 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-blue-500/30 transition-all duration-200"
              >
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-white/90 group-hover:text-white">
                  {btn.label}
                </span>
                {count > 0 && (
                  <Badge className="absolute top-2 right-2 bg-blue-500/80 text-white text-[10px] px-1.5 py-0.5 min-w-[20px] justify-center">
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
