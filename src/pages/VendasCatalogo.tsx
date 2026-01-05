import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Pencil, Trash2, Star, Package, Upload, X, Loader2, Palette } from "lucide-react";
import { useVendasCatalogo, ProdutoCatalogoInput } from "@/hooks/useVendasCatalogo";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useCatalogoUpload } from "@/hooks/useCatalogoUpload";
import { toast } from "sonner";

export default function VendasCatalogo() {
  const navigate = useNavigate();
  
  const [editarModal, setEditarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { produtos, isLoading, adicionarProduto, editarProduto, inativarProduto } = useVendasCatalogo({
    busca: busca || undefined,
    categoria: categoriaFiltro || undefined,
  });
  
  const { categorias } = useCategorias();
  const { subcategorias } = useSubcategorias(categoriaSelecionada || undefined);
  const uploadMutation = useCatalogoUpload();

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
    sku: "",
    imagem_url: undefined,
    tipo_fabricacao: "interno",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      const url = await uploadMutation.mutateAsync(file);
      setFormData({ ...formData, imagem_url: url });
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagem_url: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      sku: produto.sku || "",
      imagem_url: produto.imagem_url,
      tipo_fabricacao: produto.tipo_fabricacao || "interno",
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
      sku: "",
      imagem_url: undefined,
      tipo_fabricacao: "interno",
    });
    setCategoriaSelecionada(null);
    setProdutoEditando(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const FormularioProduto = () => (
    <div className="space-y-4">
      {/* Upload de Imagem */}
      <div>
        <Label>Foto de Capa</Label>
        <div className="mt-2">
          {formData.imagem_url ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <img 
                src={formData.imagem_url} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para enviar uma imagem</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</span>
                </>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nome do Produto *</Label>
          <Input
            value={formData.nome_produto}
            onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
            placeholder="Nome do produto"
          />
        </div>
        <div>
          <Label>SKU</Label>
          <Input
            value={formData.sku || ""}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Código SKU"
          />
        </div>
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
      <div>
        <Label>Tipo de Fabricação *</Label>
        <Select
          value={formData.tipo_fabricacao || "interno"}
          onValueChange={(value) => setFormData({ ...formData, tipo_fabricacao: value as 'interno' | 'terceirizado' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="interno">Fabricação Interna</SelectItem>
            <SelectItem value="terceirizado">Terceirizado</SelectItem>
          </SelectContent>
        </Select>
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
      <Button onClick={handleEditar} className="w-full">
        Salvar Alterações
      </Button>
    </div>
  );

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
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/dashboard/vendas/vendas-catalogo/cores")}
          >
            <Palette className="h-4 w-4 mr-2" />
            Gerenciar Cores
          </Button>
          <Button onClick={() => navigate("/dashboard/vendas/vendas-catalogo/novo")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
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
          {produtos.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhum produto no catálogo</p>
              <p className="text-sm">Adicione seu primeiro produto clicando em "Novo Produto"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {produtos.map((produto) => (
                <Card key={produto.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-square relative bg-muted">
                    {produto.imagem_url ? (
                      <img 
                        src={produto.imagem_url} 
                        alt={produto.nome_produto}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                    {produto.destaque && (
                      <Star className="absolute top-2 right-2 h-5 w-5 text-yellow-500 fill-yellow-500 drop-shadow" />
                    )}
                    {produto.quantidade <= produto.estoque_minimo && (
                      <Badge variant="destructive" className="absolute top-2 left-2 text-xs">
                        Baixo estoque
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate" title={produto.nome_produto}>
                      {produto.nome_produto}
                    </h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      R$ {produto.preco_venda.toFixed(2)}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-xs">
                        {produto.categoria}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {produto.quantidade} {produto.unidade}
                      </span>
                    </div>
                    {produto.tipo_fabricacao === 'terceirizado' && (
                      <Badge variant="secondary" className="text-xs mt-2 bg-orange-500/10 text-orange-700 dark:text-orange-400">
                        Terceirizado
                      </Badge>
                    )}
                    <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleOpenEditar(produto)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2"
                        onClick={() => handleInativar(produto.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editarModal} onOpenChange={setEditarModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <FormularioProduto />
        </DialogContent>
      </Dialog>
    </div>
  );
}
