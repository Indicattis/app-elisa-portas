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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, ORDEM_ETAPAS } from "@/types/pedidoEtapa";

interface RetrocederEtapaModalProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (pedidoId: string, etapaDestino: EtapaPedido, motivo: string) => void;
}

export function RetrocederEtapaModal({
  pedido,
  open,
  onOpenChange,
  onConfirmar
}: RetrocederEtapaModalProps) {
  const [etapaDestino, setEtapaDestino] = useState<EtapaPedido>('aberto');
  const [motivo, setMotivo] = useState('');

  const etapaAtual = pedido.etapa_atual as EtapaPedido;
  const configAtual = ETAPAS_CONFIG[etapaAtual];
  const configDestino = ETAPAS_CONFIG[etapaDestino];

  // Verificar se o pedido tem pintura
  const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
  const produtos = vendaData?.produtos_vendas || [];
  const temPintura = produtos.some((p: any) => p.valor_pintura > 0);
  
  // Verificar o tipo de entrega
  const tipoEntrega = vendaData?.tipo_entrega || '';
  const temInstalacao = tipoEntrega === 'instalacao';
  const temEntrega = tipoEntrega === 'entrega' || tipoEntrega === 'entrega_retirada';

  // Filtrar apenas etapas anteriores à atual, excluindo etapas inválidas
  const etapasDisponiveis = useMemo(() => {
    const indiceAtual = ORDEM_ETAPAS.indexOf(etapaAtual);
    return ORDEM_ETAPAS
      .slice(0, indiceAtual)
      .filter(etapa => {
        // Sempre excluir inspeção de qualidade
        if (etapa === 'inspecao_qualidade') return false;
        
        // Excluir aguardando pintura se não tem pintura
        if (etapa === 'aguardando_pintura' && !temPintura) return false;
        
        // Excluir instalações se não tem instalação
        if (etapa === 'instalacoes' && !temInstalacao) return false;
        
        // Excluir expedição coleta/entrega se não tem entrega
        if (etapa === 'aguardando_coleta' && !temEntrega) return false;
        
        // Aprovação CEO só pode ser destino se etapa atual for Instalações ou Expedição Coleta
        if (etapa === 'aprovacao_ceo' && etapaAtual !== 'instalacoes' && etapaAtual !== 'aguardando_coleta') {
          return false;
        }

        return true;
      });
  }, [etapaAtual, temPintura, temInstalacao, temEntrega]);

  useEffect(() => {
    if (open && etapasDisponiveis.length > 0 && !etapasDisponiveis.includes(etapaDestino)) {
      setEtapaDestino(etapasDisponiveis[0]);
    }
  }, [open, etapasDisponiveis, etapaDestino]);

  const handleConfirmar = () => {
    if (!motivo.trim()) {
      return;
    }
    onConfirmar(pedido.id, etapaDestino, motivo);
    onOpenChange(false);
    setMotivo('');
    setEtapaDestino('aberto');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Retornar Pedido (Backlog)
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm">
                {pedido.numero_pedido || `Pedido #${pedido.id.slice(0, 8)}`}
              </p>

              {/* Etapas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Etapa Atual:</span>
                  <Badge className={`${configAtual.color} text-white text-xs`}>
                    {configAtual.label}
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
              </div>

              {/* Aviso */}
              <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3">
                <p className="text-xs text-orange-700 dark:text-orange-300 font-semibold mb-2">
                  ⚠️ Este pedido será marcado como BACKLOG:
                </p>
                <ul className="text-xs text-orange-600 dark:text-orange-400 space-y-1 list-disc list-inside">
                  <li>Terá prioridade máxima na lista</li>
                  <li>Ficará com borda e indicador vermelho</li>
                  <li>Será posicionado no topo da etapa</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmar} 
            disabled={!motivo.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Confirmar Retorno
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
