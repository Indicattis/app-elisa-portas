import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { useVendasCatalogo, ProdutoCatalogoInput } from "@/hooks/useVendasCatalogo";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useCatalogoUpload } from "@/hooks/useCatalogoUpload";
import { toast } from "sonner";

export default function VendasCatalogoNovo() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);

  const { adicionarProduto } = useVendasCatalogo();
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

  const handleSubmit = async () => {
    if (!formData.nome_produto.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    try {
      await adicionarProduto.mutateAsync(formData);
      navigate("/dashboard/vendas/vendas-catalogo");
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/vendas/vendas-catalogo")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground">Adicionar item ao catálogo de vendas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>Preencha os dados do produto para adicionar ao catálogo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate("/dashboard/vendas/vendas-catalogo")} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={adicionarProduto.isPending}>
              {adicionarProduto.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Adicionar ao Catálogo"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
