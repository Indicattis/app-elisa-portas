import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  todasOrdensConcluidas?: boolean;
  onAdicionarLinha: (linha: PedidoLinhaNova) => Promise<any>;
  onRemoverLinha: (linhaId: string) => Promise<void>;
  onAtualizarCheckbox?: (linhaId: string, campo: string, valor: boolean) => Promise<void>;
}

export const PedidoLinhasEditor = ({
  linhas,
  isReadOnly,
  todasOrdensConcluidas = false,
  onAdicionarLinha,
  onRemoverLinha,
  onAtualizarCheckbox,
}: PedidoLinhasEditorProps) => {
  const [modalAberto, setModalAberto] = useState(false);

  const handleAdicionarLinha = async (linha: PedidoLinhaNova) => {
    await onAdicionarLinha(linha);
    setModalAberto(false);
  };

  const handleCheckboxChange = async (linhaId: string, campo: string, checked: boolean) => {
    if (onAtualizarCheckbox) {
      await onAtualizarCheckbox(linhaId, campo, checked);
    }
  };

  return (
    <div className="space-y-3">
      {linhas.length > 0 ? (
        <div className="space-y-2">
          {linhas.map((linha, index) => (
            <Card key={linha.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
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

                  {linha.tamanho && (
                    <p className="text-sm text-muted-foreground pl-8">
                      <span className="font-medium">Tamanho:</span> {linha.tamanho}
                    </p>
                  )}

                  {todasOrdensConcluidas && onAtualizarCheckbox && (
                    <div className="flex gap-4 pl-8 pt-2 border-t mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`sep-${linha.id}`}
                          checked={linha.check_separacao}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(linha.id, "check_separacao", checked as boolean)
                          }
                        />
                        <Label htmlFor={`sep-${linha.id}`} className="text-sm cursor-pointer">
                          Separação
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`qua-${linha.id}`}
                          checked={linha.check_qualidade}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(linha.id, "check_qualidade", checked as boolean)
                          }
                        />
                        <Label htmlFor={`qua-${linha.id}`} className="text-sm cursor-pointer">
                          Qualidade
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`col-${linha.id}`}
                          checked={linha.check_coleta}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(linha.id, "check_coleta", checked as boolean)
                          }
                        />
                        <Label htmlFor={`col-${linha.id}`} className="text-sm cursor-pointer">
                          Coleta
                        </Label>
                      </div>
                    </div>
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
