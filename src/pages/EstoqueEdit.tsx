import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Trash2, History } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useEstoque } from "@/hooks/useEstoque";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export default function EstoqueEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { editarProduto, excluirProduto, buscarMovimentacoes } = useEstoque();
  const { categorias } = useCategorias();
  const { subcategorias } = useSubcategorias();
  const { fornecedores } = useFornecedores();

  const [formData, setFormData] = useState<{
    nome_produto: string;
    descricao_produto: string;
    quantidade: number;
    quantidade_ideal: number;
    unidade: string;
    categoria: string;
    custo_unitario: number;
    subcategoria_id: string;
    peso_porta: number;
    setor_responsavel_producao: string;
    fornecedor_id: string;
    requer_pintura: boolean;
    pontuacao_producao: number;
  }>({
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
    requer_pintura: false,
    pontuacao_producao: 0,
  });

  const [dadosCarregados, setDadosCarregados] = useState(false);

  const { data: produto, isLoading } = useQuery({
    queryKey: ["produto", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      
      const { data, error } = await supabase
        .from("estoque")
        .select(`
          *,
          subcategoria:estoque_subcategorias(id, nome),
          fornecedor:fornecedores(id, nome)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Produto não encontrado");
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (produto) {
      console.log('[EstoqueEdit] Carregando produto:', produto);
      console.log('[EstoqueEdit] setor_responsavel_producao:', produto.setor_responsavel_producao);
      console.log('[EstoqueEdit] requer_pintura:', produto.requer_pintura);
      
      // Normalizar categoria: converter espaços para underscore
      const categoriaNormalizada = produto.categoria?.replace(/ /g, '_') || "geral";
      
      const newFormData = {
        nome_produto: produto.nome_produto || "",
        descricao_produto: produto.descricao_produto || "",
        quantidade: Number(produto.quantidade) || 0,
        quantidade_ideal: Number(produto.quantidade_ideal) || 0,
        unidade: produto.unidade || "UN",
        categoria: categoriaNormalizada,
        custo_unitario: Number(produto.custo_unitario) || 0,
        subcategoria_id: produto.subcategoria_id || "",
        peso_porta: Number(produto.peso_porta) || 0,
        setor_responsavel_producao: produto.setor_responsavel_producao || "",
        fornecedor_id: produto.fornecedor_id || "",
        requer_pintura: produto.requer_pintura === true,
        pontuacao_producao: Number(produto.pontuacao_producao) || 0,
      };
      
      console.log('[EstoqueEdit] Novo formData:', newFormData);
      console.log('[EstoqueEdit] formData.setor_responsavel_producao:', newFormData.setor_responsavel_producao);
      console.log('[EstoqueEdit] formData.requer_pintura:', newFormData.requer_pintura);
      setFormData(newFormData);
      setDadosCarregados(true);
    }
  }, [produto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[EstoqueEdit] handleSubmit - formData antes de salvar:', formData);
    console.log('[EstoqueEdit] handleSubmit - requer_pintura:', formData.requer_pintura);
    
    try {
      // Converter categoria de volta para formato do banco (underscore -> espaço)
      const categoriaBanco = formData.categoria.replace(/_/g, ' ');
      
      const dadosParaSalvar = {
        id: id!,
        nome_produto: formData.nome_produto,
        descricao_produto: formData.descricao_produto || undefined,
        quantidade: formData.quantidade,
        quantidade_ideal: formData.quantidade_ideal,
        unidade: formData.unidade,
        categoria: categoriaBanco,
        custo_unitario: formData.custo_unitario,
        subcategoria_id: formData.subcategoria_id || null,
        peso_porta: formData.peso_porta || null,
        setor_responsavel_producao: (formData.setor_responsavel_producao || null) as 'perfiladeira' | 'soldagem' | 'separacao' | 'pintura' | null,
        fornecedor_id: formData.fornecedor_id || null,
        requer_pintura: formData.requer_pintura,
        pontuacao_producao: formData.pontuacao_producao,
      };
      
      console.log('[EstoqueEdit] handleSubmit - dados que serão salvos:', dadosParaSalvar);
      
      await editarProduto(dadosParaSalvar);

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

  const { data: movimentacoes = [], isLoading: loadingMovimentacoes } = 
    buscarMovimentacoes(id || undefined);

  const subcategoriasFiltradas = subcategorias.filter(
    (sub) => sub.categoria_id === formData.categoria
  );

  const handleExcluir = async () => {
    if (!id) return;
    
    try {
      await excluirProduto(id);
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
      navigate("/dashboard/administrativo/compras/estoque");
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading || !dadosCarregados) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando dados do produto...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/administrativo/compras/estoque")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Visualizar e Editar Produto</h1>
          <p className="text-muted-foreground">Visualize e modifique as informações do produto</p>
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
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="componente">Componente</SelectItem>
                    <SelectItem value="materia_prima">Matéria Prima</SelectItem>
                    <SelectItem value="ferramentas">Ferramentas</SelectItem>
                    <SelectItem value="consumivel">Consumível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategoria_id">Subcategoria</Label>
                <Select
                  value={formData.subcategoria_id || undefined}
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
                  value={formData.fornecedor_id || undefined}
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
                  value={formData.setor_responsavel_producao || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, setor_responsavel_producao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
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
                <Label htmlFor="pontuacao_producao">Pontuação por Unidade</Label>
                <Input
                  id="pontuacao_producao"
                  type="number"
                  step="0.01"
                  value={formData.pontuacao_producao}
                  onChange={(e) =>
                    setFormData({ ...formData, pontuacao_producao: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
              <input
                type="checkbox"
                id="requer_pintura"
                checked={formData.requer_pintura}
                onChange={(e) => setFormData({ ...formData, requer_pintura: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="requer_pintura" className="cursor-pointer font-medium">
                Este item requer pintura na produção
              </Label>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Produto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExcluir}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Movimentações
          </CardTitle>
          <CardDescription>
            Todas as movimentações deste produto no estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMovimentacoes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : movimentacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma movimentação registrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Estoque Anterior</TableHead>
                  <TableHead>Estoque Novo</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov: any) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mov.tipo_movimentacao === "entrada" ? "default" : "destructive"}>
                        {mov.tipo_movimentacao === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell>{mov.quantidade}</TableCell>
                    <TableCell>{mov.quantidade_anterior}</TableCell>
                    <TableCell>{mov.quantidade_nova}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {mov.observacoes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
