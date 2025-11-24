import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useEstoque } from "@/hooks/useEstoque";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EstoqueGerenciamento() {
  const navigate = useNavigate();
  const { categorias, loading: loadingCategorias, adicionarCategoria, editarCategoria, removerCategoria } = useCategorias();
  const { subcategorias, loading: loadingSubcategorias, adicionarSubcategoria, removerSubcategoria } = useSubcategorias();
  const { buscarMovimentacoes } = useEstoque();

  // Estados para categorias
  const [novaCategoria, setNovaCategoria] = useState({ nome: "", cor: "#3B82F6" });
  const [editando, setEditando] = useState<string | null>(null);
  const [categoriaParaRemover, setCategoriaParaRemover] = useState<string | null>(null);

  // Estados para subcategorias
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [novaSubcategoria, setNovaSubcategoria] = useState({ nome: "", descricao: "" });

  // Buscar todas as movimentações
  const { data: movimentacoes = [], isLoading: loadingMovimentacoes } = buscarMovimentacoes();

  // Handlers para categorias
  const handleSubmitCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaCategoria.nome.trim()) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    try {
      if (editando) {
        await editarCategoria({
          id: editando,
          nome: novaCategoria.nome,
          cor: novaCategoria.cor,
        });
        toast.success("Categoria atualizada com sucesso");
        setEditando(null);
      } else {
        await adicionarCategoria({
          nome: novaCategoria.nome,
          cor: novaCategoria.cor,
        });
        toast.success("Categoria adicionada com sucesso");
      }
      setNovaCategoria({ nome: "", cor: "#3B82F6" });
    } catch (error) {
      toast.error(editando ? "Erro ao atualizar categoria" : "Erro ao adicionar categoria");
    }
  };

  const handleEditarCategoria = (categoria: any) => {
    setEditando(categoria.id);
    setNovaCategoria({
      nome: categoria.nome,
      cor: categoria.cor,
    });
  };

  const handleCancelarEdicao = () => {
    setEditando(null);
    setNovaCategoria({ nome: "", cor: "#3B82F6" });
  };

  const handleRemoverCategoria = async () => {
    if (!categoriaParaRemover) return;

    try {
      await removerCategoria(categoriaParaRemover);
      toast.success("Categoria removida com sucesso");
      setCategoriaParaRemover(null);
    } catch (error) {
      toast.error("Erro ao remover categoria");
    }
  };

  // Handlers para subcategorias
  const handleAdicionarSubcategoria = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoriaSelecionada) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (!novaSubcategoria.nome.trim()) {
      toast.error("O nome da subcategoria é obrigatório");
      return;
    }

    try {
      await adicionarSubcategoria({
        nome: novaSubcategoria.nome,
        descricao: novaSubcategoria.descricao,
        categoria_id: categoriaSelecionada,
      });
      toast.success("Subcategoria adicionada com sucesso");
      setNovaSubcategoria({ nome: "", descricao: "" });
    } catch (error) {
      toast.error("Erro ao adicionar subcategoria");
    }
  };

  const handleRemoverSubcategoria = async (id: string) => {
    try {
      await removerSubcategoria(id);
      toast.success("Subcategoria removida com sucesso");
    } catch (error) {
      toast.error("Erro ao remover subcategoria");
    }
  };

  const getCorClass = (cor: string) => {
    return `bg-[${cor}] text-white`;
  };

  const subcategoriasFiltradas = subcategorias.filter(
    (sub) => sub.categoria_id === categoriaSelecionada
  );

  const getTipoMovimentacaoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      entrada: "Entrada",
      saida: "Saída",
      ajuste: "Ajuste",
      alteracao_categoria: "Alteração de Categoria",
    };
    return tipos[tipo] || tipo;
  };

  const getTipoMovimentacaoVariant = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      entrada: "default",
      saida: "destructive",
      ajuste: "secondary",
      alteracao_categoria: "secondary",
    };
    return variants[tipo] || "default";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/administrativo/compras/estoque")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Estoque</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie categorias, subcategorias e visualize movimentações
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categorias" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="subcategorias">Subcategorias</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        {/* Aba Categorias */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Categorias</CardTitle>
              <CardDescription>
                Adicione, edite ou remova categorias de produtos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulário */}
              <form onSubmit={handleSubmitCategoria} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Categoria</Label>
                    <Input
                      id="nome"
                      value={novaCategoria.nome}
                      onChange={(e) =>
                        setNovaCategoria({ ...novaCategoria, nome: e.target.value })
                      }
                      placeholder="Ex: Chapas, Tintas, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cor"
                        type="color"
                        value={novaCategoria.cor}
                        onChange={(e) =>
                          setNovaCategoria({ ...novaCategoria, cor: e.target.value })
                        }
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={novaCategoria.cor}
                        onChange={(e) =>
                          setNovaCategoria({ ...novaCategoria, cor: e.target.value })
                        }
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loadingCategorias}>
                    {editando ? "Atualizar" : "Adicionar"} Categoria
                  </Button>
                  {editando && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelarEdicao}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>

              {/* Tabela de categorias */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCategorias ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : categorias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhuma categoria cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      categorias.map((categoria) => (
                        <TableRow key={categoria.id}>
                          <TableCell className="font-medium">{categoria.nome}</TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: categoria.cor,
                                color: "white",
                              }}
                            >
                              {categoria.cor}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditarCategoria(categoria)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setCategoriaParaRemover(categoria.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Subcategorias */}
        <TabsContent value="subcategorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Subcategorias</CardTitle>
              <CardDescription>
                Adicione ou remova subcategorias para melhor organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de categoria */}
              <div className="space-y-2">
                <Label>Selecione uma Categoria</Label>
                <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
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

              {/* Formulário de subcategoria */}
              {categoriaSelecionada && (
                <>
                  <form onSubmit={handleAdicionarSubcategoria} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sub-nome">Nome da Subcategoria</Label>
                        <Input
                          id="sub-nome"
                          value={novaSubcategoria.nome}
                          onChange={(e) =>
                            setNovaSubcategoria({ ...novaSubcategoria, nome: e.target.value })
                          }
                          placeholder="Ex: Chapa 1mm, Tinta Branca, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sub-descricao">Descrição (opcional)</Label>
                        <Input
                          id="sub-descricao"
                          value={novaSubcategoria.descricao}
                          onChange={(e) =>
                            setNovaSubcategoria({
                              ...novaSubcategoria,
                              descricao: e.target.value,
                            })
                          }
                          placeholder="Descrição da subcategoria"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loadingSubcategorias}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Subcategoria
                    </Button>
                  </form>

                  {/* Lista de subcategorias */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingSubcategorias ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              Carregando...
                            </TableCell>
                          </TableRow>
                        ) : subcategoriasFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              Nenhuma subcategoria cadastrada para esta categoria
                            </TableCell>
                          </TableRow>
                        ) : (
                          subcategoriasFiltradas.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">{sub.nome}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {sub.descricao || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoverSubcategoria(sub.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Movimentações */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
              <CardDescription>
                Histórico completo de todas as movimentações de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Estoque Anterior</TableHead>
                      <TableHead className="text-right">Estoque Novo</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingMovimentacoes ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : movimentacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          <div className="py-8">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                            <p>Nenhuma movimentação registrada</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentacoes.slice(0, 100).map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            Produto ID: {mov.produto_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTipoMovimentacaoVariant(mov.tipo_movimentacao)}>
                              {getTipoMovimentacaoLabel(mov.tipo_movimentacao)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {mov.tipo_movimentacao === "entrada" ? "+" : ""}
                            {mov.quantidade}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {mov.quantidade_anterior}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {mov.quantidade_nova}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                            {mov.observacoes || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Dialog para confirmar remoção de categoria */}
      <AlertDialog open={!!categoriaParaRemover} onOpenChange={() => setCategoriaParaRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoverCategoria}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
