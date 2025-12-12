import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Coins, Layers, RotateCcw, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTiposCustos, CustoCategoria, CustoSubcategoria, TipoCusto } from "@/hooks/useTiposCustos";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function Custos() {
  const {
    tiposCustos,
    categorias,
    subcategorias,
    loading,
    saveCategoria,
    updateCategoria,
    deleteCategoria,
    saveSubcategoria,
    updateSubcategoria,
    deleteSubcategoria,
    saveTipoCusto,
    updateTipoCusto,
    deleteTipoCusto,
  } = useTiposCustos();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialog states
  const [tipoCustoDialog, setTipoCustoDialog] = useState(false);
  const [categoriasManagerDialog, setCategoriasManagerDialog] = useState(false);
  const [categoriaDialog, setCategoriaDialog] = useState(false);
  const [subcategoriaDialog, setSubcategoriaDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null);

  // Editing states
  const [editingTipoCusto, setEditingTipoCusto] = useState<TipoCusto | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<CustoCategoria | null>(null);
  const [editingSubcategoria, setEditingSubcategoria] = useState<CustoSubcategoria | null>(null);

  // Form states
  const [tipoCustoForm, setTipoCustoForm] = useState({
    nome: "",
    descricao: "",
    categoria_id: "",
    subcategoria_id: "",
    valor_maximo_mensal: 0,
    recorrente: true,
  });

  const [categoriaForm, setCategoriaForm] = useState({
    nome: "",
    descricao: "",
    cor: "#3B82F6",
  });

  const [subcategoriaForm, setSubcategoriaForm] = useState({
    nome: "",
    descricao: "",
    categoria_id: "",
  });

  // Computed values
  const totalCategorias = categorias.filter(c => c.ativo).length;
  const totalTipos = tiposCustos.filter(t => t.ativo).length;
  const totalLimiteMensal = tiposCustos.filter(t => t.ativo).reduce((acc, t) => acc + t.valor_maximo_mensal, 0);

  // Filtered data
  const filteredTiposCustos = tiposCustos.filter(t => {
    const matchesSearch = t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "all" || t.categoria_id === filterCategoria;
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "ativo" && t.ativo) ||
      (filterStatus === "inativo" && !t.ativo);
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  // Handlers
  const handleSaveTipoCusto = async () => {
    const data = {
      ...tipoCustoForm,
      categoria_id: tipoCustoForm.categoria_id || null,
      subcategoria_id: tipoCustoForm.subcategoria_id || null,
    };

    let success;
    if (editingTipoCusto) {
      success = await updateTipoCusto(editingTipoCusto.id, data);
    } else {
      success = await saveTipoCusto(data);
    }

    if (success) {
      setTipoCustoDialog(false);
      resetTipoCustoForm();
    }
  };

  const handleSaveCategoria = async () => {
    let success;
    if (editingCategoria) {
      success = await updateCategoria(editingCategoria.id, categoriaForm);
    } else {
      success = await saveCategoria(categoriaForm);
    }

    if (success) {
      setCategoriaDialog(false);
      resetCategoriaForm();
    }
  };

  const handleSaveSubcategoria = async () => {
    let success;
    if (editingSubcategoria) {
      success = await updateSubcategoria(editingSubcategoria.id, subcategoriaForm);
    } else {
      success = await saveSubcategoria(subcategoriaForm);
    }

    if (success) {
      setSubcategoriaDialog(false);
      resetSubcategoriaForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    let success;
    switch (deleteDialog.type) {
      case "tipo":
        success = await deleteTipoCusto(deleteDialog.id);
        break;
      case "categoria":
        success = await deleteCategoria(deleteDialog.id);
        break;
      case "subcategoria":
        success = await deleteSubcategoria(deleteDialog.id);
        break;
    }

    if (success) {
      setDeleteDialog(null);
    }
  };

  const handleEditTipoCusto = (tipo: TipoCusto) => {
    setEditingTipoCusto(tipo);
    setTipoCustoForm({
      nome: tipo.nome,
      descricao: tipo.descricao || "",
      categoria_id: tipo.categoria_id || "",
      subcategoria_id: tipo.subcategoria_id || "",
      valor_maximo_mensal: tipo.valor_maximo_mensal,
      recorrente: tipo.recorrente,
    });
    setTipoCustoDialog(true);
  };

  const handleEditCategoria = (categoria: CustoCategoria) => {
    setEditingCategoria(categoria);
    setCategoriaForm({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      cor: categoria.cor,
    });
    setCategoriaDialog(true);
  };

  const handleEditSubcategoria = (subcategoria: CustoSubcategoria) => {
    setEditingSubcategoria(subcategoria);
    setSubcategoriaForm({
      nome: subcategoria.nome,
      descricao: subcategoria.descricao || "",
      categoria_id: subcategoria.categoria_id,
    });
    setSubcategoriaDialog(true);
  };

  const toggleTipoCustoStatus = async (tipo: TipoCusto) => {
    await updateTipoCusto(tipo.id, { ativo: !tipo.ativo });
  };

  const toggleCategoriaStatus = async (categoria: CustoCategoria) => {
    await updateCategoria(categoria.id, { ativo: !categoria.ativo });
  };

  const toggleSubcategoriaStatus = async (subcategoria: CustoSubcategoria) => {
    await updateSubcategoria(subcategoria.id, { ativo: !subcategoria.ativo });
  };

  // Reset forms
  const resetTipoCustoForm = () => {
    setEditingTipoCusto(null);
    setTipoCustoForm({
      nome: "",
      descricao: "",
      categoria_id: "",
      subcategoria_id: "",
      valor_maximo_mensal: 0,
      recorrente: true,
    });
  };

  const resetCategoriaForm = () => {
    setEditingCategoria(null);
    setCategoriaForm({
      nome: "",
      descricao: "",
      cor: "#3B82F6",
    });
  };

  const resetSubcategoriaForm = () => {
    setEditingSubcategoria(null);
    setSubcategoriaForm({
      nome: "",
      descricao: "",
      categoria_id: "",
    });
  };

  const getCategoriaById = (id: string) => categorias.find(c => c.id === id);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Custos</h1>
          <p className="text-muted-foreground">
            Cadastre os tipos de custos da empresa com categorias e limites mensais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoriasManagerDialog(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Gerenciar Categorias
          </Button>
          <Button onClick={() => setTipoCustoDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo de Custo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategorias}</div>
            <p className="text-xs text-muted-foreground">categorias ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Custos</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTipos}</div>
            <p className="text-xs text-muted-foreground">tipos cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Total Mensal</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLimiteMensal)}</div>
            <p className="text-xs text-muted-foreground">soma dos limites máximos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipos de custos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Types Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Subcategoria</TableHead>
                <TableHead className="text-right">Valor Máximo Mensal</TableHead>
                <TableHead className="text-center">Recorrente</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTiposCustos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum tipo de custo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredTiposCustos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell>
                      {tipo.categoria && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: tipo.categoria.cor, color: tipo.categoria.cor }}
                        >
                          {tipo.categoria.nome}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{tipo.subcategoria?.nome || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(tipo.valor_maximo_mensal)}
                    </TableCell>
                    <TableCell className="text-center">
                      {tipo.recorrente ? (
                        <Badge variant="secondary">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={tipo.ativo}
                        onCheckedChange={() => toggleTipoCustoStatus(tipo)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditTipoCusto(tipo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ type: "tipo", id: tipo.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Categorias Manager Dialog */}
      <Dialog open={categoriasManagerDialog} onOpenChange={setCategoriasManagerDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias e Subcategorias</DialogTitle>
            <DialogDescription>
              Organize as categorias e subcategorias de custos
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="categorias" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categorias">Categorias ({categorias.length})</TabsTrigger>
              <TabsTrigger value="subcategorias">Subcategorias ({subcategorias.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="categorias" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setCategoriaDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cor</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma categoria encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    categorias.map((categoria) => (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: categoria.cor }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{categoria.nome}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{categoria.descricao || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={categoria.ativo}
                            onCheckedChange={() => toggleCategoriaStatus(categoria)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditCategoria(categoria)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ type: "categoria", id: categoria.id })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="subcategorias" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setSubcategoriaDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Subcategoria
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcategorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma subcategoria encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    subcategorias.map((subcategoria) => {
                      const categoria = getCategoriaById(subcategoria.categoria_id);
                      return (
                        <TableRow key={subcategoria.id}>
                          <TableCell className="font-medium">{subcategoria.nome}</TableCell>
                          <TableCell>
                            {categoria && (
                              <Badge
                                variant="outline"
                                style={{ borderColor: categoria.cor, color: categoria.cor }}
                              >
                                {categoria.nome}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">{subcategoria.descricao || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={subcategoria.ativo}
                              onCheckedChange={() => toggleSubcategoriaStatus(subcategoria)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditSubcategoria(subcategoria)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ type: "subcategoria", id: subcategoria.id })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Tipo de Custo Dialog */}
      <Dialog open={tipoCustoDialog} onOpenChange={(open) => {
        setTipoCustoDialog(open);
        if (!open) resetTipoCustoForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTipoCusto ? "Editar" : "Novo"} Tipo de Custo</DialogTitle>
            <DialogDescription>
              Cadastre um tipo de custo com limite mensal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={tipoCustoForm.nome}
                onChange={(e) => setTipoCustoForm({ ...tipoCustoForm, nome: e.target.value })}
                placeholder="Ex: Energia Elétrica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={tipoCustoForm.categoria_id}
                onValueChange={(value) => setTipoCustoForm({ ...tipoCustoForm, categoria_id: value, subcategoria_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.filter(c => c.ativo).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategoria">Subcategoria</Label>
              <Select
                value={tipoCustoForm.subcategoria_id}
                onValueChange={(value) => setTipoCustoForm({ ...tipoCustoForm, subcategoria_id: value })}
                disabled={!tipoCustoForm.categoria_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  {subcategorias
                    .filter(s => s.ativo && s.categoria_id === tipoCustoForm.categoria_id)
                    .map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={tipoCustoForm.descricao}
                onChange={(e) => setTipoCustoForm({ ...tipoCustoForm, descricao: e.target.value })}
                placeholder="Descrição do tipo de custo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_maximo">Valor Máximo Mensal</Label>
              <Input
                id="valor_maximo"
                type="number"
                step="0.01"
                value={tipoCustoForm.valor_maximo_mensal}
                onChange={(e) => setTipoCustoForm({ ...tipoCustoForm, valor_maximo_mensal: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="recorrente">Custo Recorrente</Label>
              <Switch
                id="recorrente"
                checked={tipoCustoForm.recorrente}
                onCheckedChange={(checked) => setTipoCustoForm({ ...tipoCustoForm, recorrente: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTipoCustoDialog(false);
              resetTipoCustoForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTipoCusto} disabled={!tipoCustoForm.nome}>
              {editingTipoCusto ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categoria Dialog */}
      <Dialog open={categoriaDialog} onOpenChange={(open) => {
        setCategoriaDialog(open);
        if (!open) resetCategoriaForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategoria ? "Editar" : "Nova"} Categoria</DialogTitle>
            <DialogDescription>
              Cadastre uma categoria de custos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat_nome">Nome</Label>
              <Input
                id="cat_nome"
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                placeholder="Ex: Operacional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat_descricao">Descrição</Label>
              <Textarea
                id="cat_descricao"
                value={categoriaForm.descricao}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })}
                placeholder="Descrição da categoria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat_cor">Cor</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="cat_cor"
                  type="color"
                  value={categoriaForm.cor}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={categoriaForm.cor}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCategoriaDialog(false);
              resetCategoriaForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategoria} disabled={!categoriaForm.nome}>
              {editingCategoria ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategoria Dialog */}
      <Dialog open={subcategoriaDialog} onOpenChange={(open) => {
        setSubcategoriaDialog(open);
        if (!open) resetSubcategoriaForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubcategoria ? "Editar" : "Nova"} Subcategoria</DialogTitle>
            <DialogDescription>
              Cadastre uma subcategoria de custos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub_categoria">Categoria</Label>
              <Select
                value={subcategoriaForm.categoria_id}
                onValueChange={(value) => setSubcategoriaForm({ ...subcategoriaForm, categoria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.filter(c => c.ativo).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_nome">Nome</Label>
              <Input
                id="sub_nome"
                value={subcategoriaForm.nome}
                onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, nome: e.target.value })}
                placeholder="Ex: Utilidades"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_descricao">Descrição</Label>
              <Textarea
                id="sub_descricao"
                value={subcategoriaForm.descricao}
                onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, descricao: e.target.value })}
                placeholder="Descrição da subcategoria"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSubcategoriaDialog(false);
              resetSubcategoriaForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSubcategoria} disabled={!subcategoriaForm.nome || !subcategoriaForm.categoria_id}>
              {editingSubcategoria ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
