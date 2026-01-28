import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, ORDEM_ETAPAS } from "@/types/pedidoEtapa";
import { useRetrocederPedido, OrdemConfig } from "@/hooks/useRetrocederPedido";

interface RetrocederPedidoUnificadoModalProps {
  pedido: {
    id: string;
    numero_pedido?: string;
    etapa_atual: EtapaPedido;
    vendas?: any;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ETAPAS_DESTINO_PERMITIDAS: EtapaPedido[] = ['aberto', 'em_producao', 'aguardando_pintura'];

const LABEL_TIPO_ORDEM: Record<string, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  pintura: 'Pintura',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  pausada: 'Pausada',
  pronta: 'Pronta',
};

export function RetrocederPedidoUnificadoModal({
  pedido,
  open,
  onOpenChange,
  onSuccess
}: RetrocederPedidoUnificadoModalProps) {
  const [etapaDestino, setEtapaDestino] = useState<EtapaPedido>('aberto');
  const [motivo, setMotivo] = useState('');
  const [ordensConfig, setOrdensConfig] = useState<Record<string, 'manter' | 'pausar' | 'reativar' | 'resetar'>>({});

  const { ordensProducao, isLoadingOrdens, retrocederPedido, isRetrocedendo } = useRetrocederPedido(
    open ? pedido.id : null
  );

  const etapaAtual = pedido.etapa_atual;
  const configAtual = ETAPAS_CONFIG[etapaAtual];

  // Verificar se o pedido tem pintura
  const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
  const produtos = vendaData?.produtos_vendas || [];
  const temPintura = produtos.some((p: any) => p.valor_pintura > 0 || p.tipo_produto === 'pintura_epoxi');

  // Filtrar apenas etapas anteriores à atual que são permitidas
  const etapasDisponiveis = useMemo(() => {
    const indiceAtual = ORDEM_ETAPAS.indexOf(etapaAtual);
    return ORDEM_ETAPAS
      .slice(0, indiceAtual)
      .filter(etapa => {
        // Só permitir etapas de destino válidas
        if (!ETAPAS_DESTINO_PERMITIDAS.includes(etapa)) return false;
        
        // Excluir aguardando pintura se não tem pintura
        if (etapa === 'aguardando_pintura' && !temPintura) return false;
        
        return true;
      });
  }, [etapaAtual, temPintura]);

  // Filtrar ordem de pintura
  const ordemPintura = ordensProducao.find(o => o.tipo === 'pintura');
  const ordensProducaoSemPintura = ordensProducao.filter(o => o.tipo !== 'pintura');

  // Inicializar ordensConfig quando ordensProducao mudar
  useEffect(() => {
    if (ordensProducao.length > 0) {
      const initial: Record<string, 'manter' | 'pausar' | 'reativar' | 'resetar'> = {};
      ordensProducao.forEach(ordem => {
        initial[ordem.tipo] = ordem.tipo === 'pintura' ? 'resetar' : 'manter';
      });
      setOrdensConfig(initial);
    }
  }, [ordensProducao]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setMotivo('');
      setEtapaDestino('aberto');
      setOrdensConfig({});
    }
  }, [open]);

  const handleConfirmar = async () => {
    if (!motivo.trim()) return;

    // Construir array de configurações de ordens conforme etapa destino
    const ordensConfigArray: OrdemConfig[] = (() => {
      if (etapaDestino === 'em_producao') {
        return ordensProducaoSemPintura.map(ordem => ({
          tipo: ordem.tipo,
          acao: ordensConfig[ordem.tipo] || 'manter',
        }));
      }
      if (etapaDestino === 'aguardando_pintura' && ordemPintura) {
        return [{
          tipo: 'pintura' as const,
          acao: (ordensConfig['pintura'] || 'resetar') as OrdemConfig['acao'],
        }];
      }
      return [];
    })();

    try {
      await retrocederPedido.mutateAsync({
        pedidoId: pedido.id,
        etapaDestino,
        motivo,
        ordensConfig: ordensConfigArray,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleOrdemConfigChange = (tipo: string, acao: 'manter' | 'pausar' | 'reativar' | 'resetar') => {
    setOrdensConfig(prev => ({ ...prev, [tipo]: acao }));
  };

  const renderAvisoEtapa = () => {
    if (etapaDestino === 'aberto') {
      return (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs text-red-700 dark:text-red-300 font-semibold mb-2">
            ⚠️ ATENÇÃO - Ação Destrutiva:
          </p>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
            <li>TODAS as ordens serão excluídas</li>
            <li>Ordens de produção, qualidade, pintura e instalação</li>
            <li>O pedido voltará ao início do processo</li>
            <li>Pedido NÃO ficará em backlog</li>
          </ul>
        </div>
      );
    }

    if (etapaDestino === 'em_producao') {
      return (
        <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3">
          <p className="text-xs text-orange-700 dark:text-orange-300 font-semibold mb-2">
            ⚠️ Ordens que serão EXCLUÍDAS:
          </p>
          <ul className="text-xs text-orange-600 dark:text-orange-400 space-y-1 list-disc list-inside">
            <li>Ordem de qualidade</li>
            <li>Ordem de pintura</li>
            <li>Ordem de instalação/carregamento</li>
          </ul>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
            O pedido ficará marcado como BACKLOG
          </p>
        </div>
      );
    }

    if (etapaDestino === 'aguardando_pintura') {
      return (
        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-2">
            ℹ️ O que acontecerá:
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Ordem de pintura será recriada/resetada</li>
            <li>Ordem de instalação será excluída</li>
            <li>Ordem de carregamento será excluída</li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
            O pedido ficará marcado como BACKLOG
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Retornar Pedido
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm font-medium">
                Pedido #{pedido.numero_pedido || pedido.id.slice(0, 8)}
              </p>

              {/* Etapa Atual */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Etapa Atual:</span>
                <Badge className={`${configAtual?.color || 'bg-zinc-500'} text-white text-xs`}>
                  {configAtual?.label || etapaAtual}
                </Badge>
              </div>

              {/* Seleção de Etapa Destino */}
              <div className="space-y-2">
                <Label htmlFor="etapa-destino" className="text-sm font-medium">
                  Retornar para etapa:
                </Label>
                <Select value={etapaDestino} onValueChange={(value) => setEtapaDestino(value as EtapaPedido)}>
                  <SelectTrigger id="etapa-destino">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {etapasDisponiveis.map((etapa) => (
                      <SelectItem key={etapa} value={etapa}>
                        {ETAPAS_CONFIG[etapa].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Justificativa */}
              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-sm font-medium">
                  Justificativa do retorno: *
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Descreva o motivo do retorno do pedido..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Gerenciamento de Ordens de Produção (apenas para em_producao) */}
              {etapaDestino === 'em_producao' && ordensProducaoSemPintura.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Gerenciar Ordens de Produção:</Label>
                  
                  {isLoadingOrdens ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando ordens...
                    </div>
                  ) : (
                    <div className="space-y-4 border rounded-lg p-3 bg-muted/30">
                      {ordensProducaoSemPintura.map((ordem) => (
                        <div key={ordem.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {LABEL_TIPO_ORDEM[ordem.tipo]} - {ordem.numero_ordem || 'S/N'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {STATUS_LABELS[ordem.status] || ordem.status}
                            </Badge>
                          </div>
                          
                          <RadioGroup
                            value={ordensConfig[ordem.tipo] || 'manter'}
                            onValueChange={(value) => 
                              handleOrdemConfigChange(ordem.tipo, value as 'manter' | 'pausar' | 'reativar')
                            }
                            className="flex flex-col gap-1"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="manter" id={`${ordem.tipo}-manter`} />
                              <Label htmlFor={`${ordem.tipo}-manter`} className="text-xs cursor-pointer">
                                Manter status atual
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="pausar" id={`${ordem.tipo}-pausar`} />
                              <Label htmlFor={`${ordem.tipo}-pausar`} className="text-xs cursor-pointer">
                                Pausar ordem
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="reativar" id={`${ordem.tipo}-reativar`} />
                              <Label htmlFor={`${ordem.tipo}-reativar`} className="text-xs cursor-pointer">
                                Reativar ordem (resetar para pendente)
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gerenciamento de Ordem de Pintura (apenas para aguardando_pintura) */}
              {etapaDestino === 'aguardando_pintura' && ordemPintura && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Gerenciar Ordem de Pintura:</Label>
                  
                  {isLoadingOrdens ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando ordens...
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">
                          {LABEL_TIPO_ORDEM[ordemPintura.tipo]} - {ordemPintura.numero_ordem || 'S/N'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {STATUS_LABELS[ordemPintura.status] || ordemPintura.status}
                        </Badge>
                      </div>
                      
                      <RadioGroup
                        value={ordensConfig['pintura'] || 'resetar'}
                        onValueChange={(value) => 
                          handleOrdemConfigChange('pintura', value as 'manter' | 'resetar')
                        }
                        className="flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="resetar" id="pintura-resetar" />
                          <Label htmlFor="pintura-resetar" className="text-xs cursor-pointer">
                            Resetar ordem (status pendente, linhas desmarcadas)
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="manter" id="pintura-manter" />
                          <Label htmlFor="pintura-manter" className="text-xs cursor-pointer">
                            Manter status atual
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              )}

              {/* Aviso */}
              {renderAvisoEtapa()}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRetrocedendo}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar} 
            disabled={!motivo.trim() || isRetrocedendo}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRetrocedendo ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Confirmar Retorno
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
