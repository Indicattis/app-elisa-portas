import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Loader2, Flame, Factory, Package } from "lucide-react";
import { useRetornarProducao, OrdemConfig } from "@/hooks/useRetornarProducao";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RetornarProducaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  ordemQualidadeId: string;
  clienteNome?: string;
  numeroPedido?: string;
  onSuccess?: () => void;
}

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  soldagem: { label: 'Soldagem', icon: Flame, color: 'text-orange-500' },
  perfiladeira: { label: 'Perfiladeira', icon: Factory, color: 'text-blue-500' },
  separacao: { label: 'Separação', icon: Package, color: 'text-green-500' },
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  pausada: 'Pausada',
};

type AcaoTipo = 'manter' | 'pausar' | 'reativar';

interface OrdemState {
  acao: AcaoTipo;
  justificativa: string;
}

export function RetornarProducaoModal({
  open,
  onOpenChange,
  pedidoId,
  ordemQualidadeId,
  clienteNome,
  numeroPedido,
  onSuccess,
}: RetornarProducaoModalProps) {
  const [motivo, setMotivo] = useState("");
  const [ordensState, setOrdensState] = useState<Record<string, OrdemState>>({});
  
  const { ordensProducao, isLoading, retornarParaProducao } = useRetornarProducao(pedidoId);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMotivo("");
      // Inicializar estado das ordens com 'manter' como padrão
      const initialState: Record<string, OrdemState> = {};
      ordensProducao.forEach(ordem => {
        initialState[ordem.tipo] = { acao: 'manter', justificativa: '' };
      });
      setOrdensState(initialState);
    }
  }, [open, ordensProducao]);

  const handleAcaoChange = (tipo: string, acao: AcaoTipo) => {
    setOrdensState(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], acao, justificativa: acao === 'pausar' ? prev[tipo]?.justificativa || '' : '' }
    }));
  };

  const handleJustificativaChange = (tipo: string, justificativa: string) => {
    setOrdensState(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], justificativa }
    }));
  };

  const handleConfirmar = async () => {
    // Montar configuração das ordens
    const ordensConfig: OrdemConfig[] = ordensProducao.map(ordem => ({
      tipo: ordem.tipo,
      acao: ordensState[ordem.tipo]?.acao || 'manter',
      justificativa: ordensState[ordem.tipo]?.justificativa || undefined,
    }));

    await retornarParaProducao.mutateAsync({
      pedidoId,
      ordemQualidadeId,
      motivo,
      ordensConfig,
    });
    
    onOpenChange(false);
    onSuccess?.();
  };

  // Validação: motivo obrigatório e justificativa obrigatória para ordens pausadas
  const ordensPausadasSemJustificativa = ordensProducao.some(
    ordem => ordensState[ordem.tipo]?.acao === 'pausar' && !ordensState[ordem.tipo]?.justificativa?.trim()
  );
  const podeConfirmar = motivo.trim().length > 0 && !ordensPausadasSemJustificativa;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Retornar Pedido para Produção
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Info do pedido */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm">
                  <span className="font-medium">Pedido:</span> {numeroPedido}
                </p>
                {clienteNome && (
                  <p className="text-sm">
                    <span className="font-medium">Cliente:</span> {clienteNome}
                  </p>
                )}
              </div>

              {/* Aviso */}
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive font-medium mb-2">Esta ação irá:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Excluir ordens de qualidade e pintura (serão recriadas)</li>
                  <li>Retornar o pedido para a etapa "Em Produção"</li>
                  <li>Marcar o pedido como BACKLOG (prioridade alta)</li>
                </ul>
              </div>

              {/* Justificativa geral */}
              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-sm font-medium">
                  Justificativa Geral: <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Descreva o motivo do retorno para produção..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Configuração de ordens */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Defina o que fazer com cada ordem:
                </Label>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : ordensProducao.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma ordem de produção encontrada para este pedido.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ordensProducao.map((ordem) => {
                      const config = TIPO_CONFIG[ordem.tipo];
                      const Icon = config?.icon || Package;
                      const ordemState = ordensState[ordem.tipo] || { acao: 'manter', justificativa: '' };
                      
                      return (
                        <div
                          key={ordem.id}
                          className="p-3 rounded-lg border bg-card space-y-3"
                        >
                          {/* Header da ordem */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={cn("h-4 w-4", config?.color)} />
                              <span className="font-medium text-sm">{config?.label}</span>
                              <span className="text-xs text-muted-foreground">({ordem.numero_ordem})</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {STATUS_LABELS[ordem.status] || ordem.status}
                            </Badge>
                          </div>

                          {/* Radio options */}
                          <RadioGroup
                            value={ordemState.acao}
                            onValueChange={(value) => handleAcaoChange(ordem.tipo, value as AcaoTipo)}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="manter" id={`${ordem.tipo}-manter`} />
                              <Label htmlFor={`${ordem.tipo}-manter`} className="text-xs cursor-pointer">
                                Manter status atual
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="pausar" id={`${ordem.tipo}-pausar`} />
                              <Label htmlFor={`${ordem.tipo}-pausar`} className="text-xs cursor-pointer">
                                Pausar ordem (definir justificativa)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="reativar" id={`${ordem.tipo}-reativar`} />
                              <Label htmlFor={`${ordem.tipo}-reativar`} className="text-xs cursor-pointer">
                                Reativar ordem (pendente, a fazer)
                              </Label>
                            </div>
                          </RadioGroup>

                          {/* Campo de justificativa para pausa */}
                          {ordemState.acao === 'pausar' && (
                            <div className="space-y-1 pl-6">
                              <Label className="text-xs text-muted-foreground">
                                Justificativa da pausa: <span className="text-destructive">*</span>
                              </Label>
                              <Textarea
                                placeholder="Ex: Refazer solda do eixo principal..."
                                value={ordemState.justificativa}
                                onChange={(e) => handleJustificativaChange(ordem.tipo, e.target.value)}
                                rows={2}
                                className="resize-none text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={retornarParaProducao.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirmar}
            disabled={!podeConfirmar || retornarParaProducao.isPending}
          >
            {retornarParaProducao.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retornando...
              </>
            ) : (
              "Confirmar Retorno"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
