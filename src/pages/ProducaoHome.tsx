import { useNavigate } from "react-router-dom";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Hammer, Package, CheckSquare, Truck, Boxes,
  ClipboardCheck, Paintbrush, PackageCheck, Wrench,
  Building2, History, Rows3, ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Botao {
  label: string;
  icon: LucideIcon;
  path: string;
  countKey?: string;
  routeKey: string;
}

const BOTOES: Botao[] = [
  { label: "Solda", icon: Hammer, path: "/producao/solda", countKey: "solda", routeKey: "producao_solda" },
  { label: "Perfiladeira", icon: Rows3, path: "/producao/perfiladeira", countKey: "perfiladeira", routeKey: "producao_perfiladeira" },
  { label: "Separação", icon: Package, path: "/producao/separacao", countKey: "separacao", routeKey: "producao_separacao" },
  { label: "Qualidade", icon: CheckSquare, path: "/producao/qualidade", countKey: "qualidade", routeKey: "producao_qualidade" },
  { label: "Pintura", icon: Paintbrush, path: "/producao/pintura", countKey: "pintura", routeKey: "producao_pintura" },
  { label: "Embalagem", icon: PackageCheck, path: "/producao/embalagem", countKey: "embalagem", routeKey: "producao_embalagem" },
  { label: "Carregamento", icon: Truck, path: "/producao/carregamento", countKey: "carregamento", routeKey: "producao_carregamento" },
  { label: "Instalações", icon: Wrench, path: "/producao/instalacoes", routeKey: "producao_instalacoes" },
  { label: "Terceirização", icon: Building2, path: "/producao/terceirizacao", routeKey: "producao_terceirizacao" },
  { label: "Estoque", icon: ClipboardCheck, path: "/producao/conferencia-estoque", routeKey: "producao_conferencia_estoque" },
  { label: "Almoxarifado", icon: Boxes, path: "/producao/conferencia-almox", routeKey: "producao_conferencia_almox" },
  { label: "Gestão de Pedidos", icon: ClipboardList, path: "/producao/gestao-pedidos", routeKey: "producao_gestao_pedidos" },
];

const ADMIN_ROLES = ['administrador', 'admin'];

export default function ProducaoHome() {
  const navigate = useNavigate();
  const { data: ordensCount } = useOrdensCount();
  const { user } = useProducaoAuth();

  const isAdmin = user?.role ? ADMIN_ROLES.includes(user.role) : false;

  const { data: accessibleKeys = [] } = useQuery({
    queryKey: ['producao-home-access', user?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_route_access' as any)
        .select('route_key')
        .eq('user_id', user!.user_id)
        .eq('can_access', true)
        .like('route_key', 'producao_%');
      return (data as any[])?.map((r: any) => r.route_key) || [];
    },
    enabled: !!user?.user_id && !isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const botoesVisiveis = isAdmin
    ? BOTOES
    : BOTOES.filter(btn => accessibleKeys.includes(btn.routeKey));

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
          {botoesVisiveis.map((btn) => {
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
