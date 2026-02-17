import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MapPin, Calendar, Users, DoorOpen } from "lucide-react";
import type { MetaInstalacao } from "@/hooks/useMetasInstalacao";

interface InstalacoesDaMetaModalProps {
  meta: MetaInstalacao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InstalacaoUnificada {
  id: string;
  nome_cliente: string;
  cidade?: string | null;
  estado?: string | null;
  data_conclusao: string | null;
  equipe_nome?: string | null;
  autorizado_nome?: string | null;
  tipo_responsavel?: string | null;
  origem: 'neo' | 'pedido';
  tamanho?: 'P' | 'G' | 'GG' | null;
}

function classificarTamanho(metragem: number | null | undefined): 'P' | 'G' | 'GG' | null {
  if (metragem == null || metragem === 0) return null;
  if (metragem < 25) return 'P';
  if (metragem <= 50) return 'G';
  return 'GG';
}

export function InstalacoesDaMetaModal({ meta, open, onOpenChange }: InstalacoesDaMetaModalProps) {
  const { data: instalacoes = [], isLoading } = useQuery({
    queryKey: ["instalacoes-da-meta", meta.id],
    enabled: open,
    queryFn: async () => {
      // 1. Buscar neo_instalacoes
      let neoQuery = supabase
        .from("neo_instalacoes" as any)
        .select("id, nome_cliente, cidade, estado, concluida_em, equipe_nome, autorizado_nome, tipo_responsavel")
        .eq("concluida", true)
        .gte("concluida_em", meta.data_inicio)
        .lte("concluida_em", meta.data_termino + "T23:59:59")
        .order("concluida_em", { ascending: false });

      if (meta.tipo === "equipe") {
        neoQuery = neoQuery.eq("equipe_id", meta.referencia_id);
      }

      // 2. Buscar instalacoes (pedidos)
      let pedidoQuery = supabase
        .from("instalacoes" as any)
        .select("id, nome_cliente, cidade, estado, instalacao_concluida_em, responsavel_instalacao_nome, pedido_id")
        .eq("instalacao_concluida", true)
        .not("pedido_id", "is", null)
        .gte("instalacao_concluida_em", meta.data_inicio)
        .lte("instalacao_concluida_em", meta.data_termino + "T23:59:59")
        .order("instalacao_concluida_em", { ascending: false });

      if (meta.tipo === "equipe") {
        pedidoQuery = pedidoQuery.eq("responsavel_instalacao_id", meta.referencia_id);
      }

      const [neoRes, pedidoRes] = await Promise.all([neoQuery, pedidoQuery]);

      if (neoRes.error) throw neoRes.error;
      if (pedidoRes.error) throw pedidoRes.error;

      const pedidoData = (pedidoRes.data || []) as any[];

      // 3. Buscar metragem das ordens de pintura para os pedidos
      const pedidoIds = pedidoData
        .map((p: any) => p.pedido_id)
        .filter(Boolean) as string[];

      let metragensMap: Record<string, number> = {};

      if (pedidoIds.length > 0) {
        const { data: ordens } = await supabase
          .from("ordens_pintura" as any)
          .select("pedido_id, metragem_quadrada")
          .in("pedido_id", pedidoIds);

        if (ordens) {
          for (const o of ordens as any[]) {
            if (o.metragem_quadrada) {
              metragensMap[o.pedido_id] = (metragensMap[o.pedido_id] || 0) + o.metragem_quadrada;
            }
          }
        }
      }

      const neoItems: InstalacaoUnificada[] = ((neoRes.data || []) as any[]).map((inst) => ({
        id: inst.id,
        nome_cliente: inst.nome_cliente,
        cidade: inst.cidade,
        estado: inst.estado,
        data_conclusao: inst.concluida_em,
        equipe_nome: inst.equipe_nome,
        autorizado_nome: inst.autorizado_nome,
        tipo_responsavel: inst.tipo_responsavel,
        origem: 'neo' as const,
        tamanho: null,
      }));

      const pedidoItems: InstalacaoUnificada[] = pedidoData.map((inst: any) => ({
        id: inst.id,
        nome_cliente: inst.nome_cliente,
        cidade: inst.cidade,
        estado: inst.estado,
        data_conclusao: inst.instalacao_concluida_em,
        equipe_nome: inst.responsavel_instalacao_nome,
        autorizado_nome: null,
        tipo_responsavel: null,
        origem: 'pedido' as const,
        tamanho: classificarTamanho(metragensMap[inst.pedido_id]),
      }));

      const combined = [...neoItems, ...pedidoItems].sort((a, b) => {
        const da = a.data_conclusao || '';
        const db = b.data_conclusao || '';
        return db.localeCompare(da);
      });

      return combined;
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-primary" />
            Instalações da Meta
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">Progresso:</span>{" "}
            <span className="font-semibold text-foreground">{instalacoes.length} / {meta.quantidade_portas} portas</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {format(new Date(meta.data_inicio + "T00:00:00"), "dd/MM")} — {format(new Date(meta.data_termino + "T00:00:00"), "dd/MM")}
          </Badge>
        </div>

        <ScrollArea className="max-h-[55vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : instalacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma instalação concluída neste período.</p>
          ) : (
            <div className="space-y-2 pr-2">
              {instalacoes.map((inst) => (
                <div key={inst.id} className="p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-foreground truncate">{inst.nome_cliente}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {inst.tamanho && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {inst.tamanho}
                        </Badge>
                      )}
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${
                          inst.origem === 'neo'
                            ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400'
                            : 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400'
                        }`}
                        variant="outline"
                      >
                        {inst.origem === 'neo' ? 'Neo' : 'Pedido'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {inst.cidade && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {inst.cidade}/{inst.estado}
                      </span>
                    )}
                    {inst.data_conclusao && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(inst.data_conclusao), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                  {(inst.equipe_nome || inst.autorizado_nome) && (
                    <div className="mt-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        <Users className="h-3 w-3 mr-1" />
                        {inst.tipo_responsavel === "autorizado" ? inst.autorizado_nome : inst.equipe_nome}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
