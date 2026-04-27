import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Loader2, Package, RefreshCw, Pause, UserMinus, Printer, UserPlus, CheckCircle2, RotateCcw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLinhasOrdem, LinhaOrdem } from "@/hooks/useLinhasOrdem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RemoverResponsavelModal } from "@/components/pedidos/RemoverResponsavelModal";
import { DelegacaoModal } from "@/components/production/DelegacaoModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEtiquetasProducao } from "@/hooks/useEtiquetasProducao";
import { gerarPDFEtiquetaProducao } from "@/utils/etiquetasPDFGenerator";
import { calcularTempoExpediente } from "@/utils/calcularTempoExpediente";
import { LinhasAgrupadasPorPortaSheet } from "./LinhasAgrupadasPorPortaSheet";
import type { OrdemStatus, TipoOrdem } from "@/hooks/useOrdensPorPedido";

interface OrdemLinhasSheetProps {
  ordem: OrdemStatus | null;
  numeroPedido?: string;
  clienteNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_LABELS: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
  embalagem: 'Embalagem',
  carregamento: 'Carregamento',
  instalacao: 'Instalação',
};

const TABLE_MAP: Record<TipoOrdem, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
  qualidade: 'ordens_qualidade',
  pintura: 'ordens_pintura',
  embalagem: 'ordens_embalagem',
  carregamento: 'ordens_carregamento',
  instalacao: 'instalacoes',
};

// Tipos que suportam regeneração de linhas
const TIPOS_COM_REGENERACAO: TipoOrdem[] = ['soldagem', 'perfiladeira', 'separacao', 'qualidade', 'pintura'];

const TIPO_ORDEM_ETIQUETA: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
  embalagem: 'Embalagem',
  carregamento: 'Carregamento',
  instalacao: 'Instalação',
};

export function OrdemLinhasSheet({ ordem, numeroPedido, clienteNome, open, onOpenChange }: OrdemLinhasSheetProps) {
  const { toast: toastHook } = useToast();
  const queryClient = useQueryClient();
  const [showRemoverModal, setShowRemoverModal] = useState(false);
  const [showDelegacaoModal, setShowDelegacaoModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { calcularEtiquetasLinha } = useEtiquetasProducao();
  
  const { data: linhas = [], isLoading } = useLinhasOrdem(
    ordem?.id || null, 
    ordem?.tipo || null
  );

  const marcarLinha = useMutation({
    mutationFn: async ({ linhaId, concluida }: { linhaId: string; concluida: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('linhas_ordens')
        .update({
          concluida,
          concluida_em: concluida ? new Date().toISOString() : null,
          concluida_por: concluida ? user?.id : null,
        })
        .eq('id', linhaId);

      if (error) throw error;
      return { linhaId, concluida };
    },
    onMutate: async ({ linhaId, concluida }) => {
      await queryClient.cancelQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });

      const previousLinhas = queryClient.getQueryData<LinhaOrdem[]>(['linhas-ordem', ordem?.id, ordem?.tipo]);

      queryClient.setQueryData<LinhaOrdem[]>(['linhas-ordem', ordem?.id, ordem?.tipo], (old) =>
        old?.map(l => l.id === linhaId ? { ...l, concluida } : l)
      );

      return { previousLinhas };
    },
    onError: (error, _, context) => {
      if (context?.previousLinhas) {
        queryClient.setQueryData(['linhas-ordem', ordem?.id, ordem?.tipo], context.previousLinhas);
      }
      toastHook({
        title: "Erro",
        description: "Não foi possível atualizar a linha.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toastHook({ title: "Atualizado" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
    },
  });

  const regenerarLinhas = useMutation({
    mutationFn: async () => {
      console.log('[regenerarLinhas] Iniciando...', { ordemId: ordem?.id, tipo: ordem?.tipo });
      
      if (!ordem?.id || !ordem?.tipo) {
        console.error('[regenerarLinhas] Ordem inválida', { ordem });
        throw new Error('Ordem inválida');
      }
      
      console.log('[regenerarLinhas] Chamando RPC regenerar_linhas_ordem');
      const { data, error } = await supabase.rpc('regenerar_linhas_ordem', {
        p_ordem_id: ordem.id,
        p_tipo_ordem: ordem.tipo,
      });
      
      console.log('[regenerarLinhas] Resposta:', { data, error });
      
      if (error) {
        console.error('[regenerarLinhas] Erro da RPC:', error);
        throw error;
      }
      if (data && !(data as { success: boolean }).success) {
        const errorMsg = (data as { error?: string }).error || 'Erro desconhecido';
        console.error('[regenerarLinhas] RPC retornou erro:', errorMsg);
        throw new Error(errorMsg);
      }
      return data as { success: boolean; linhas_criadas: number };
    },
    onSuccess: (data) => {
      console.log('[regenerarLinhas] Sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      toastHook({
        title: "Linhas regeneradas",
        description: `${data.linhas_criadas} linhas foram recriadas.`,
      });
    },
    onError: (error) => {
      console.error('[regenerarLinhas] onError:', error);
      toastHook({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível regenerar as linhas.",
        variant: "destructive",
      });
    },
  });

  const removerResponsavel = useMutation({
    mutationFn: async () => {
      if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem inválida');
      
      const tableName = TABLE_MAP[ordem.tipo];

      let updatePayload: Record<string, any>;

      if (ordem.tipo === 'carregamento') {
        updatePayload = {
          responsavel_carregamento_id: null,
          responsavel_carregamento_nome: null,
          status: 'pendente',
        };
      } else if (ordem.tipo === 'instalacao') {
        updatePayload = {
          responsavel_instalacao_id: null,
          responsavel_instalacao_nome: null,
          status: 'pendente',
        };
      } else {
        updatePayload = {
          responsavel_id: null,
          capturada_em: null,
          status: 'pendente',
          historico: false,
          data_conclusao: null,
        };

        if (ordem.tipo !== 'pintura') {
          updatePayload.pausada = false;
          updatePayload.pausada_em = null;
          updatePayload.justificativa_pausa = null;
        }

        if (['soldagem', 'perfiladeira', 'separacao'].includes(ordem.tipo)) {
          updatePayload.linha_problema_id = null;
        }
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .update(updatePayload)
        .eq('id', ordem.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Nenhuma ordem foi alterada. Verifique se seu usuário tem permissão para remover o responsável.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
      setShowRemoverModal(false);
      onOpenChange(false);
      toastHook({
        title: "Responsável removido",
        description: "A ordem está disponível para captura novamente.",
      });
    },
    onError: (error) => {
      console.error('[removerResponsavel] erro:', error);
      toastHook({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível remover o responsável.",
        variant: "destructive",
      });
    },
  });

  // Delegar responsável
  const delegarResponsavel = useMutation({
    mutationFn: async (userId: string) => {
      if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem inválida');
      const tableName = TABLE_MAP[ordem.tipo];
      const { error } = await supabase
        .from(tableName as any)
        .update({
          responsavel_id: userId,
          capturada_em: new Date().toISOString(),
        })
        .eq('id', ordem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      queryClient.invalidateQueries({ queryKey: ['linhas-ordem'] });
      setShowDelegacaoModal(false);
      toast.success('Responsável delegado com sucesso');
    },
    onError: () => {
      toastHook({
        title: "Erro",
        description: "Não foi possível delegar o responsável.",
        variant: "destructive",
      });
    },
  });

  // Concluir ordem
  const concluirOrdem = useMutation({
    mutationFn: async () => {
      if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem inválida');
      const tableName = TABLE_MAP[ordem.tipo];

      let tempo_conclusao_segundos: number | null = null;
      if (ordem.capturada_em) {
        tempo_conclusao_segundos = calcularTempoExpediente(
          new Date(ordem.capturada_em), new Date()
        ) + ((ordem as any).tempo_acumulado_segundos || 0);
      }

      // Marcar todas linhas pendentes como concluídas (com metadata para produção)
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('linhas_ordens')
        .update({
          concluida: true,
          concluida_em: new Date().toISOString(),
          concluida_por: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('ordem_id', ordem.id)
        .eq('tipo_ordem', ordem.tipo)
        .eq('concluida', false);

      // Concluir a ordem
      const { error } = await supabase
        .from(tableName as any)
        .update({
          status: 'concluido',
          historico: true,
          data_conclusao: new Date().toISOString(),
          tempo_conclusao_segundos,
        })
        .eq('id', ordem.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      queryClient.invalidateQueries({ queryKey: ['linhas-ordem'] });
      onOpenChange(false);
      toast.success('Ordem concluída com sucesso!');
    },
    onError: (error) => {
      toastHook({
        title: "Erro ao concluir",
        description: error instanceof Error ? error.message : "Não foi possível concluir a ordem.",
        variant: "destructive",
      });
    },
  });

  // Resetar ordem
  const resetarOrdem = useMutation({
    mutationFn: async () => {
      if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem inválida');
      const tableName = TABLE_MAP[ordem.tipo];

      await supabase
        .from('linhas_ordens')
        .update({ concluida: false, concluida_em: null, concluida_por: null })
        .eq('ordem_id', ordem.id)
        .eq('tipo_ordem', ordem.tipo);

      const { error } = await supabase
        .from(tableName as any)
        .update({
          status: 'pendente',
          responsavel_id: null,
          capturada_em: null,
          data_conclusao: null,
          historico: false,
          pausada: false,
          justificativa_pausa: null,
          tempo_acumulado_segundos: 0,
        })
        .eq('id', ordem.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
      setShowResetModal(false);
      onOpenChange(false);
      toast.success('Ordem resetada com sucesso');
    },
    onError: () => {
      toastHook({
        title: "Erro",
        description: "Não foi possível resetar a ordem.",
        variant: "destructive",
      });
    },
  });

  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const totalLinhas = linhas.length;
  const isOrdemConcluida = ordem?.status === 'concluido';
  
  const temResponsavel = !!(ordem?.responsavel_id || ordem?.responsavel || ordem?.responsavel_nome);

  // Pode remover responsável se a ordem tem responsável e ainda não foi concluída.
  const podeRemoverResponsavel = temResponsavel && !isOrdemConcluida;

  // Pode delegar se: NÃO tem responsável e NÃO está concluída
  const podeDelegarResponsavel = !ordem?.responsavel && !isOrdemConcluida;

  // Pode concluir se: tem responsável e não está concluída
  const podeConcluir = !!ordem?.responsavel && !isOrdemConcluida;

  const handleImprimirEtiqueta = (linha: LinhaOrdem) => {
    try {
      const linhaParaCalculo = {
        id: linha.id,
        item: linha.estoque?.nome_produto || linha.item,
        quantidade: linha.quantidade,
        tamanho: linha.tamanho || undefined,
        largura: linha.largura || undefined,
        altura: linha.altura || undefined,
      };
      
      const calculo = calcularEtiquetasLinha(linhaParaCalculo);
      
      // Montar portaLabel a partir dos dados da linha
      let portaLabel: string | undefined;
      if (linha.produto_venda_id) {
        const portaKey = `${linha.produto_venda_id}_${linha.indice_porta ?? 0}`;
        const portaKeys = new Set<string>();
        const portaKeysOrdenadas: string[] = [];
        linhas.forEach((l: LinhaOrdem) => {
          const key = l.produto_venda_id ? `${l.produto_venda_id}_${l.indice_porta ?? 0}` : 'sem_porta';
          if (key !== 'sem_porta' && !portaKeys.has(key)) {
            portaKeys.add(key);
            portaKeysOrdenadas.push(key);
          }
        });
        const portaNum = portaKeysOrdenadas.indexOf(portaKey);
        if (portaNum >= 0) {
          const num = String(portaNum + 1).padStart(2, '0');
          const dimTexto = linha.largura && linha.altura 
            ? ` — ${Number(linha.largura).toFixed(2)}m x ${Number(linha.altura).toFixed(2)}m` 
            : '';
          portaLabel = `Porta #${num}${dimTexto}`;
        }
      }
      
      const tag = {
        tagNumero: 1,
        totalTags: calculo.etiquetasNecessarias,
        nomeProduto: calculo.nomeProduto,
        numeroPedido: numeroPedido || ordem?.numero_ordem || '',
        quantidade: calculo.quantidade,
        largura: calculo.largura,
        altura: calculo.altura,
        clienteNome: clienteNome,
        tamanho: linha.tamanho,
        origemOrdem: ordem?.tipo ? TIPO_ORDEM_ETIQUETA[ordem.tipo] : undefined,
        responsavelNome: ordem?.responsavel?.nome,
        divisor: calculo.divisor,
        quantidadeParcial: calculo.divisor ? Math.ceil(calculo.quantidade / calculo.divisor) : undefined,
        quantidadeTotal: calculo.quantidade,
        portaLabel,
      };
      
      const doc = gerarPDFEtiquetaProducao(tag);
      
      const blobUrl = String(doc.output('bloburl'));
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
        }, 500);
      };
      
      toast.success('1 etiqueta pronta para impressão');
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      toast.error('Erro ao gerar etiqueta');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bg-zinc-900 border-zinc-800 text-white w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2 pr-8">
              <Package className="w-5 h-5 text-blue-400" />
              <span className="flex-1">
                {ordem ? `${TIPO_LABELS[ordem.tipo]} #${ordem.numero_ordem}` : 'Ordem'}
              </span>
              
              {ordem?.responsavel && (
                <Avatar className="h-6 w-6 border border-blue-500/30">
                  <AvatarImage src={ordem.responsavel.foto_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-300">
                    {ordem.responsavel.iniciais}
                  </AvatarFallback>
                </Avatar>
              )}
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              <div className="flex flex-col gap-1">
                {ordem?.responsavel && (
                  <span className="text-xs">Responsável: {ordem.responsavel.nome}</span>
                )}
                {!ordem?.responsavel && !isOrdemConcluida && (
                  <span className="text-xs text-amber-400">Sem responsável delegado</span>
                )}
                {totalLinhas > 0 && (
                  <span className="flex items-center gap-2">
                    Progresso: {linhasConcluidas}/{totalLinhas} linhas concluídas
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50">
                      {Math.round((linhasConcluidas / totalLinhas) * 100)}%
                    </span>
                  </span>
                )}
              </div>
            </SheetDescription>
          </SheetHeader>

          {/* Alerta de ordem pausada */}
          {ordem?.pausada && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Pause className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-300">Ordem Pausada</span>
              </div>
              
              {linhas.filter(l => l.com_problema).length > 0 && (
                <div className="mb-2 p-2 rounded bg-red-500/20">
                  <p className="text-xs text-red-200 font-medium mb-1">
                    {linhas.filter(l => l.com_problema).length} linha(s) com problema:
                  </p>
                  <div className="space-y-1">
                    {linhas.filter(l => l.com_problema).map(linha => (
                      <p key={linha.id} className="text-sm text-white">
                        • {linha.estoque?.nome_produto || linha.item} - Qtd: {linha.quantidade}
                        {linha.tamanho && ` - Tam: ${linha.tamanho}`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {linhas.filter(l => l.com_problema).length === 0 && ordem.linha_problema && (
                <div className="mb-2 p-2 rounded bg-red-500/20">
                  <p className="text-xs text-red-200 font-medium">Linha com problema:</p>
                  <p className="text-sm text-white">
                    {ordem.linha_problema.item} - Qtd: {ordem.linha_problema.quantidade}
                    {ordem.linha_problema.tamanho && ` - Tam: ${ordem.linha_problema.tamanho}`}
                  </p>
                </div>
              )}
              
              {ordem.justificativa_pausa && (
                <div className="p-2 rounded bg-zinc-800/50">
                  <p className="text-xs text-zinc-400 font-medium">Motivo:</p>
                  <p className="text-sm text-zinc-300">{ordem.justificativa_pausa}</p>
                </div>
              )}
            </div>
          )}

          {/* Ações da ordem */}
          <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-zinc-700/50">
            <TooltipProvider>
              {/* Botão Delegar Responsável */}
              {podeDelegarResponsavel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDelegacaoModal(true)}
                      className="h-8 gap-2 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="text-xs">Delegar Responsável</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Delegar um colaborador como responsável desta ordem
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Botão Remover Responsável */}
              {podeRemoverResponsavel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRemoverModal(true)}
                      className="h-8 gap-2 border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300"
                    >
                      <UserMinus className="h-4 w-4" />
                      <span className="text-xs">Remover Responsável</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Remover responsável e liberar ordem para captura
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Botão Regenerar Linhas */}
              {ordem?.tipo && TIPOS_COM_REGENERACAO.includes(ordem.tipo) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => regenerarLinhas.mutate()}
                      disabled={regenerarLinhas.isPending || isOrdemConcluida}
                      className={cn(
                        "h-8 gap-2 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50",
                        isOrdemConcluida && "opacity-50"
                      )}
                    >
                      {regenerarLinhas.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-xs text-zinc-300">Regenerar linhas</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isOrdemConcluida 
                      ? 'Ordem concluída - não é possível regenerar' 
                      : 'Regenerar linhas da ordem'}
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Botão Resetar Ordem */}
              {ordem && ordem.status !== 'pendente' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResetModal(true)}
                      disabled={resetarOrdem.isPending}
                      className="h-8 gap-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-300"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="text-xs">Resetar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Resetar ordem para pendente, remover responsável e desmarcar linhas
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>

          <div className="flex-1 mt-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : linhas.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                Nenhuma linha encontrada para esta ordem.
              </div>
            ) : (
              <LinhasAgrupadasPorPortaSheet
                linhas={linhas}
                marcarLinha={marcarLinha}
                handleImprimirEtiqueta={handleImprimirEtiqueta}
              />
            )}
          </div>

          {/* Botão Concluir Ordem - fixo no rodapé */}
          {ordem && !isOrdemConcluida && (
            <div className="mt-4 pt-4 border-t border-zinc-700/50">
              <Button
                onClick={() => concluirOrdem.mutate()}
                disabled={!podeConcluir || concluirOrdem.isPending}
                className={cn(
                  "w-full h-11 gap-2 text-sm font-medium",
                  podeConcluir
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                )}
              >
                {concluirOrdem.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Concluindo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir Ordem
                  </>
                )}
              </Button>
              {!ordem?.responsavel && (
                <p className="text-xs text-amber-400 text-center mt-2">
                  Delegue um responsável antes de concluir
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de confirmação para remover responsável */}
      <RemoverResponsavelModal
        open={showRemoverModal}
        onOpenChange={setShowRemoverModal}
        onConfirm={() => removerResponsavel.mutate()}
        responsavelNome={ordem?.responsavel?.nome || null}
        responsavelFoto={ordem?.responsavel?.foto_url || null}
        nomeSetor={ordem?.tipo ? TIPO_LABELS[ordem.tipo] : 'Ordem'}
        isLoading={removerResponsavel.isPending}
      />

      {/* Modal de delegação de responsável */}
      <DelegacaoModal
        open={showDelegacaoModal}
        onOpenChange={setShowDelegacaoModal}
        onConfirm={(userId) => delegarResponsavel.mutate(userId)}
        isLoading={delegarResponsavel.isPending}
      />

      {/* Modal de confirmação para resetar ordem */}
      <AlertDialog open={showResetModal} onOpenChange={setShowResetModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar ordem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? A ordem voltará ao status "pendente", todas as linhas serão
              desmarcadas e o responsável será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetarOrdem.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); resetarOrdem.mutate(); }}
              disabled={resetarOrdem.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetarOrdem.isPending ? "Resetando..." : "Resetar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
