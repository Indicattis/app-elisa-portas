import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, ShieldCheck, Factory, ClipboardCheck, Paintbrush, Package, HardHat, AlertTriangle, CheckCircle2, Cog, Flame, Truck, UserCheck, Hourglass, Circle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePedidosEtapas, usePedidosContadores } from "@/hooks/usePedidosEtapas";
import { useNeoInstalacoesListagem } from "@/hooks/useNeoInstalacoes";
import { useNeoCorrecoesListagem } from "@/hooks/useNeoCorrecoes";
import { usePortasPorEtapa } from "@/hooks/usePortasPorEtapa";
import { useDesempenhoEtapas, type DesempenhoColaborador } from "@/hooks/useDesempenhoEtapas";
import { PedidoDetalhesSheet } from "@/components/pedidos/PedidoDetalhesSheet";
import { CronometroEtapaBadge } from "@/components/pedidos/CronometroEtapaBadge";
import { ORDEM_ETAPAS, ETAPAS_CONFIG } from "@/types/pedidoEtapa";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { cn } from "@/lib/utils";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ETAPA_ICONS: Record<string, React.ElementType> = {
  aprovacao_diretor: UserCheck,
  aberto: Clock,
  aprovacao_ceo: ShieldCheck,
  em_producao: Factory,
  inspecao_qualidade: ClipboardCheck,
  aguardando_pintura: Paintbrush,
  embalagem: Package,
  aguardando_coleta: Package,
  instalacoes: HardHat,
  correcoes: AlertTriangle,
  finalizado: CheckCircle2,
  aguardando_cliente: Hourglass,
};

type Periodo = 'hoje' | 'semana' | 'mes';

function getDateRange(periodo: Periodo) {
  const hoje = new Date();
  const hojeFmt = format(hoje, 'yyyy-MM-dd');
  if (periodo === 'hoje') return { inicio: hojeFmt, fim: hojeFmt };
  if (periodo === 'semana') return { inicio: format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'), fim: hojeFmt };
  return { inicio: format(startOfMonth(hoje), 'yyyy-MM-dd'), fim: hojeFmt };
}

const DESEMPENHO_CARDS = [
  { label: 'Perfiladas', icon: Cog, field: 'metros_perfilados' as const, rankField: 'perfiladas_metros' as const, unit: 'm' },
  { label: 'Soldadas', icon: Flame, field: 'portas_soldadas' as const, rankField: 'soldadas' as const, unit: '' },
  { label: 'Separadas', icon: Package, field: 'pedidos_separados' as const, rankField: 'separadas' as const, unit: '' },
  { label: 'Pintura', icon: Paintbrush, field: 'pintura_m2' as const, rankField: 'pintura_m2' as const, unit: 'm²' },
  { label: 'Carregamentos', icon: Truck, field: 'carregamentos' as const, rankField: 'carregamentos' as const, unit: '' },
];

// ─── Performance Section ───────────────────────────────────────────

function DesempenhoMobileSection() {
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const { inicio, fim } = getDateRange(periodo);
  const { data: portas, isLoading: loadingPortas } = usePortasPorEtapa(inicio, fim);
  const { data: colaboradores = [], isLoading: loadingColab } = useDesempenhoEtapas(inicio, fim);
  const [perfRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });

  return (
    <div className="px-3 pt-3 pb-2">
      {/* Period selector */}
      <div className="flex items-center gap-1 mb-2">
        {(['hoje', 'semana', 'mes'] as Periodo[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              periodo === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {/* Performance carousel */}
      <div ref={perfRef} className="overflow-hidden">
        <div className="flex gap-2">
          {DESEMPENHO_CARDS.map(card => {
            const valor = portas?.[card.field] ?? 0;
            const topColab = colaboradores
              .filter(c => c[card.rankField] > 0)
              .sort((a, b) => b[card.rankField] - a[card.rankField])[0];

            return (
              <div
                key={card.field}
                className="min-w-0 shrink-0 basis-[60%] rounded-lg border border-border/50 bg-card/50 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {loadingPortas ? '...' : (
                    card.unit === 'm' || card.unit === 'm²'
                      ? `${Number(valor).toFixed(1).replace('.', ',')}${card.unit}`
                      : valor
                  )}
                </div>
                {!loadingColab && topColab && (
                  <div className="text-[10px] text-muted-foreground mt-1 truncate">
                    🏆 {topColab.nome.split(' ')[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stage Pills ───────────────────────────────────────────────────

function EtapaPills({
  etapaAtiva,
  contadores,
  onTap,
}: {
  etapaAtiva: EtapaPedido;
  contadores: Record<string, number>;
  onTap: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = ORDEM_ETAPAS.indexOf(etapaAtiva);
    const el = scrollRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [etapaAtiva]);

  return (
    <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none">
      {ORDEM_ETAPAS.map((etapa, i) => {
        const Icon = ETAPA_ICONS[etapa] || Circle;
        const count = contadores[etapa] || 0;
        const isActive = etapa === etapaAtiva;
        return (
          <button
            key={etapa}
            onClick={() => onTap(i)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{ETAPAS_CONFIG[etapa].label.split(' ').slice(0, 2).join(' ')}</span>
            <Badge variant="secondary" className={cn(
              "px-1.5 py-0 text-[10px] h-4",
              isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {count}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────

function PedidoCardMobile({ pedido, onClick }: { pedido: any; onClick: () => void }) {
  const venda = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
  const clienteNome = venda?.cliente_nome || 'Sem cliente';
  const cidade = venda?.cliente_cidade || '';
  const estado = venda?.cliente_estado || '';
  const etapaAtual = pedido.pedidos_etapas?.find((e: any) => e.etapa === pedido.etapa_atual);

  // Extract unique colors from products
  const cores: { nome: string; hex: string | null }[] = [];
  const produtos = venda?.produtos_vendas || [];
  const coresVistas = new Set<string>();
  produtos.forEach((p: any) => {
    const corNome = p.cor?.nome;
    if (corNome && !coresVistas.has(corNome)) {
      coresVistas.add(corNome);
      cores.push({ nome: corNome, hex: p.cor?.codigo_hex || null });
    }
  });
  const semCor = cores.length === 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card/30 border border-border/30 hover:bg-card/60 active:bg-card/80 transition-colors text-left"
    >
      {/* Color indicators */}
      <div className="flex items-center gap-0.5 shrink-0">
        {semCor ? (
          <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">Galv.</span>
        ) : (
          cores.slice(0, 3).map((cor, i) => (
            <div
              key={i}
              className="h-4 w-4 rounded-full border border-border/50"
              style={{ backgroundColor: cor.hex || '#888' }}
              title={cor.nome}
            />
          ))
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{clienteNome}</p>
        {cidade && (
          <p className="text-[10px] text-muted-foreground truncate">{cidade}{estado ? ` - ${estado}` : ''}</p>
        )}
      </div>
      <CronometroEtapaBadge dataEntrada={etapaAtual?.data_entrada} compact etapa={pedido.etapa_atual} />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export function GestaoFabricaMobile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const contadores = usePedidosContadores();
  const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>('aberto');
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  const { neoInstalacoes } = useNeoInstalacoesListagem();
  const { neoCorrecoes } = useNeoCorrecoesListagem();

  const { pedidos, isLoading } = usePedidosEtapas(etapaAtiva);

  // Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: false });

  // Sync carousel → active stage
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setEtapaAtiva(ORDEM_ETAPAS[index]);
    };
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // Pill tap → scroll carousel
  const scrollToIndex = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
    queryClient.invalidateQueries({ queryKey: ['neo_instalacoes_listagem'] });
    queryClient.invalidateQueries({ queryKey: ['neo_correcoes_listagem'] });
    toast({ title: "Atualizado" });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-60px)] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h1 className="text-lg font-semibold text-foreground">Gestão de Fábrica</h1>
        <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Performance */}
      <DesempenhoMobileSection />

      {/* Stage pills */}
      <EtapaPills etapaAtiva={etapaAtiva} contadores={contadores} onTap={scrollToIndex} />

      {/* Stage carousel */}
      <div className="flex-1 min-h-0" ref={emblaRef}>
        <div className="flex h-full">
          {ORDEM_ETAPAS.map(etapa => (
            <EtapaSlide
              key={etapa}
              etapa={etapa}
              isActive={etapa === etapaAtiva}
              pedidos={etapa === etapaAtiva ? pedidos : []}
              isLoading={etapa === etapaAtiva && isLoading}
              neoInstalacoes={etapa === 'instalacoes' ? neoInstalacoes : []}
              neoCorrecoes={etapa === 'correcoes' ? neoCorrecoes : []}
              onSelectPedido={setSelectedPedido}
            />
          ))}
        </div>
      </div>

      {/* Downbar */}
      {selectedPedido && (
        <PedidoDetalhesSheet
          pedido={selectedPedido}
          open={!!selectedPedido}
          onOpenChange={(open) => !open && setSelectedPedido(null)}
        />
      )}
    </div>
  );
}

// ─── Slide ─────────────────────────────────────────────────────────

function EtapaSlide({
  etapa,
  isActive,
  pedidos,
  isLoading,
  neoInstalacoes,
  neoCorrecoes,
  onSelectPedido,
}: {
  etapa: EtapaPedido;
  isActive: boolean;
  pedidos: any[];
  isLoading: boolean;
  neoInstalacoes: any[];
  neoCorrecoes: any[];
  onSelectPedido: (p: any) => void;
}) {
  return (
    <div className="min-w-0 shrink-0 grow-0 basis-full px-3 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : (
        <div className="space-y-1.5 pb-4">
          {/* Neo instalações */}
          {neoInstalacoes.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Instalações Avulsas ({neoInstalacoes.length})
              </p>
              {neoInstalacoes.map((neo: any) => (
                <div key={neo.id} className="px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-sm text-foreground mb-1">
                  {neo.cliente_nome || 'Instalação avulsa'} — {neo.cidade || ''}
                </div>
              ))}
            </div>
          )}

          {/* Neo correções */}
          {neoCorrecoes.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Correções Avulsas ({neoCorrecoes.length})
              </p>
              {neoCorrecoes.map((neo: any) => (
                <div key={neo.id} className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-foreground mb-1">
                  {neo.cliente_nome || 'Correção avulsa'} — {neo.cidade || ''}
                </div>
              ))}
            </div>
          )}

          {/* Pedidos */}
          {pedidos.length === 0 && neoInstalacoes.length === 0 && neoCorrecoes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Nenhum pedido nesta etapa
            </div>
          ) : (
            pedidos.map((pedido: any) => (
              <PedidoCardMobile
                key={pedido.id}
                pedido={pedido}
                onClick={() => onSelectPedido(pedido)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
