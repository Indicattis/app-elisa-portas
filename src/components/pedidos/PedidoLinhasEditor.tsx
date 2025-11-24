import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PedidoLinha, PedidoLinhaNova } from "@/hooks/usePedidoLinhas";
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs">
                <th className="text-left p-2 font-medium text-muted-foreground">Item</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Categoria</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Qtd</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Observações</th>
                {todasOrdensConcluidas && onAtualizarCheckbox && (
                  <th className="text-center p-2 font-medium text-muted-foreground">Checkboxes</th>
                )}
                {!isReadOnly && (
                  <th className="text-center p-2 font-medium text-muted-foreground w-20">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-2 text-sm font-medium">{linha.descricao_produto || linha.nome_produto}</td>
                  <td className="p-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {linha.categoria_linha || '-'}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant="secondary" className="text-xs">
                      {linha.quantidade}x
                    </Badge>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {linha.tamanho ? `Tamanho: ${linha.tamanho}` : '-'}
                  </td>
                  {todasOrdensConcluidas && onAtualizarCheckbox && (
                    <td className="p-2">
                      <div className="flex gap-3 items-center justify-center">
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`sep-${linha.id}`}
                            checked={linha.check_separacao}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(linha.id, "check_separacao", checked as boolean)
                            }
                          />
                          <Label htmlFor={`sep-${linha.id}`} className="text-xs cursor-pointer">
                            Sep
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`qua-${linha.id}`}
                            checked={linha.check_qualidade}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(linha.id, "check_qualidade", checked as boolean)
                            }
                          />
                          <Label htmlFor={`qua-${linha.id}`} className="text-xs cursor-pointer">
                            Qual
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`col-${linha.id}`}
                            checked={linha.check_coleta}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(linha.id, "check_coleta", checked as boolean)
                            }
                          />
                          <Label htmlFor={`col-${linha.id}`} className="text-xs cursor-pointer">
                            Col
                          </Label>
                        </div>
                      </div>
                    </td>
                  )}
                  {!isReadOnly && (
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoverLinha(linha.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum produto adicionado ao pedido</p>
          {!isReadOnly && <p className="text-sm mt-1">Clique no botão abaixo para adicionar produtos</p>}
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
