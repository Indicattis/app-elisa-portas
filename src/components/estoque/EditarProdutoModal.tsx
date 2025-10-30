import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ProdutoEstoque } from "@/hooks/useEstoque";
import { useCategorias } from "@/hooks/useCategorias";
import { useState, useEffect } from "react";

interface EditarProdutoModalProps {
  produto: ProdutoEstoque | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditar: (id: string, data: any) => Promise<void>;
}

export function EditarProdutoModal({ produto, open, onOpenChange, onEditar }: EditarProdutoModalProps) {
  const { categorias } = useCategorias();
  const [formData, setFormData] = useState({
    nome_produto: "",
    descricao_produto: "",
    quantidade: 0,
    unidade: "UN",
    categoria: "geral",
    preco_unitario: 0,
    comercializado_individualmente: false,
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome_produto: produto.nome_produto,
        descricao_produto: produto.descricao_produto || "",
        quantidade: produto.quantidade,
        unidade: produto.unidade,
        categoria: produto.categoria,
        preco_unitario: produto.preco_unitario,
        comercializado_individualmente: produto.comercializado_individualmente,
      });
    }
  }, [produto]);

  const handleSubmit = async () => {
    if (!produto) return;
    await onEditar(produto.id, formData);
    onOpenChange(false);
  };

  if (!produto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do Produto</Label>
            <Input 
              value={formData.nome_produto} 
              onChange={(e) => setFormData({...formData, nome_produto: e.target.value})} 
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input 
              value={formData.descricao_produto} 
              onChange={(e) => setFormData({...formData, descricao_produto: e.target.value})} 
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select 
              value={formData.categoria} 
              onValueChange={(value) => setFormData({...formData, categoria: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nome.toLowerCase()}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantidade</Label>
              <Input 
                type="number" 
                value={formData.quantidade} 
                onChange={(e) => setFormData({...formData, quantidade: parseInt(e.target.value) || 0})} 
              />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input 
                value={formData.unidade} 
                onChange={(e) => setFormData({...formData, unidade: e.target.value})} 
              />
            </div>
          </div>
          <div>
            <Label>Preço Unitário</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.preco_unitario} 
              onChange={(e) => setFormData({...formData, preco_unitario: parseFloat(e.target.value) || 0})} 
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="comercializado_edit"
              checked={formData.comercializado_individualmente}
              onCheckedChange={(checked) => 
                setFormData({...formData, comercializado_individualmente: checked as boolean})
              }
            />
            <Label htmlFor="comercializado_edit" className="cursor-pointer font-normal">
              Produto pode ser comercializado individualmente
            </Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">Salvar</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
