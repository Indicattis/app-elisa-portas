import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useEstoque } from "@/hooks/useEstoque";

export default function EstoqueEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { editarProduto } = useEstoque();
  const { categorias } = useCategorias();
  const { subcategorias } = useSubcategorias();
  const { fornecedores } = useFornecedores();

  const [formData, setFormData] = useState({
    nome_produto: "",
    descricao_produto: "",
    quantidade: 0,
    quantidade_ideal: 0,
    unidade: "UN",
    categoria: "geral",
    custo_unitario: 0,
    subcategoria_id: "",
    peso_porta: 0,
    setor_responsavel_producao: "",
    fornecedor_id: "",
  });

  const { data: produto, isLoading } = useQuery({
    queryKey: ["produto", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque")
        .select(`
          *,
          subcategoria:estoque_subcategorias(id, nome),
          fornecedor:fornecedores(id, nome)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome_produto: produto.nome_produto || "",
        descricao_produto: produto.descricao_produto || "",
        quantidade: produto.quantidade || 0,
        quantidade_ideal: produto.quantidade_ideal || 0,
        unidade: produto.unidade || "UN",
        categoria: produto.categoria || "geral",
        custo_unitario: produto.custo_unitario || 0,
        subcategoria_id: produto.subcategoria_id || "",
        peso_porta: produto.peso_porta || 0,
        setor_responsavel_producao: produto.setor_responsavel_producao || "",
        fornecedor_id: produto.fornecedor_id || "",
      });
    }
  }, [produto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await editarProduto({
        id: id!,
        nome_produto: formData.nome_produto,
        descricao_produto: formData.descricao_produto || undefined,
        quantidade: formData.quantidade,
        quantidade_ideal: formData.quantidade_ideal,
        unidade: formData.unidade,
        categoria: formData.categoria,
        custo_unitario: formData.custo_unitario,
        subcategoria_id: formData.subcategoria_id || null,
        peso_porta: formData.peso_porta || null,
        setor_responsavel_producao: formData.setor_responsavel_producao as any || null,
        fornecedor_id: formData.fornecedor_id || null,
      });

      toast({
        title: "Produto atualizado",
        description: "As informações do produto foram atualizadas com sucesso.",
      });

      navigate("/dashboard/estoque");
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const subcategoriasFiltradas = subcategorias.filter(
    (sub) => sub.categoria_id === formData.categoria
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/estoque")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Produto</h1>
          <p className="text-muted-foreground">Atualize as informações do produto em estoque</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>Preencha os dados do produto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_produto">Nome do Produto *</Label>
                <Input
                  id="nome_produto"
                  value={formData.nome_produto}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_produto: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoria: value, subcategoria_id: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
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

              <div className="space-y-2">
                <Label htmlFor="subcategoria_id">Subcategoria</Label>
                <Select
                  value={formData.subcategoria_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subcategoria_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriasFiltradas.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor_id">Fornecedor</Label>
                <Select
                  value={formData.fornecedor_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fornecedor_id: value })
                  }
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

              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade Atual *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={formData.quantidade}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade_ideal">Quantidade Ideal *</Label>
                <Input
                  id="quantidade_ideal"
                  type="number"
                  value={formData.quantidade_ideal}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidade_ideal: parseInt(e.target.value) || 0 })
                  }
                  required
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
                    <SelectItem value="UN">Unidade (UN)</SelectItem>
                    <SelectItem value="KG">Quilograma (KG)</SelectItem>
                    <SelectItem value="L">Litro (L)</SelectItem>
                    <SelectItem value="M">Metro (M)</SelectItem>
                    <SelectItem value="M2">Metro Quadrado (M²)</SelectItem>
                    <SelectItem value="CX">Caixa (CX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo_unitario">Custo Unitário (R$)</Label>
                <Input
                  id="custo_unitario"
                  type="number"
                  step="0.01"
                  value={formData.custo_unitario}
                  onChange={(e) =>
                    setFormData({ ...formData, custo_unitario: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso_porta">Peso por Porta (kg)</Label>
                <Input
                  id="peso_porta"
                  type="number"
                  step="0.01"
                  value={formData.peso_porta}
                  onChange={(e) =>
                    setFormData({ ...formData, peso_porta: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor_responsavel_producao">Setor de Produção</Label>
                <Select
                  value={formData.setor_responsavel_producao}
                  onValueChange={(value) =>
                    setFormData({ ...formData, setor_responsavel_producao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
                    <SelectItem value="solda">Solda</SelectItem>
                    <SelectItem value="separacao">Separação</SelectItem>
                    <SelectItem value="pintura">Pintura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_produto">Descrição</Label>
              <Textarea
                id="descricao_produto"
                value={formData.descricao_produto}
                onChange={(e) =>
                  setFormData({ ...formData, descricao_produto: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/estoque")}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
