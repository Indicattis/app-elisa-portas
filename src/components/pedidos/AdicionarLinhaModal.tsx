import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useEstoque } from "@/hooks/useEstoque";
import { Search, Package } from "lucide-react";
import type { CategoriaLinha, PedidoLinhaNova } from "@/hooks/usePedidoLinhas";

interface AdicionarLinhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaLinha;
  portaId: string;
  onAdicionar: (linha: PedidoLinhaNova) => Promise<any>;
}

const CATEGORIA_LABELS = {
  separacao: "Separação",
  solda: "Solda",
  perfiladeira: "Perfiladeira",
};

export function AdicionarLinhaModal({ open, onOpenChange, categoria, portaId, onAdicionar }: AdicionarLinhaModalProps) {
  const [busca, setBusca] = useState("");
  const [modoManual, setModoManual] = useState(false);
  const [formData, setFormData] = useState<PedidoLinhaNova>({
    produto_venda_id: portaId,
    nome_produto: "",
    descricao_produto: "",
    quantidade: 1,
    tamanho: "",
    categoria_linha: categoria,
  });

  const { produtos, buscarProdutos } = useEstoque();

  const handleBuscar = (termo: string) => {
    setBusca(termo);
    buscarProdutos(termo);
  };

  const handleSelecionarProduto = (produto: any) => {
    setFormData({
      produto_venda_id: portaId,
      nome_produto: produto.nome_produto,
      descricao_produto: produto.descricao_produto || "",
      quantidade: 1,
      tamanho: "",
      estoque_id: produto.id,
      categoria_linha: categoria,
    });
    setModoManual(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome_produto || formData.quantidade <= 0) {
      return;
    }

    await onAdicionar(formData);
    
    setFormData({
      produto_venda_id: portaId,
      nome_produto: "",
      descricao_produto: "",
      quantidade: 1,
      tamanho: "",
      categoria_linha: categoria,
    });
    setModoManual(false);
    setBusca("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base">Adicionar Item - {CATEGORIA_LABELS[categoria]}</DialogTitle>
        </DialogHeader>

        {!modoManual ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto no estoque..."
                value={busca}
                onChange={(e) => handleBuscar(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {produtos.map((produto) => (
                  <Card
                    key={produto.id}
                    className="p-2 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelecionarProduto(produto)}
                  >
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{produto.nome_produto}</p>
                        {produto.descricao_produto && (
                          <p className="text-xs text-muted-foreground truncate">{produto.descricao_produto}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Disponível: {produto.quantidade} {produto.unidade || 'UN'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => {
                setModoManual(true);
                setFormData(prev => ({ ...prev, nome_produto: busca }));
              }}
            >
              Adicionar Produto Manualmente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs">Nome do Produto</Label>
              <Input
                id="nome"
                value={formData.nome_produto}
                onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={formData.descricao_produto}
                onChange={(e) => setFormData({ ...formData, descricao_produto: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="quantidade" className="text-xs">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tamanho" className="text-xs">Tamanho (opcional)</Label>
                <Input
                  id="tamanho"
                  value={formData.tamanho}
                  onChange={(e) => setFormData({ ...formData, tamanho: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {modoManual && (
            <Button variant="ghost" onClick={() => setModoManual(false)} className="h-8 text-xs">
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Cancelar
          </Button>
          {modoManual && (
            <Button onClick={handleSubmit} className="h-8 text-xs">
              Adicionar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
