import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, Loader2, Trash2 } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useVendasCatalogo, ProdutoCatalogoInput } from "@/hooks/useVendasCatalogo";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useCatalogoUpload } from "@/hooks/useCatalogoUpload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CatalogoEditMinimalista() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { editarProduto, inativarProduto } = useVendasCatalogo();
  const { categorias } = useCategorias();
  const uploadMutation = useCatalogoUpload();
  
  const [isLoading, setIsLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const { subcategorias } = useSubcategorias(categoriaSelecionada || undefined);
  
  const [formData, setFormData] = useState<ProdutoCatalogoInput>({
    nome_produto: "",
    descricao_produto: "",
    categoria: "",
    subcategoria_id: undefined,
    preco_venda: 0,
    custo_produto: undefined,
    imagem_url: undefined,
    destaque: false,
    tags: [],
    sku: "",
    tipo_fabricacao: "interno",
    unidade: "Unitário",
  });

  // Carregar dados do produto
  useEffect(() => {
    async function loadProduto() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("vendas_catalogo")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        toast.error("Erro ao carregar produto");
        navigate("/marketing/catalogo");
        return;
      }
      
      if (data) {
        setFormData({
          nome_produto: data.nome_produto,
          descricao_produto: data.descricao_produto || "",
          categoria: data.categoria,
          subcategoria_id: data.subcategoria_id || undefined,
          preco_venda: data.preco_venda,
          custo_produto: data.custo_produto || undefined,
          imagem_url: data.imagem_url || undefined,
          destaque: data.destaque,
          tags: data.tags || [],
          sku: data.sku || "",
          tipo_fabricacao: (data.tipo_fabricacao as 'interno' | 'terceirizado') || "interno",
          unidade: data.unidade || "Unitário",
        });
        setCategoriaSelecionada(data.categoria || "");
      }
      setIsLoading(false);
    }
    
    loadProduto();
  }, [id, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    
    try {
      const url = await uploadMutation.mutateAsync(file);
      setFormData((prev) => ({ ...prev, imagem_url: url }));
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imagem_url: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome_produto.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    
    if (!id) return;
    
    try {
      await editarProduto.mutateAsync({ id, ...formData });
      navigate("/marketing/catalogo");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await inativarProduto.mutateAsync(id);
      navigate("/marketing/catalogo");
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  if (isLoading) {
    return (
      <MinimalistLayout
        title="Editar Produto"
        backPath="/marketing/catalogo"
        breadcrumbItems={[
          { label: "Home", path: "/home" },
          { label: "Vendas", path: "/vendas" },
          { label: "Catálogo", path: "/marketing/catalogo" },
          { label: "Editar" },
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout
      title="Editar Produto"
      backPath="/marketing/catalogo"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Catálogo", path: "/marketing/catalogo" },
        { label: "Editar" },
      ]}
    >
      <div className="space-y-6 max-w-2xl mx-auto pb-20">
        {/* Imagem */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <label className="text-sm text-white/70 mb-2 block">Foto do Produto</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {formData.imagem_url ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5">
              <img
                src={formData.imagem_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="w-full aspect-video rounded-lg border-2 border-dashed border-white/20 
                       flex flex-col items-center justify-center gap-2 text-white/50
                       hover:border-blue-500/50 hover:text-blue-400 transition-colors"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Clique para enviar</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Informações Básicas */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-sm text-white/70 mb-1 block">Nome do Produto *</label>
              <Input
                value={formData.nome_produto}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome_produto: e.target.value }))}
                placeholder="Nome do produto"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-sm text-white/70 mb-1 block">SKU</label>
              <Input
                value={formData.sku || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="Código SKU"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm text-white/70 mb-1 block">Descrição</label>
            <Textarea
              value={formData.descricao_produto || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao_produto: e.target.value }))}
              placeholder="Descrição do produto"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
            />
          </div>
        </div>

        {/* Categoria e Subcategoria */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/70 mb-1 block">Categoria *</label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, categoria: value, subcategoria_id: undefined }));
                  setCategoriaSelecionada(value);
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">Subcategoria</label>
              <Select
                value={formData.subcategoria_id || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subcategoria_id: value }))}
                disabled={!categoriaSelecionada}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {subcategorias?.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Preço e Unidade */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/70 mb-1 block">Preço de Venda *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.preco_venda}
                onChange={(e) => setFormData((prev) => ({ ...prev, preco_venda: Number(e.target.value) }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">Custo</label>
              <Input
                type="number"
                step="0.01"
                value={formData.custo_produto || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, custo_produto: e.target.value ? Number(e.target.value) : undefined }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">Unidade de Venda *</label>
            <Select
              value={formData.unidade || "Unitário"}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, unidade: value }))}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unitário">Unitário</SelectItem>
                <SelectItem value="Metro">Metro</SelectItem>
                <SelectItem value="Kg">Kg</SelectItem>
                <SelectItem value="Litro">Litro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-white/50 mt-1">
              Ex: Metro para itens vendidos por comprimento
            </p>
          </div>
        </div>

        {/* Fabricação e Destaque */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-1 block">Tipo de Fabricação</label>
            <Select
              value={formData.tipo_fabricacao || "interno"}
              onValueChange={(value: "interno" | "terceirizado") => 
                setFormData((prev) => ({ ...prev, tipo_fabricacao: value }))
              }
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interno">Interno</SelectItem>
                <SelectItem value="terceirizado">Terceirizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3">
            <Checkbox
              id="destaque"
              checked={formData.destaque}
              onCheckedChange={(checked) => 
                setFormData((prev) => ({ ...prev, destaque: checked === true }))
              }
            />
            <label htmlFor="destaque" className="text-sm text-white/70 cursor-pointer">
              Produto em destaque
            </label>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover o produto "{formData.nome_produto}" do catálogo.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/marketing/catalogo")}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={editarProduto.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white"
            >
              {editarProduto.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </MinimalistLayout>
  );
}
