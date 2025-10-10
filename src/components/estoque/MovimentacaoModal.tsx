import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProdutoEstoque } from "@/hooks/useEstoque";
import { ArrowDown, ArrowUp } from "lucide-react";

interface MovimentacaoModalProps {
  produto: ProdutoEstoque | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovimentar: (tipo: 'entrada' | 'saida', quantidade: number, observacoes?: string) => Promise<void>;
}

export function MovimentacaoModal({ 
  produto, 
  open, 
  onOpenChange, 
  onMovimentar 
}: MovimentacaoModalProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacoes, setObservacoes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!produto || quantidade <= 0) return;

    setLoading(true);
    try {
      await onMovimentar(tipo, quantidade, observacoes);
      setQuantidade(1);
      setObservacoes("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!produto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentar Estoque</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold">{produto.nome_produto}</p>
            <p className="text-sm text-muted-foreground">
              Estoque atual: <span className="font-semibold">{produto.quantidade} {produto.unidade}</span>
            </p>
          </div>

          <div>
            <Label>Tipo de Movimentação</Label>
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as 'entrada' | 'saida')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="entrada" id="entrada" />
                <label htmlFor="entrada" className="flex items-center gap-2 cursor-pointer flex-1">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  <span>Entrada (Adicionar ao estoque)</span>
                </label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="saida" id="saida" />
                <label htmlFor="saida" className="flex items-center gap-2 cursor-pointer flex-1">
                  <ArrowDown className="h-4 w-4 text-red-500" />
                  <span>Saída (Remover do estoque)</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Ex: Compra fornecedor X, Utilizado na ordem Y..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || quantidade <= 0}
              className="flex-1"
            >
              {loading ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
