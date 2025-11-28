import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowUpDown, Tags, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEstoque, ProdutoEstoque } from "@/hooks/useEstoque";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useFornecedores } from "@/hooks/useFornecedores";
import { MovimentacaoModal } from "@/components/estoque/MovimentacaoModal";
import { toast } from "sonner";
import { baixarEstoquePDF, imprimirEstoquePDF } from "@/utils/estoquePDFGenerator";

export default function Estoque() {
  const navigate = useNavigate();
  const { produtos, loading, adicionarProduto, movimentarEstoque } = useEstoque();
  const { categorias } = useCategorias();
  const { subcategorias } = useSubcategorias();
  const { fornecedores } = useFornecedores();
  
  const [novoModal, setNovoModal] = useState(false);
  const [movimentacaoModal, setMovimentacaoModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome_produto: "",
    descricao_produto: "",
    categoria: "",
    subcategoria_id: "",
    quantidade: 0,
    quantidade_ideal: 0,
    custo_unitario: 0,
    unidade: "UN",
    setor_responsavel_producao: "",
    fornecedor_id: "",
    requer_pintura: false,
    pontuacao_producao: 0,
    pontuacao_por_metro: 0,
  });

  const getCategoriaColor = (categoriaId: string) => {
    const cat = categorias.find(c => c.id === categoriaId);
    return cat?.cor || "#gray";
  };

  const getCategoriaLabel = (categoriaId: string) => {
    const cat = categorias.find(c => c.id === categoriaId);
    return cat?.nome || categoriaId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await adicionarProduto({
        nome_produto: formData.nome_produto,
        descricao_produto: formData.descricao_produto,
        quantidade: formData.quantidade,
        quantidade_ideal: formData.quantidade_ideal,
        custo_unitario: formData.custo_unitario,
        unidade: formData.unidade,
        categoria: formData.categoria,
        subcategoria_id: formData.subcategoria_id || null,
        setor_responsavel_producao: formData.setor_responsavel_producao as any,
        fornecedor_id: formData.fornecedor_id || null,
        requer_pintura: formData.requer_pintura,
        pontuacao_producao: formData.pontuacao_producao,
        pontuacao_por_metro: formData.pontuacao_por_metro,
      });
      
      setFormData({
        nome_produto: "",
        descricao_produto: "",
        categoria: "",
        subcategoria_id: "",
        quantidade: 0,
        quantidade_ideal: 0,
        custo_unitario: 0,
        unidade: "UN",
        setor_responsavel_producao: "",
        fornecedor_id: "",
        requer_pintura: false,
        pontuacao_producao: 0,
        pontuacao_por_metro: 0,
      });
      setNovoModal(false);
      toast.success("Produto adicionado com sucesso");
    } catch (error) {
      toast.error("Erro ao adicionar produto");
    }
  };

  const handleMovimentar = async (tipo: 'entrada' | 'saida', quantidade: number, observacoes?: string) => {
    if (!produtoSelecionado) return;
    
    try {
      await movimentarEstoque({
        produtoId: produtoSelecionado.id,
        tipo,
        quantidade,
        observacoes,
      });
      setMovimentacaoModal(false);
      toast.success("Movimentação registrada com sucesso");
    } catch (error) {
      toast.error("Erro ao registrar movimentação");
    }
  };

  const handleOpenMovimentacao = (produto: ProdutoEstoque) => {
    setProdutoSelecionado(produto);
    setMovimentacaoModal(true);
  };

  const handleDoubleClick = (produtoId: string) => {
    navigate(`/dashboard/administrativo/compras/estoque/editar/${produtoId}`);
  };

  const handleDownloadPDF = () => {
    const categoriasMap: Record<string, string> = {};
    categorias.forEach(cat => {
      categoriasMap[cat.id] = cat.nome;
    });
    
    const produtosFiltrados = produtos.filter(p => 
      !searchTerm || 
      p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao_produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    baixarEstoquePDF({
      produtos: produtosFiltrados,
      categoriasMap,
    });
    
    toast.success("PDF gerado com sucesso!");
  };

  const handlePrint = () => {
    const categoriasMap: Record<string, string> = {};
    categorias.forEach(cat => {
      categoriasMap[cat.id] = cat.nome;
    });
    
    const produtosFiltrados = produtos.filter(p => 
      !searchTerm || 
      p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao_produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    imprimirEstoquePDF({
      produtos: produtosFiltrados,
      categoriasMap,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos do estoque
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleDownloadPDF}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          <Button 
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/dashboard/administrativo/compras/estoque/regras-etiquetas")}
          >
            <Tags className="mr-2 h-4 w-4" />
            Regras Etiquetas
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/dashboard/administrativo/compras/estoque/gerenciamento")}
          >
            <Tags className="mr-2 h-4 w-4" />
            Gerenciamento
          </Button>

          <Dialog open={novoModal} onOpenChange={setNovoModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo produto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_produto">Nome do Produto</Label>
                    <Input
                      id="nome_produto"
                      value={formData.nome_produto}
                      onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => {
                        setFormData({ ...formData, categoria: value, subcategoria_id: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.categoria && (
                  <div className="space-y-2">
                    <Label htmlFor="subcategoria_id">Subcategoria</Label>
                    <Select
                      value={formData.subcategoria_id}
                      onValueChange={(value) => setFormData({ ...formData, subcategoria_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma subcategoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategorias
                          .filter((sub) => sub.categoria_id === formData.categoria)
                          .map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="descricao_produto">Descrição</Label>
                  <Input
                    id="descricao_produto"
                    value={formData.descricao_produto}
                    onChange={(e) => setFormData({ ...formData, descricao_produto: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade_ideal">Qtd. Ideal</Label>
                    <Input
                      id="quantidade_ideal"
                      type="number"
                      value={formData.quantidade_ideal}
                      onChange={(e) => setFormData({ ...formData, quantidade_ideal: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidade">Unidade</Label>
                    <Select
                      value={formData.unidade}
                      onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">UN</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="M²">M²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_unitario">Custo Unitário</Label>
                  <Input
                    id="custo_unitario"
                    type="number"
                    step="0.01"
                    value={formData.custo_unitario}
                    onChange={(e) => setFormData({ ...formData, custo_unitario: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setor_responsavel_producao">Setor Responsável</Label>
                    <Select
                      value={formData.setor_responsavel_producao}
                      onValueChange={(value) => setFormData({ ...formData, setor_responsavel_producao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
                        <SelectItem value="soldagem">Soldagem</SelectItem>
                        <SelectItem value="separacao">Separação</SelectItem>
                        <SelectItem value="pintura">Pintura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor_id">Fornecedor</Label>
                    <Select
                      value={formData.fornecedor_id}
                      onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((forn) => (
                          <SelectItem key={forn.id} value={forn.id}>
                            {forn.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requer_pintura"
                    checked={formData.requer_pintura}
                    onChange={(e) => setFormData({ ...formData, requer_pintura: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="requer_pintura" className="cursor-pointer">
                    Este item requer pintura
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pontuacao_producao">Pontuação por Unidade</Label>
                    <Input
                      id="pontuacao_producao"
                      type="number"
                      step="0.01"
                      value={formData.pontuacao_producao}
                      onChange={(e) => setFormData({ ...formData, pontuacao_producao: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pontuacao_por_metro">Pontuação por Metro</Label>
                    <Input
                      id="pontuacao_por_metro"
                      type="number"
                      step="0.01"
                      value={formData.pontuacao_por_metro}
                      onChange={(e) => setFormData({ ...formData, pontuacao_por_metro: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setNovoModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Dica: Clique duas vezes em um item para editá-lo
            </p>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium w-24">SKU</TableHead>
                  <TableHead className="text-xs font-medium">Produto</TableHead>
                  <TableHead className="text-xs font-medium">Categoria</TableHead>
                  <TableHead className="text-xs font-medium">Setor</TableHead>
                  <TableHead className="text-center text-xs font-medium">Pintura</TableHead>
                  <TableHead className="text-center text-xs font-medium">Pts/Un</TableHead>
                  <TableHead className="text-center text-xs font-medium">Pts/M</TableHead>
                  <TableHead className="text-right text-xs font-medium">Estoque</TableHead>
                  <TableHead className="text-right text-xs font-medium">Custo</TableHead>
                  <TableHead className="text-right text-xs font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : produtos.filter(p => 
                    !searchTerm || 
                    p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.descricao_produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-sm text-muted-foreground">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos
                    .filter(p => 
                      !searchTerm || 
                      p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.descricao_produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((produto) => (
                    <TableRow 
                      key={produto.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onDoubleClick={() => handleDoubleClick(produto.id)}
                    >
                      <TableCell className="px-3 py-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {produto.sku || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div>
                          <div className="font-medium text-sm">{produto.nome_produto}</div>
                          {produto.descricao_produto && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {produto.descricao_produto}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge 
                          className="text-xs"
                          style={{ 
                            backgroundColor: getCategoriaColor(produto.categoria),
                            color: 'white'
                          }}
                        >
                          {getCategoriaLabel(produto.categoria)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {produto.setor_responsavel_producao ? (
                          <Badge variant="outline" className="text-xs">
                            {produto.setor_responsavel_producao === 'perfiladeira' ? 'Perfiladeira' :
                             produto.setor_responsavel_producao === 'soldagem' ? 'Soldagem' :
                             produto.setor_responsavel_producao === 'separacao' ? 'Separação' :
                             produto.setor_responsavel_producao === 'pintura' ? 'Pintura' :
                             produto.setor_responsavel_producao}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-3 py-2">
                        {produto.requer_pintura ? (
                          <Badge variant="secondary" className="text-xs">
                            Sim
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-3 py-2">
                        <span className="text-xs font-medium">
                          {produto.pontuacao_producao > 0 ? produto.pontuacao_producao.toFixed(2) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center px-3 py-2">
                        <span className="text-xs font-medium">
                          {produto.pontuacao_por_metro > 0 ? produto.pontuacao_por_metro.toFixed(2) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-3 py-2">
                        <div>
                          <div className={`font-medium text-sm ${
                            produto.quantidade_ideal && produto.quantidade < produto.quantidade_ideal
                              ? 'text-destructive'
                              : ''
                          }`}>
                            {produto.quantidade} {produto.unidade}
                          </div>
                          {produto.quantidade_ideal && (
                            <div className="text-xs text-muted-foreground">
                              Ideal: {produto.quantidade_ideal}
                            </div>
                          )}
                          {produto.quantidade_ideal && produto.quantidade < produto.quantidade_ideal && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Estoque Baixo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-3 py-2">
                        <span className="text-sm font-mono">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(produto.custo_unitario)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-3 py-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMovimentacao(produto);
                          }}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {produtoSelecionado && (
        <MovimentacaoModal
          open={movimentacaoModal}
          onOpenChange={setMovimentacaoModal}
          produto={produtoSelecionado}
          onMovimentar={handleMovimentar}
        />
      )}
    </div>
  );
}
