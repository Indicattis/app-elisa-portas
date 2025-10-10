import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Search, Plus, Package } from "lucide-react";
import { useEstoque, ProdutoEstoque } from "@/hooks/useEstoque";
import { PedidoLinhaNova } from "@/hooks/useVendasPedidos";

interface EstoqueSelectorProps {
  onSelect: (linha: PedidoLinhaNova) => void;
}

export const EstoqueSelector = ({ onSelect }: EstoqueSelectorProps) => {
  const { produtos, loading, buscarProdutos } = useEstoque();
  const [searchTerm, setSearchTerm] = useState("");
  const [modoManual, setModoManual] = useState(false);
  const [formData, setFormData] = useState<PedidoLinhaNova>({
    nome_produto: "",
    descricao_produto: "",
    quantidade: 1,
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    buscarProdutos(value);
  };

  const handleSelectProduto = (produto: ProdutoEstoque) => {
    setFormData({
      estoque_id: produto.id,
      nome_produto: produto.nome_produto,
      descricao_produto: produto.descricao_produto || "",
      quantidade: 1,
    });
    setModoManual(true);
  };

  const handleSubmit = () => {
    if (formData.nome_produto && formData.quantidade > 0) {
      onSelect(formData);
      setFormData({ nome_produto: "", descricao_produto: "", quantidade: 1 });
      setModoManual(false);
      setSearchTerm("");
    }
  };

  if (modoManual) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nome do Produto *</Label>
          <Input
            value={formData.nome_produto}
            onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
            placeholder="Nome do produto"
          />
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            value={formData.descricao_produto}
            onChange={(e) => setFormData({ ...formData, descricao_produto: e.target.value })}
            placeholder="Descrição (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label>Quantidade *</Label>
          <Input
            type="number"
            min="1"
            value={formData.quantidade}
            onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setModoManual(false);
              setFormData({ nome_produto: "", descricao_produto: "", quantidade: 1 });
            }}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Buscar no Estoque</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="h-[300px] border rounded-lg">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Carregando...</div>
        ) : produtos.length > 0 ? (
          <div className="p-2 space-y-2">
            {produtos.map((produto) => (
              <Card
                key={produto.id}
                className="p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelectProduto(produto)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{produto.nome_produto}</div>
                    {produto.descricao_produto && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {produto.descricao_produto}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Estoque: {produto.quantidade} {produto.unidade}
                    </div>
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </ScrollArea>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setModoManual(true);
          setFormData({ nome_produto: searchTerm, descricao_produto: "", quantidade: 1 });
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Produto Manualmente
      </Button>
    </div>
  );
};
