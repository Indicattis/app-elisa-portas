import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Pencil, Trash2, Star, Package } from "lucide-react";
import { useVendasCatalogo, ProdutoCatalogoInput } from "@/hooks/useVendasCatalogo";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";

export default function VendasCatalogo() {
  const [modalAberto, setModalAberto] = useState(false);
  const [editarModal, setEditarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  
  const { produtos, isLoading, adicionarProduto, editarProduto, inativarProduto } = useVendasCatalogo({
    busca: busca || undefined,
    categoria: categoriaFiltro || undefined,
  });
  
  const { categorias } = useCategorias();
  const { subcategorias } = useSubcategorias(categoriaSelecionada || undefined);

  const [formData, setFormData] = useState<ProdutoCatalogoInput>({
    nome_produto: "",
    descricao_produto: "",
    categoria: "geral",
    subcategoria_id: undefined,
    quantidade: 0,
    unidade: "UN",
    preco_venda: 0,
    custo_produto: 0,
    peso: undefined,
    destaque: false,
    estoque_minimo: 0,
    tags: [],
  });

  const handleSubmit = async () => {
    await adicionarProduto.mutateAsync(formData);
    resetForm();
    setModalAberto(false);
  };

  const handleEditar = async () => {
    if (!produtoEditando) return;
    await editarProduto.mutateAsync({
      id: produtoEditando.id,
      ...formData,
    });
    resetForm();
    setEditarModal(false);
  };

  const handleInativar = async (id: string) => {
    if (confirm("Deseja realmente remover este produto do catálogo?")) {
      await inativarProduto.mutateAsync(id);
    }
  };

  const handleOpenEditar = (produto: any) => {
    setProdutoEditando(produto);
    setFormData({
      nome_produto: produto.nome_produto,
      descricao_produto: produto.descricao_produto || "",
      categoria: produto.categoria,
      subcategoria_id: produto.subcategoria_id,
      quantidade: produto.quantidade,
      unidade: produto.unidade,
      preco_venda: produto.preco_venda,
      custo_produto: produto.custo_produto || 0,
      peso: produto.peso,
      destaque: produto.destaque,
      estoque_minimo: produto.estoque_minimo,
      tags: produto.tags || [],
    });
    const catId = categorias.find(c => c.nome.toLowerCase() === produto.categoria.toLowerCase())?.id;
    setCategoriaSelecionada(catId || null);
    setEditarModal(true);
  };

  const resetForm = () => {
    setFormData({
      nome_produto: "",
      descricao_produto: "",
      categoria: "geral",
      subcategoria_id: undefined,
      quantidade: 0,
      unidade: "UN",
      preco_venda: 0,
      custo_produto: 0,
      peso: undefined,
      destaque: false,
      estoque_minimo: 0,
      tags: [],
    });
    setCategoriaSelecionada(null);
    setProdutoEditando(null);
  };

  const FormularioProduto = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label>Nome do Produto *</Label>
        <Input
          value={formData.nome_produto}
          onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
          placeholder="Nome do produto"
        />
      </div>
      <div>
        <Label>Descrição</Label>
        <Input
          value={formData.descricao_produto}
          onChange={(e) => setFormData({ ...formData, descricao_produto: e.target.value })}
          placeholder="Descrição detalhada"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Categoria *</Label>
          <Select
            value={formData.categoria}
            onValueChange={(value) => {
              setFormData({ ...formData, categoria: value, subcategoria_id: undefined });
              const catId = categorias.find(c => c.nome.toLowerCase() === value.toLowerCase())?.id;
              setCategoriaSelecionada(catId || null);
            }}
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
        <div>
          <Label>Subcategoria</Label>
          <Select
            value={formData.subcategoria_id || "nenhuma"}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                subcategoria_id: value === "nenhuma" ? undefined : value,
              })
            }
            disabled={!categoriaSelecionada}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhuma">Nenhuma</SelectItem>
              {subcategorias.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Quantidade *</Label>
          <Input
            type="number"
            value={formData.quantidade}
            onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Unidade</Label>
          <Input
            value={formData.unidade}
            onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
          />
        </div>
        <div>
          <Label>Estoque Mínimo</Label>
          <Input
            type="number"
            value={formData.estoque_minimo}
            onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Preço de Venda *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.preco_venda}
            onChange={(e) => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Custo do Produto</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.custo_produto}
            onChange={(e) => setFormData({ ...formData, custo_produto: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div>
        <Label>Peso (kg)</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.peso || ""}
          onChange={(e) => setFormData({ ...formData, peso: e.target.value ? parseFloat(e.target.value) : undefined })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="destaque"
          checked={formData.destaque}
          onCheckedChange={(checked) => setFormData({ ...formData, destaque: checked as boolean })}
        />
        <Label htmlFor="destaque" className="cursor-pointer font-normal">
          Produto em destaque
        </Label>
      </div>
      <Button onClick={isEdit ? handleEditar : handleSubmit} className="w-full">
        {isEdit ? "Salvar Alterações" : "Adicionar ao Catálogo"}
      </Button>
    </div>
  );

  const calcularMargem = (preco: number, custo: number) => {
    if (preco === 0) return 0;
    return ((preco - custo) / preco) * 100;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Catálogo de Vendas</h1>
            <p className="text-muted-foreground">Produtos disponíveis para venda avulsa</p>
          </div>
        </div>
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Produto ao Catálogo</DialogTitle>
            </DialogHeader>
            <FormularioProduto />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={categoriaFiltro || "todas"} onValueChange={(value) => setCategoriaFiltro(value === "todas" ? "" : value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.nome.toLowerCase()}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos no Catálogo</CardTitle>
          <CardDescription>
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""} disponível{produtos.length !== 1 ? "eis" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Preço Venda</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {produto.destaque && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <div>
                        <div className="font-medium">{produto.nome_produto}</div>
                        {produto.descricao_produto && (
                          <div className="text-sm text-muted-foreground">{produto.descricao_produto}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{produto.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={produto.quantidade <= produto.estoque_minimo ? "text-red-600 font-semibold" : ""}>
                      {produto.quantidade} {produto.unidade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">R$ {produto.preco_venda.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    R$ {(produto.custo_produto || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        calcularMargem(produto.preco_venda, produto.custo_produto || 0) > 30
                          ? "default"
                          : "secondary"
                      }
                    >
                      {calcularMargem(produto.preco_venda, produto.custo_produto || 0).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEditar(produto)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleInativar(produto.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum produto no catálogo</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editarModal} onOpenChange={setEditarModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <FormularioProduto isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}
