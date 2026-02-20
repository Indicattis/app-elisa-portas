import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLinhasOrdem } from "@/hooks/useLinhasOrdem";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, Calendar, Clock, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemInfo {
  id: string;
  numero_ordem: string;
  setor: string;
  pedido_id: string;
  tempo_conclusao_segundos: number | null;
  data_conclusao: string;
  cliente_nome?: string;
}

interface HistoricoOrdemDetalhesSheetProps {
  ordem: OrdemInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SETOR_LABELS: Record<string, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
};

const SETOR_COLORS: Record<string, string> = {
  soldagem: 'bg-orange-500',
  perfiladeira: 'bg-blue-500',
  separacao: 'bg-green-500',
  qualidade: 'bg-purple-500',
  pintura: 'bg-yellow-500',
};

function formatTempo(segundos: number | null): string {
  if (!segundos) return '-';
  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  if (minutos < 60) return `${minutos}min ${segs}s`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas}h ${mins}min`;
}

export function HistoricoOrdemDetalhesSheet({ ordem, open, onOpenChange }: HistoricoOrdemDetalhesSheetProps) {
  const { data: pedido, isLoading: loadingPedido } = useQuery({
    queryKey: ['pedido-detalhes-historico', ordem?.pedido_id],
    queryFn: async () => {
      if (!ordem?.pedido_id) return null;
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select('numero_pedido, cliente_nome, cliente_telefone, data_entrega, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, observacoes')
        .eq('id', ordem.pedido_id)
        .maybeSingle();
      if (error) { console.error('Erro ao buscar pedido:', error); return null; }
      return data;
    },
    enabled: !!ordem?.pedido_id && open,
  });

  const { data: linhas = [], isLoading: loadingLinhas } = useLinhasOrdem(
    ordem?.id ?? null,
    ordem?.setor ?? null
  );

  if (!ordem) return null;

  const endereco = pedido
    ? [pedido.endereco_rua, pedido.endereco_numero, pedido.endereco_bairro, pedido.endereco_cidade]
        .filter(Boolean).join(', ')
    : '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            <span>#{ordem.numero_ordem}</span>
            <Badge className={`${SETOR_COLORS[ordem.setor]} text-white text-xs`}>
              {SETOR_LABELS[ordem.setor]}
            </Badge>
          </SheetTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(ordem.data_conclusao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {ordem.tempo_conclusao_segundos && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <Clock className="h-3.5 w-3.5" />
                {formatTempo(ordem.tempo_conclusao_segundos)}
              </span>
            )}
          </div>
        </SheetHeader>

        <Separator />

        {/* Pedido */}
        <div className="py-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Pedido
          </h4>
          {loadingPedido ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : pedido ? (
            <div className="space-y-2 text-sm">
              {pedido.numero_pedido && (
                <div><span className="text-muted-foreground">Nº Pedido:</span> <span className="font-medium">{pedido.numero_pedido}</span></div>
              )}
              {pedido.cliente_nome && (
                <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{pedido.cliente_nome}</span></div>
              )}
              {pedido.cliente_telefone && (
                <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{pedido.cliente_telefone}</span></div>
              )}
              {pedido.data_entrega && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Entrega:</span>
                  <span className="font-medium">{format(new Date(pedido.data_entrega), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
              {endereco && (
                <div className="flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{endereco}</span>
                </div>
              )}
              {pedido.observacoes && (
                <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">{pedido.observacoes}</div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>
          )}
        </div>

        <Separator />

        {/* Linhas / Itens */}
        <div className="py-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Itens ({linhas.length})
          </h4>
          {loadingLinhas ? (
            <p className="text-sm text-muted-foreground">Carregando itens...</p>
          ) : linhas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
          ) : (
            <div className="space-y-2">
              {linhas.map((linha) => (
                <div key={linha.id} className="bg-muted/30 border rounded-lg p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {linha.estoque?.nome_produto || linha.item}
                    </span>
                    <div className="shrink-0">
                      {linha.com_problema ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : linha.concluida ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Qtd: {linha.quantidade}{linha.estoque?.unidade ? ` ${linha.estoque.unidade}` : ''}</span>
                    {linha.tamanho && <span>Tam: {linha.tamanho}</span>}
                    {(linha.largura || linha.altura) && (
                      <span>{linha.largura ?? '-'} × {linha.altura ?? '-'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
