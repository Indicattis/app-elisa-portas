import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, ArrowUpDown, History, Settings, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEstoque, ProdutoEstoque } from "@/hooks/useEstoque";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MovimentacaoModal } from "@/components/estoque/MovimentacaoModal";
import { HistoricoModal } from "@/components/estoque/HistoricoModal";
import { AlterarCategoriaModal } from "@/components/estoque/AlterarCategoriaModal";
import { GerenciarCategoriasModal } from "@/components/estoque/GerenciarCategoriasModal";
import { GerenciarSubcategoriasModal } from "@/components/estoque/GerenciarSubcategoriasModal";
import { EditarProdutoModal } from "@/components/estoque/EditarProdutoModal";

export default function Estoque() {
  const navigate = useNavigate();
  const { produtos, loading, adicionarProduto, editarProduto, excluirProduto, movimentarEstoque, alterarCategoria, buscarMovimentacoes } = useEstoque();
  const { categorias } = useCategorias();
  const { fornecedores } = useFornecedores();
  const [modalAberto, setModalAberto] = useState(false);
  const [editarModal, setEditarModal] = useState(false);
  const [categoriasModal, setCategoriasModal] = useState(false);
  const [subcategoriasModal, setSubcategoriasModal] = useState(false);
  const [movimentacaoModal, setMovimentacaoModal] = useState(false);
  const [historicoModal, setHistoricoModal] = useState(false);
  const [categoriaModal, setCategoriaModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const { subcategorias } = useSubcategorias(categoriaSelecionada || undefined);
  const [formData, setFormData] = useState({
    nome_produto: "",
    descricao_produto: "",
    quantidade: 0,
    quantidade_ideal: 0,
    unidade: "UN",
    categoria: "geral",
    custo_unitario: 0,
    subcategoria_id: null as string | null,
    peso_porta: null as number | null,
    setor_responsavel_producao: null as 'perfiladeira' | 'soldagem' | 'separacao' | 'pintura' | null,
    fornecedor_id: null as string | null,
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
      quantidade_ideal: 0, 
      unidade: "UN",
      categoria: "geral",
      custo_unitario: 0,
      subcategoria_id: null,
      peso_porta: null,
      setor_responsavel_producao: null,
      fornecedor_id: null,
    });
    setCategoriaSelecionada(null);
    setModalAberto(false);
  };

  const handleExcluir = async (produto: ProdutoEstoque) => {
    if (confirm(`Deseja realmente excluir o produto "${produto.nome_produto}"?`)) {
      await excluirProduto(produto.id);
    }
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
          <Button variant="outline" onClick={() => setSubcategoriasModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Subcategorias
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
                    onValueChange={(value) => {
                      setFormData({...formData, categoria: value, subcategoria_id: null});
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
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      subcategoria_id: value === "nenhuma" ? null : value
                    })}
                    disabled={!categoriaSelecionada}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma subcategoria" />
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
                  {!categoriaSelecionada && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione uma categoria primeiro
                    </p>
                  )}
                </div>
                <div>
                  <Label>Peso de Porta Recomendado (kg)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.5"
                    value={formData.peso_porta || ""} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      peso_porta: e.target.value ? parseFloat(e.target.value) : null
                    })} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio se não aplicável
                  </p>
                </div>
                <div>
                  <Label>Setor Responsável pela Produção</Label>
                  <Select 
                    value={formData.setor_responsavel_producao || "nenhum"} 
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      setor_responsavel_producao: value === "nenhum" ? null : value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
                      <SelectItem value="solda">Solda</SelectItem>
                      <SelectItem value="separacao">Separação</SelectItem>
                      <SelectItem value="pintura">Pintura</SelectItem>
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
                  <Label>Quantidade Ideal</Label>
                  <Input 
                    type="number" 
                    value={formData.quantidade_ideal} 
                    onChange={(e) => setFormData({...formData, quantidade_ideal: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div>
                  <Label>Custo Unitário (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.custo_unitario} 
                    onChange={(e) => setFormData({...formData, custo_unitario: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Select 
                    value={formData.fornecedor_id || "nenhum"} 
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      fornecedor_id: value === "nenhum" ? null : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <TableHead>Subcategoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Peso Porta</TableHead>
                <TableHead>Setor Produção</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
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
                  <TableCell>
                    {produto.subcategoria ? (
                      <Badge variant="outline">
                        {produto.subcategoria.nome}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {produto.fornecedor ? (
                      <span className="text-sm font-medium">
                        {produto.fornecedor.nome}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {produto.peso_porta ? (
                      <span className="text-sm font-medium">
                        {produto.peso_porta} kg
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {produto.setor_responsavel_producao ? (
                      <Badge 
                        variant="secondary"
                        className={
                          produto.setor_responsavel_producao === 'perfiladeira' ? 'bg-blue-100 text-blue-800' :
                          produto.setor_responsavel_producao === 'soldagem' ? 'bg-orange-100 text-orange-800' :
                          produto.setor_responsavel_producao === 'separacao' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }
                      >
                        {produto.setor_responsavel_producao === 'perfiladeira' ? 'Perfiladeira' :
                         produto.setor_responsavel_producao === 'soldagem' ? 'Soldagem' :
                         produto.setor_responsavel_producao === 'separacao' ? 'Separação' :
                         'Pintura'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {produto.quantidade < produto.quantidade_ideal && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Estoque Baixo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">
                        {produto.quantidade} {produto.unidade}
                      </span>
                      {produto.quantidade_ideal > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Ideal: {produto.quantidade_ideal}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">
                      R$ {produto.custo_unitario.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/estoque/editar/${produto.id}`)}
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
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleExcluir(produto)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
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

      <GerenciarSubcategoriasModal
        open={subcategoriasModal}
        onOpenChange={setSubcategoriasModal}
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
