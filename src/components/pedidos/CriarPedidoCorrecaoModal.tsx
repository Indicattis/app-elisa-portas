import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCriarPedidoCorrecao } from "@/hooks/useCriarPedidoCorrecao";
import { useNavigate } from "react-router-dom";
import { formatarNumeroPedidoMensal } from "@/utils/pedidoFormatters";

interface CriarPedidoCorrecaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
}

export function CriarPedidoCorrecaoModal({ open, onOpenChange, pedido }: CriarPedidoCorrecaoModalProps) {
  const [observacoes, setObservacoes] = useState("");
  const { criarPedidoCorrecao, isLoading } = useCriarPedidoCorrecao();
  const navigate = useNavigate();

  const venda = Array.isArray(pedido?.vendas) ? pedido.vendas[0] : pedido?.vendas;
  const clienteNome = venda?.cliente_nome || pedido?.cliente_nome || "Cliente";
  const numeroPedido = formatarNumeroPedidoMensal(pedido?.numero_mes, pedido?.mes_vigencia, pedido?.numero_pedido);

  const handleConfirmar = async () => {
    const novoId = await criarPedidoCorrecao(pedido.id, observacoes || undefined);
    if (novoId) {
      onOpenChange(false);
      setObservacoes("");
      navigate(`/dashboard/pedido/${novoId}/view`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-purple-500" />
            Gerar Pedido de Correção
          </DialogTitle>
          <DialogDescription>
            Será criado um novo pedido vinculado ao pedido original para correção.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">Pedido Original: <span className="text-purple-600 dark:text-purple-400">{numeroPedido}</span></p>
            <p className="text-sm text-muted-foreground">Cliente: {clienteNome}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Descrição do problema (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Descreva o problema que gerou a necessidade de correção..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Pedido de Correção"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
