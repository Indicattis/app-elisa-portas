import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings2, Coins, Plus, Pencil, Trash2, Search, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { useCustosMensais } from "@/hooks/useCustosMensais";
import { useTiposCustos, CustoCategoria, CustoSubcategoria, TipoCusto } from "@/hooks/useTiposCustos";
import { cn, formatCurrency } from "@/lib/utils";

const MESES_NOMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CustosGridMinimalista() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [ano, setAno] = useState(new Date().getFullYear());
  const { totaisPorMes, loading: loadingMensais, fetchTotaisPorMes } = useCustosMensais();

  const {
    tiposCustos, categorias, subcategorias, loading: loadingTipos,
    saveCategoria, updateCategoria, deleteCategoria,
    saveSubcategoria, updateSubcategoria, deleteSubcategoria,
    saveTipoCusto, updateTipoCusto, deleteTipoCusto,
  } = useTiposCustos();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter states
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
    nome: "", descricao: "", categoria_id: "", subcategoria_id: "",
    valor_maximo_mensal: 0, tipo: "fixa" as 'fixa' | 'variavel',
  });
  const [categoriaForm, setCategoriaForm] = useState({ nome: "", descricao: "", cor: "#3B82F6" });
  const [subcategoriaForm, setSubcategoriaForm] = useState({ nome: "", descricao: "", categoria_id: "" });

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchTotaisPorMes(ano);
  }, [ano, fetchTotaisPorMes]);

  // Computed
  const totalCategorias = categorias.filter(c => c.ativo).length;
  const totalTipos = tiposCustos.filter(t => t.ativo).length;
  const totalLimiteMensal = tiposCustos.filter(t => t.ativo).reduce((acc, t) => acc + t.valor_maximo_mensal, 0);

  const filteredTiposCustos = tiposCustos.filter(t => {
    const matchesSearch = t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "all" || t.categoria_id === filterCategoria;
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "ativo" && t.ativo) || (filterStatus === "inativo" && !t.ativo);
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  // Handlers
  const handleMonthClick = (monthIndex: number) => {
    const mesFormatado = `${ano}-${String(monthIndex + 1).padStart(2, "0")}`;
    navigate(`/administrativo/financeiro/custos/${mesFormatado}`);
  };

  const handleSaveTipoCusto = async () => {
    const data = { ...tipoCustoForm, categoria_id: tipoCustoForm.categoria_id || null, subcategoria_id: tipoCustoForm.subcategoria_id || null };
    const success = editingTipoCusto ? await updateTipoCusto(editingTipoCusto.id, data) : await saveTipoCusto(data);
    if (success) { setTipoCustoDialog(false); resetTipoCustoForm(); }
  };

  const handleSaveCategoria = async () => {
    const success = editingCategoria ? await updateCategoria(editingCategoria.id, categoriaForm) : await saveCategoria(categoriaForm);
    if (success) { setCategoriaDialog(false); resetCategoriaForm(); }
  };

  const handleSaveSubcategoria = async () => {
    const success = editingSubcategoria ? await updateSubcategoria(editingSubcategoria.id, subcategoriaForm) : await saveSubcategoria(subcategoriaForm);
    if (success) { setSubcategoriaDialog(false); resetSubcategoriaForm(); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    let success;
    switch (deleteDialog.type) {
      case "tipo": success = await deleteTipoCusto(deleteDialog.id); break;
      case "categoria": success = await deleteCategoria(deleteDialog.id); break;
      case "subcategoria": success = await deleteSubcategoria(deleteDialog.id); break;
    }
    if (success) setDeleteDialog(null);
  };

  const handleEditTipoCusto = (tipo: TipoCusto) => {
    setEditingTipoCusto(tipo);
    setTipoCustoForm({ nome: tipo.nome, descricao: tipo.descricao || "", categoria_id: tipo.categoria_id || "", subcategoria_id: tipo.subcategoria_id || "", valor_maximo_mensal: tipo.valor_maximo_mensal, tipo: tipo.tipo });
    setTipoCustoDialog(true);
  };

  const handleEditCategoria = (categoria: CustoCategoria) => {
    setEditingCategoria(categoria);
    setCategoriaForm({ nome: categoria.nome, descricao: categoria.descricao || "", cor: categoria.cor });
    setCategoriaDialog(true);
  };

  const handleEditSubcategoria = (subcategoria: CustoSubcategoria) => {
    setEditingSubcategoria(subcategoria);
    setSubcategoriaForm({ nome: subcategoria.nome, descricao: subcategoria.descricao || "", categoria_id: subcategoria.categoria_id });
    setSubcategoriaDialog(true);
  };

  const toggleTipoCustoStatus = async (tipo: TipoCusto) => { await updateTipoCusto(tipo.id, { ativo: !tipo.ativo }); };
  const toggleCategoriaStatus = async (categoria: CustoCategoria) => { await updateCategoria(categoria.id, { ativo: !categoria.ativo }); };
  const toggleSubcategoriaStatus = async (subcategoria: CustoSubcategoria) => { await updateSubcategoria(subcategoria.id, { ativo: !subcategoria.ativo }); };

  const resetTipoCustoForm = () => { setEditingTipoCusto(null); setTipoCustoForm({ nome: "", descricao: "", categoria_id: "", subcategoria_id: "", valor_maximo_mensal: 0, tipo: "fixa" }); };
  const resetCategoriaForm = () => { setEditingCategoria(null); setCategoriaForm({ nome: "", descricao: "", cor: "#3B82F6" }); };
  const resetSubcategoriaForm = () => { setEditingSubcategoria(null); setSubcategoriaForm({ nome: "", descricao: "", categoria_id: "" }); };

  const loading = loadingMensais || loadingTipos;

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-white/10" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Financeiro", path: "/administrativo/financeiro" },
          { label: "Custos" },
        ]}
        mounted={mounted}
      />

      <FloatingProfileMenu mounted={mounted} />

      <button
        onClick={() => navigate("/administrativo/financeiro")}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateX(0)" : "translateX(-20px)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms",
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      <div className="container mx-auto p-6 pt-20 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Custos {ano}</h1>
            <p className="text-white/60">Selecione um mês para lançar os custos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAno(ano - 1)} className="bg-white/5 border-white/20 text-white hover:bg-white/10">{ano - 1}</Button>
            <Button variant="outline" onClick={() => setAno(currentYear)} className={cn("border-white/20 text-white", ano === currentYear ? "bg-blue-600 hover:bg-blue-700 border-blue-500" : "bg-white/5 hover:bg-white/10")}>{currentYear}</Button>
            <Button variant="outline" onClick={() => setAno(ano + 1)} className="bg-white/5 border-white/20 text-white hover:bg-white/10">{ano + 1}</Button>
          </div>
        </div>

        {/* Grid 3x4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {MESES_NOMES.map((nomeMes, index) => {
            const isCurrentMonth = ano === currentYear && index === currentMonth;
            const dados = totaisPorMes[index];
            const totalReal = dados?.total_real || 0;
            const totalLimite = dados?.total_limite || 0;
            const percentual = totalLimite > 0 ? (totalReal / totalLimite) * 100 : 0;

            return (
              <Card key={index} onClick={() => handleMonthClick(index)} className={cn("cursor-pointer transition-all duration-200", isCurrentMonth ? "bg-blue-500 border-blue-400 hover:bg-blue-400" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20")}>
                <CardContent className="p-4">
                  <p className={cn("text-sm font-medium mb-2", isCurrentMonth ? "text-white" : "text-white/60")}>{nomeMes}</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totalReal)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className={cn("text-xs", isCurrentMonth ? "text-white/70" : "text-white/40")}>Limite: {formatCurrency(totalLimite)}</p>
                    {totalLimite > 0 && (
                      <p className={cn("text-xs font-medium", percentual > 100 ? "text-red-400" : percentual > 80 ? "text-amber-400" : isCurrentMonth ? "text-white/80" : "text-green-400")}>{percentual.toFixed(0)}%</p>
                    )}
                  </div>
                  {totalLimite > 0 && (
                    <div className={cn("mt-2 h-1 rounded-full overflow-hidden", isCurrentMonth ? "bg-white/20" : "bg-white/10")}>
                      <div className={cn("h-full rounded-full transition-all", percentual > 100 ? "bg-red-400" : percentual > 80 ? "bg-amber-400" : "bg-green-400")} style={{ width: `${Math.min(percentual, 100)}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ===== Configuração de Tipos de Custos ===== */}
        <div className="border-t border-white/10 pt-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Tipos de Custos</h2>
              <p className="text-white/60">Cadastre os tipos de custos da empresa com categorias e limites mensais</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCategoriasManagerDialog(true)} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                <Settings2 className="h-4 w-4 mr-2" />Gerenciar Categorias
              </Button>
              <Button onClick={() => setTipoCustoDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />Novo Tipo de Custo
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Categorias</CardTitle>
                <Layers className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalCategorias}</div>
                <p className="text-xs text-white/50">categorias ativas</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Tipos de Custos</CardTitle>
                <Coins className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalTipos}</div>
                <p className="text-xs text-white/50">tipos cadastrados</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Limite Total Mensal</CardTitle>
                <Coins className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(totalLimiteMensal)}</div>
                <p className="text-xs text-white/50">soma dos limites máximos</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Table */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input placeholder="Buscar tipos de custos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40" />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-[200px] bg-white/5 border-white/20 text-white"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categorias.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/70">Nome</TableHead>
                      <TableHead className="text-white/70">Categoria</TableHead>
                      <TableHead className="text-white/70">Subcategoria</TableHead>
                      <TableHead className="text-white/70 text-right">Valor Máximo Mensal</TableHead>
                      <TableHead className="text-white/70 text-center">Tipo</TableHead>
                      <TableHead className="text-white/70 text-center">Status</TableHead>
                      <TableHead className="text-white/70 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTiposCustos.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-white/50 py-8">Nenhum tipo de custo encontrado</TableCell></TableRow>
                    ) : (
                      filteredTiposCustos.map((tipo) => (
                        <TableRow key={tipo.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-medium text-white">{tipo.nome}</TableCell>
                          <TableCell>{tipo.categoria && (<Badge variant="outline" style={{ borderColor: tipo.categoria.cor, color: tipo.categoria.cor }}>{tipo.categoria.nome}</Badge>)}</TableCell>
                          <TableCell className="text-white/70">{tipo.subcategoria?.nome || "-"}</TableCell>
                          <TableCell className="text-right font-medium text-white">{formatCurrency(tipo.valor_maximo_mensal)}</TableCell>
                          <TableCell className="text-center"><Badge variant={tipo.tipo === 'fixa' ? 'default' : 'secondary'}>{tipo.tipo === 'fixa' ? 'Fixa' : 'Variável'}</Badge></TableCell>
                          <TableCell className="text-center"><Switch checked={tipo.ativo} onCheckedChange={() => toggleTipoCustoStatus(tipo)} /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditTipoCusto(tipo)} className="text-white/70 hover:text-white hover:bg-white/10"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ type: "tipo", id: tipo.id })} className="text-white/70 hover:text-red-400 hover:bg-white/10"><Trash2 className="h-4 w-4" /></Button>
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
        </div>
      </div>

      {/* Tipo de Custo Dialog */}
      <Dialog open={tipoCustoDialog} onOpenChange={(open) => { setTipoCustoDialog(open); if (!open) resetTipoCustoForm(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTipoCusto ? "Editar" : "Novo"} Tipo de Custo</DialogTitle>
            <DialogDescription>Preencha os dados do tipo de custo</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={tipoCustoForm.nome} onChange={(e) => setTipoCustoForm({ ...tipoCustoForm, nome: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={tipoCustoForm.descricao} onChange={(e) => setTipoCustoForm({ ...tipoCustoForm, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={tipoCustoForm.categoria_id} onValueChange={(v) => setTipoCustoForm({ ...tipoCustoForm, categoria_id: v, subcategoria_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{categorias.filter(c => c.ativo).map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Subcategoria</Label>
                <Select value={tipoCustoForm.subcategoria_id} onValueChange={(v) => setTipoCustoForm({ ...tipoCustoForm, subcategoria_id: v })} disabled={!tipoCustoForm.categoria_id}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{subcategorias.filter(s => s.ativo && s.categoria_id === tipoCustoForm.categoria_id).map((sub) => (<SelectItem key={sub.id} value={sub.id}>{sub.nome}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor Máximo Mensal</Label>
                <Input id="valor" type="number" value={tipoCustoForm.valor_maximo_mensal} onChange={(e) => setTipoCustoForm({ ...tipoCustoForm, valor_maximo_mensal: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={tipoCustoForm.tipo} onValueChange={(v: 'fixa' | 'variavel') => setTipoCustoForm({ ...tipoCustoForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixa">Fixa</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTipoCustoDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveTipoCusto}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categorias Manager Dialog */}
      <Dialog open={categoriasManagerDialog} onOpenChange={setCategoriasManagerDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias e Subcategorias</DialogTitle>
            <DialogDescription>Organize as categorias e subcategorias de custos</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="categorias" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categorias">Categorias ({categorias.length})</TabsTrigger>
              <TabsTrigger value="subcategorias">Subcategorias ({subcategorias.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="categorias" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setCategoriaDialog(true)}><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cor</TableHead><TableHead>Nome</TableHead><TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Status</TableHead><TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell><div className="w-6 h-6 rounded-full" style={{ backgroundColor: categoria.cor }} /></TableCell>
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{categoria.descricao || "-"}</TableCell>
                      <TableCell className="text-center"><Switch checked={categoria.ativo} onCheckedChange={() => toggleCategoriaStatus(categoria)} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCategoria(categoria)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ type: "categoria", id: categoria.id })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="subcategorias" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setSubcategoriaDialog(true)}><Plus className="h-4 w-4 mr-2" />Nova Subcategoria</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Status</TableHead><TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcategorias.map((subcategoria) => {
                    const cat = categorias.find(c => c.id === subcategoria.categoria_id);
                    return (
                      <TableRow key={subcategoria.id}>
                        <TableCell className="font-medium">{subcategoria.nome}</TableCell>
                        <TableCell>{cat && (<Badge variant="outline" style={{ borderColor: cat.cor, color: cat.cor }}>{cat.nome}</Badge>)}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{subcategoria.descricao || "-"}</TableCell>
                        <TableCell className="text-center"><Switch checked={subcategoria.ativo} onCheckedChange={() => toggleSubcategoriaStatus(subcategoria)} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditSubcategoria(subcategoria)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ type: "subcategoria", id: subcategoria.id })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Categoria Dialog */}
      <Dialog open={categoriaDialog} onOpenChange={(open) => { setCategoriaDialog(open); if (!open) resetCategoriaForm(); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>{editingCategoria ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-nome">Nome</Label>
              <Input id="cat-nome" value={categoriaForm.nome} onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-descricao">Descrição</Label>
              <Textarea id="cat-descricao" value={categoriaForm.descricao} onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-cor">Cor</Label>
              <div className="flex gap-2">
                <Input id="cat-cor" type="color" value={categoriaForm.cor} onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })} className="w-14 h-10 p-1" />
                <Input value={categoriaForm.cor} onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })} className="flex-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategoria}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategoria Dialog */}
      <Dialog open={subcategoriaDialog} onOpenChange={(open) => { setSubcategoriaDialog(open); if (!open) resetSubcategoriaForm(); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>{editingSubcategoria ? "Editar" : "Nova"} Subcategoria</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sub-nome">Nome</Label>
              <Input id="sub-nome" value={subcategoriaForm.nome} onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, nome: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={subcategoriaForm.categoria_id} onValueChange={(v) => setSubcategoriaForm({ ...subcategoriaForm, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categorias.filter(c => c.ativo).map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-descricao">Descrição</Label>
              <Textarea id="sub-descricao" value={subcategoriaForm.descricao} onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, descricao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubcategoriaDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveSubcategoria}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
