import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, ArrowUpDown, History, Settings, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEstoque, ProdutoEstoque } from "@/hooks/useEstoque";
import { useCategorias } from "@/hooks/useCategorias";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MovimentacaoModal } from "@/components/estoque/MovimentacaoModal";
import { HistoricoModal } from "@/components/estoque/HistoricoModal";
import { AlterarCategoriaModal } from "@/components/estoque/AlterarCategoriaModal";
import { GerenciarCategoriasModal } from "@/components/estoque/GerenciarCategoriasModal";
import { EditarProdutoModal } from "@/components/estoque/EditarProdutoModal";

export default function Estoque() {
  const { produtos, loading, adicionarProduto, editarProduto, movimentarEstoque, alterarCategoria, buscarMovimentacoes } = useEstoque();
  const { categorias } = useCategorias();
  const [modalAberto, setModalAberto] = useState(false);
  const [editarModal, setEditarModal] = useState(false);
  const [categoriasModal, setCategoriasModal] = useState(false);
  const [movimentacaoModal, setMovimentacaoModal] = useState(false);
  const [historicoModal, setHistoricoModal] = useState(false);
  const [categoriaModal, setCategoriaModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  const [formData, setFormData] = useState({
    nome_produto: "",
    descricao_produto: "",
    quantidade: 0,
    unidade: "UN",
    categoria: "geral",
    preco_unitario: 0,
  });

  const getCategoriaColor = (categoriaValue: string) => {
    const cat = categorias.find(c => c.nome.toLowerCase() === categoriaValue.toLowerCase());
    return cat ? `bg-${cat.cor}-500` : "bg-gray-500";
  };

  const getCategoriaLabel = (categoriaValue: string) => {
    const cat = categorias.find(c => c.nome.toLowerCase() === categoriaValue.toLowerCase());
    return cat?.nome || categoriaValue;
  };

  const handleSubmit = async () => {
    await adicionarProduto(formData);
    setFormData({ 
      nome_produto: "", 
      descricao_produto: "", 
      quantidade: 0, 
      unidade: "UN",
      categoria: "geral",
      preco_unitario: 0,
    });
    setModalAberto(false);
  };

  const handleMovimentar = async (tipo: 'entrada' | 'saida', quantidade: number, observacoes?: string) => {
    if (!produtoSelecionado) return;
    await movimentarEstoque({
      produtoId: produtoSelecionado.id,
      tipo,
      quantidade,
      observacoes,
    });
  };

  const handleOpenMovimentacao = (produto: ProdutoEstoque) => {
    setProdutoSelecionado(produto);
    setMovimentacaoModal(true);
  };

  const handleOpenHistorico = (produto: ProdutoEstoque) => {
    setProdutoSelecionado(produto);
    setHistoricoModal(true);
  };

  const handleOpenCategoria = (produto: ProdutoEstoque) => {
    setProdutoSelecionado(produto);
    setCategoriaModal(true);
  };

  const handleAlterarCategoria = async (novaCategoria: string) => {
    if (!produtoSelecionado) return;
    await alterarCategoria({
      produtoId: produtoSelecionado.id,
      novaCategoria,
    });
  };

  const handleEditarProduto = async (id: string, data: any) => {
    await editarProduto({ id, ...data });
  };

  const handleOpenEditar = (produto: ProdutoEstoque) => {
    setProdutoSelecionado(produto);
    setEditarModal(true);
  };

  const { data: movimentacoes = [], isLoading: loadingMovimentacoes } = 
    buscarMovimentacoes(produtoSelecionado?.id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Controle de Estoque</h1>
            <p className="text-muted-foreground">Gestão de materiais e inventário</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoriasModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Categorias
          </Button>
          <Dialog open={modalAberto} onOpenChange={setModalAberto}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Produto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
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
                <div>
                  <Label>Quantidade</Label>
                  <Input 
                    type="number" 
                    value={formData.quantidade} 
                    onChange={(e) => setFormData({...formData, quantidade: parseInt(e.target.value) || 0})} 
                  />
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
                <Button onClick={handleSubmit} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
          <CardDescription>Lista completa de produtos disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.nome_produto}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {produto.descricao_produto || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${getCategoriaColor(produto.categoria)} cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => handleOpenCategoria(produto)}
                    >
                      {getCategoriaLabel(produto.categoria)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">
                      {produto.quantidade} {produto.unidade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">
                      R$ {produto.preco_unitario.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditar(produto)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMovimentacao(produto)}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenHistorico(produto)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum produto cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MovimentacaoModal
        produto={produtoSelecionado}
        open={movimentacaoModal}
        onOpenChange={setMovimentacaoModal}
        onMovimentar={handleMovimentar}
      />

      <HistoricoModal
        produto={produtoSelecionado}
        open={historicoModal}
        onOpenChange={setHistoricoModal}
        movimentacoes={movimentacoes}
        loading={loadingMovimentacoes}
      />

      <GerenciarCategoriasModal
        open={categoriasModal}
        onOpenChange={setCategoriasModal}
      />

      <AlterarCategoriaModal
        produto={produtoSelecionado}
        open={categoriaModal}
        onOpenChange={setCategoriaModal}
        onAlterarCategoria={handleAlterarCategoria}
      />

      <EditarProdutoModal
        produto={produtoSelecionado}
        open={editarModal}
        onOpenChange={setEditarModal}
        onEditar={handleEditarProduto}
      />
    </div>
  );
}
