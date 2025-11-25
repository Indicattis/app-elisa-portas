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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRetornarProducao } from "@/hooks/useRetornarProducao";

interface RetornarProducaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  ordemQualidadeId: string;
  clienteNome?: string;
  numeroPedido?: string;
  onSuccess?: () => void;
}

const TIPO_LABELS: Record<string, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
};

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
  const [ordensSelecionadas, setOrdensSelecionadas] = useState<string[]>([]);
  
  const { ordensProducao, isLoading, retornarParaProducao } = useRetornarProducao(pedidoId);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMotivo("");
      setOrdensSelecionadas([]);
    }
  }, [open]);

  const handleToggleOrdem = (tipo: string) => {
    setOrdensSelecionadas(prev => 
      prev.includes(tipo) 
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const handleConfirmar = async () => {
    await retornarParaProducao.mutateAsync({
      pedidoId,
      ordemQualidadeId,
      motivo,
      ordensReativar: ordensSelecionadas,
    });
    
    onOpenChange(false);
    onSuccess?.();
  };

  const podeConfirmar = motivo.trim().length > 0 && ordensSelecionadas.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
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
                  <li>Excluir a ordem de qualidade atual</li>
                  <li>Retornar o pedido para a etapa "Em Produção"</li>
                  <li>Marcar o pedido como BACKLOG (prioridade alta)</li>
                  <li>Reativar as ordens selecionadas como "A fazer"</li>
                </ul>
              </div>

              {/* Seleção de ordens */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Selecione as ordens a reativar: <span className="text-destructive">*</span>
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
                  <div className="space-y-2">
                    {ordensProducao.map((ordem) => (
                      <div
                        key={ordem.id}
                        className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleToggleOrdem(ordem.tipo)}
                      >
                        <Checkbox
                          id={`ordem-${ordem.tipo}`}
                          checked={ordensSelecionadas.includes(ordem.tipo)}
                          onCheckedChange={() => handleToggleOrdem(ordem.tipo)}
                        />
                        <Label
                          htmlFor={`ordem-${ordem.tipo}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="font-medium">{TIPO_LABELS[ordem.tipo]}</span>
                          <span className="text-muted-foreground ml-2">({ordem.numero_ordem})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Justificativa */}
              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-sm font-medium">
                  Justificativa: <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Descreva o motivo do retorno para produção..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
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
