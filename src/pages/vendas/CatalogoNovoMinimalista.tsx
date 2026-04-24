import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Upload, Loader2, Trash2 } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useVendasCatalogo, ProdutoCatalogoInput } from "@/hooks/useVendasCatalogo";

interface Categoria {
  id: string;
  nome: string;
}

interface Subcategoria {
  id: string;
  nome: string;
  categoria_id: string;
}

export default function CatalogoNovoMinimalista() {
  const navigate = useNavigate();
  const { adicionarProduto } = useVendasCatalogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");

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

  // Carregar categorias
  useEffect(() => {
    const loadCategorias = async () => {
      const { data } = await supabase
        .from("estoque_categorias")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (data) setCategorias(data);
    };
    loadCategorias();
  }, []);

  // Carregar subcategorias quando categoria mudar
  useEffect(() => {
    const loadSubcategorias = async () => {
      if (!categoriaSelecionada) {
        setSubcategorias([]);
        return;
      }
      
      const categoriaObj = categorias.find(c => c.nome === categoriaSelecionada);
      if (!categoriaObj) return;

      const { data } = await supabase
        .from("estoque_subcategorias")
        .select("id, nome, categoria_id")
        .eq("categoria_id", categoriaObj.id)
        .eq("ativo", true)
        .order("nome");
      if (data) setSubcategorias(data);
    };
    loadSubcategorias();
  }, [categoriaSelecionada, categorias]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `catalogo/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("produtos")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, imagem_url: publicUrl }));
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imagem_url: undefined }));
  };

  const handleSubmit = async () => {
    if (!formData.nome_produto || !formData.categoria) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      await adicionarProduto.mutateAsync(formData);
      navigate("/marketing/catalogo");
    } catch (error) {
      console.error("Erro ao criar produto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MinimalistLayout
      title="Novo Produto"
      subtitle="Adicionar ao catálogo"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Catálogo", path: "/marketing/catalogo" },
        { label: "Novo" },
      ]}
    >
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/marketing/catalogo")}
            className="text-white/70 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>

        {/* Imagem do produto */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <label className="text-sm text-white/70 mb-2 block">
            Foto do Produto
          </label>
          <div className="flex items-center gap-4">
            {formData.imagem_url ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                <img
                  src={formData.imagem_url}
                  alt="Produto"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full hover:bg-red-500"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-white/40" />
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Informações básicas */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-white/70 mb-1 block">
                Nome do Produto *
              </label>
              <Input
                value={formData.nome_produto}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nome_produto: e.target.value,
                  }))
                }
                placeholder="Nome do produto"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">SKU</label>
              <Input
                value={formData.sku || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Código único"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                Tipo de Fabricação
              </label>
              <Select
                value={formData.tipo_fabricacao}
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
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">
              Descrição
            </label>
            <Textarea
              value={formData.descricao_produto || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  descricao_produto: e.target.value,
                }))
              }
              placeholder="Descrição do produto..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
            />
          </div>
        </div>

        {/* Categoria e Subcategoria */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                Categoria *
              </label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    categoria: value,
                    subcategoria_id: undefined,
                  }));
                  setCategoriaSelecionada(value);
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                Subcategoria
              </label>
              <Select
                value={formData.subcategoria_id || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subcategoria_id: value || undefined,
                  }))
                }
                disabled={!categoriaSelecionada}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {subcategorias.map((sub) => (
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
              <label className="text-sm text-white/70 mb-1 block">
                Preço de Venda *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.preco_venda}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preco_venda: Number(e.target.value),
                  }))
                }
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">Custo</label>
              <Input
                type="number"
                step="0.01"
                value={formData.custo_produto || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    custo_produto: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">
              Unidade de Venda *
            </label>
            <Select
              value={formData.unidade || "Unitário"}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, unidade: value }))
              }
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

        {/* Opções */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Produto em destaque</p>
              <p className="text-sm text-white/50">
                Exibir em posição de destaque no catálogo
              </p>
            </div>
            <Switch
              checked={formData.destaque || false}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, destaque: checked }))
              }
            />
          </div>
        </div>
      </div>
    </MinimalistLayout>
  );
}
