import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { RequisicaoCompraFormData, RequisicaoCompraItem } from "@/hooks/useRequisicoesCompra";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useEstoque } from "@/hooks/useEstoque";

interface RequisicaoCompraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RequisicaoCompraFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const RequisicaoCompraForm = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  isSubmitting = false 
}: RequisicaoCompraFormProps) => {
  const { fornecedores } = useFornecedores();
  const { produtos: estoque } = useEstoque();

  const [formData, setFormData] = useState<RequisicaoCompraFormData>({
    fornecedor_id: "",
    data_necessidade: "",
    observacoes: "",
    itens: [],
  });

  const [itemSelecionado, setItemSelecionado] = useState<string>("");
  const [quantidadeItem, setQuantidadeItem] = useState<number>(1);
  const [observacoesItem, setObservacoesItem] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setFormData({
        fornecedor_id: "",
        data_necessidade: "",
        observacoes: "",
        itens: [],
      });
      setItemSelecionado("");
      setQuantidadeItem(1);
      setObservacoesItem("");
    }
  }, [open]);

  const handleAdicionarItem = () => {
    if (!itemSelecionado || quantidadeItem <= 0) {
      return;
    }

    const produto = estoque.find((p) => p.id === itemSelecionado);
    if (!produto) return;

    const novoItem: RequisicaoCompraItem = {
      produto_id: itemSelecionado,
      produto_nome: produto.nome_produto,
      quantidade: quantidadeItem,
      observacoes: observacoesItem,
    };

    setFormData((prev) => ({
      ...prev,
      itens: [...prev.itens, novoItem],
    }));

    setItemSelecionado("");
    setQuantidadeItem(1);
    setObservacoesItem("");
  };

  const handleRemoverItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.itens.length === 0) {
      return;
    }

    await onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Requisição de Compra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, fornecedor_id: value }))
                }
              >
                <SelectTrigger id="fornecedor">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_necessidade">Data de Necessidade</Label>
              <Input
                id="data_necessidade"
                type="date"
                value={formData.data_necessidade}
                onChange={(e) => setFormData(prev => ({ ...prev, data_necessidade: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Adicionar Item</h3>
            
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 space-y-2">
                <Label>Produto *</Label>
                <Select value={itemSelecionado} onValueChange={setItemSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {estoque
                      .filter((p) => p.ativo)
                      .map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome_produto}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidadeItem}
                  onChange={(e) => setQuantidadeItem(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="col-span-4 space-y-2">
                <Label>Observações</Label>
                <Input
                  value={observacoesItem}
                  onChange={(e) => setObservacoesItem(e.target.value)}
                />
              </div>

              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  onClick={handleAdicionarItem}
                  disabled={!itemSelecionado || quantidadeItem <= 0}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {formData.itens.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Itens da Requisição ({formData.itens.length})</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.itens.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.produto_nome}</TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell>{item.observacoes || "-"}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || formData.itens.length === 0}>
              {isSubmitting ? "Criando..." : "Criar Requisição"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
