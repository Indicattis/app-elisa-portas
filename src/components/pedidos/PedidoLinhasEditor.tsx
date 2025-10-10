import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Package } from "lucide-react";
import { PedidoLinha, PedidoLinhaNova } from "@/hooks/useVendasPedidos";
import { EstoqueSelector } from "./EstoqueSelector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PedidoLinhasEditorProps {
  linhas: PedidoLinha[];
  isReadOnly: boolean;
  onAdicionarLinha: (linha: PedidoLinhaNova) => Promise<any>;
  onRemoverLinha: (linhaId: string) => Promise<void>;
}

export const PedidoLinhasEditor = ({
  linhas,
  isReadOnly,
  onAdicionarLinha,
  onRemoverLinha,
}: PedidoLinhasEditorProps) => {
  const [modalAberto, setModalAberto] = useState(false);

  const handleAdicionarLinha = async (linha: PedidoLinhaNova) => {
    await onAdicionarLinha(linha);
    setModalAberto(false);
  };

  return (
    <div className="space-y-3">
      {linhas.length > 0 ? (
        <div className="space-y-2">
          {linhas.map((linha, index) => (
            <Card key={linha.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {index + 1}
                    </span>
                    <span className="font-medium">{linha.nome_produto}</span>
                    <span className="text-sm text-muted-foreground">
                      Qtd: {linha.quantidade}
                    </span>
                  </div>
                  {linha.descricao_produto && (
                    <p className="text-sm text-muted-foreground pl-8">
                      {linha.descricao_produto}
                    </p>
                  )}
                </div>

                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoverLinha(linha.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum produto adicionado ao pedido</p>
          <p className="text-sm mt-1">Clique no botão abaixo para adicionar produtos</p>
        </Card>
      )}

      {!isReadOnly && (
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Produto ao Pedido</DialogTitle>
            </DialogHeader>
            <EstoqueSelector onSelect={handleAdicionarLinha} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
