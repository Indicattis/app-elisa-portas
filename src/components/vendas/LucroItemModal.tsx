import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LucroItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: {
    id: string;
    descricao: string;
    valor_total: number;
    lucro_item?: number;
    quantidade: number;
  };
  onSave: (produtoId: string, lucro: number) => Promise<void>;
  isSaving: boolean;
}

export function LucroItemModal({
  isOpen,
  onClose,
  produto,
  onSave,
  isSaving,
}: LucroItemModalProps) {
  const [lucro, setLucro] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setLucro(produto.lucro_item || 0);
    }
  }, [isOpen, produto.lucro_item]);

  const custoCalculado = produto.valor_total - lucro;
  const margem = produto.valor_total > 0 ? (lucro / produto.valor_total) * 100 : 0;
  const isLucroInvalido = lucro > produto.valor_total || lucro < 0;

  const handleSave = async () => {
    if (isLucroInvalido) return;
    await onSave(produto.id, lucro);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Faturar Produto</DialogTitle>
          <DialogDescription>
            {produto.descricao}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input de Lucro */}
          <div className="space-y-2">
            <Label htmlFor="lucro">Lucro Real (R$)</Label>
            <Input
              id="lucro"
              type="number"
              min="0"
              max={produto.valor_total}
              step="0.01"
              value={lucro}
              onChange={(e) => setLucro(Number(e.target.value))}
              className={isLucroInvalido ? "border-destructive" : ""}
            />
            {isLucroInvalido && (
              <p className="text-sm text-destructive">
                Lucro não pode ser maior que o valor total ou negativo
              </p>
            )}
          </div>

          {/* Valores Calculados */}
          <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Total:</span>
              <span className="font-semibold">
                R$ {produto.valor_total.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lucro Informado:</span>
              <span className="font-semibold text-green-600">
                R$ {lucro.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Custo Calculado:</span>
              <span className="font-semibold text-orange-600">
                R$ {custoCalculado.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Margem:</span>
              <span className="font-semibold text-blue-600">
                {margem.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Informação de Quantidade */}
          {produto.quantidade > 1 && (
            <p className="text-sm text-muted-foreground">
              Quantidade: {produto.quantidade} unidade(s)
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLucroInvalido || isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar Lucro"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
