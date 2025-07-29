import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { OrcamentoProduto, ProdutoFormData } from "@/types/produto";

interface ProdutoFormProps {
  produtos: OrcamentoProduto[];
  setProdutos: (produtos: OrcamentoProduto[]) => void;
}

export function ProdutoForm({ produtos, setProdutos }: ProdutoFormProps) {
  const [produtoForm, setProdutoForm] = useState<ProdutoFormData>({
    tipo_produto: "",
    medidas: "",
    cor: "",
    descricao: "",
    valor: ""
  });

  const adicionarProduto = () => {
    if (!produtoForm.tipo_produto || !produtoForm.descricao || !produtoForm.valor) {
      return;
    }

    const novoProduto: OrcamentoProduto = {
      id: `temp-${Date.now()}`,
      tipo_produto: produtoForm.tipo_produto as any,
      medidas: produtoForm.medidas || undefined,
      cor: produtoForm.cor || undefined,
      descricao: produtoForm.descricao,
      valor: parseFloat(produtoForm.valor) || 0
    };

    setProdutos([...produtos, novoProduto]);
    setProdutoForm({
      tipo_produto: "",
      medidas: "",
      cor: "",
      descricao: "",
      valor: ""
    });
  };

  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const needsMedidas = produtoForm.tipo_produto === 'porta_enrolar' || produtoForm.tipo_produto === 'porta_social';
  const needsCor = produtoForm.tipo_produto === 'porta_enrolar' || produtoForm.tipo_produto === 'porta_social';

  const totalProdutos = produtos.reduce((acc, produto) => acc + produto.valor, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos do Orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar produto */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_produto">Tipo de Produto</Label>
              <Select
                value={produtoForm.tipo_produto}
                onValueChange={(value) => setProdutoForm({ ...produtoForm, tipo_produto: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porta_enrolar">Porta de Enrolar</SelectItem>
                  <SelectItem value="porta_social">Porta Social</SelectItem>
                  <SelectItem value="acessorio">Acessório</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="adicional">Adicional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={produtoForm.valor}
                onChange={(e) => setProdutoForm({ ...produtoForm, valor: e.target.value })}
              />
            </div>
          </div>

          {needsMedidas && (
            <div className="space-y-2">
              <Label htmlFor="medidas">Medidas</Label>
              <Input
                id="medidas"
                placeholder="Ex: 2,00m x 2,10m"
                value={produtoForm.medidas}
                onChange={(e) => setProdutoForm({ ...produtoForm, medidas: e.target.value })}
              />
            </div>
          )}

          {needsCor && (
            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                placeholder="Ex: Branco, Preto, etc."
                value={produtoForm.cor}
                onChange={(e) => setProdutoForm({ ...produtoForm, cor: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o produto..."
              value={produtoForm.descricao}
              onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
            />
          </div>

          <Button type="button" onClick={adicionarProduto} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>

        {/* Lista de produtos adicionados */}
        {produtos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Produtos Adicionados</h4>
              <span className="text-sm text-muted-foreground">
                Total: R$ {totalProdutos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="space-y-3">
              {produtos.map((produto, index) => (
                <div key={produto.id || index} className="flex items-start justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {produto.tipo_produto === 'porta_enrolar' && 'Porta de Enrolar'}
                        {produto.tipo_produto === 'porta_social' && 'Porta Social'}
                        {produto.tipo_produto === 'acessorio' && 'Acessório'}
                        {produto.tipo_produto === 'manutencao' && 'Manutenção'}
                        {produto.tipo_produto === 'adicional' && 'Adicional'}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        R$ {produto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {produto.medidas && (
                      <p className="text-sm text-muted-foreground">Medidas: {produto.medidas}</p>
                    )}
                    
                    {produto.cor && (
                      <p className="text-sm text-muted-foreground">Cor: {produto.cor}</p>
                    )}
                    
                    <p className="text-sm">{produto.descricao}</p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerProduto(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}