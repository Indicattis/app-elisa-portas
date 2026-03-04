import { useState } from "react";
import { Settings2, Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useTiposCustos, CustoCategoria, CustoSubcategoria, TipoCusto } from "@/hooks/useTiposCustos";
import { formatCurrency } from "@/lib/utils";

export default function DREDespesasDirecao() {
  const {
    tiposCustos, categorias, subcategorias, loading,
    saveCategoria, updateCategoria, deleteCategoria,
    saveSubcategoria, updateSubcategoria, deleteSubcategoria,
    saveTipoCusto, updateTipoCusto, deleteTipoCusto,
  } = useTiposCustos();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

  const [tipoCustoDialog, setTipoCustoDialog] = useState(false);
  const [categoriasManagerDialog, setCategoriasManagerDialog] = useState(false);
  const [categoriaDialog, setCategoriaDialog] = useState(false);
  const [subcategoriaDialog, setSubcategoriaDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null);

  const [editingTipoCusto, setEditingTipoCusto] = useState<TipoCusto | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<CustoCategoria | null>(null);
  const [editingSubcategoria, setEditingSubcategoria] = useState<CustoSubcategoria | null>(null);

  const [tipoCustoForm, setTipoCustoForm] = useState({
    nome: "", descricao: "", categoria_id: "", subcategoria_id: "",
    valor_maximo_mensal: 0, tipo: "fixa" as 'fixa' | 'variavel',
  });
  const [categoriaForm, setCategoriaForm] = useState({ nome: "", descricao: "", cor: "#3B82F6" });
  const [subcategoriaForm, setSubcategoriaForm] = useState({ nome: "", descricao: "", categoria_id: "" });

  const filteredTiposCustos = tiposCustos.filter(t => {
    const matchesSearch = t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "all" || t.categoria_id === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

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

  return (
    <MinimalistLayout
      title="Despesas"
      subtitle="Tipos de custos, categorias e limites"
      backPath="/direcao/dre"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'DRE', path: '/direcao/dre' },
        { label: 'Despesas' },
      ]}
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoriasManagerDialog(true)} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
            <Settings2 className="h-4 w-4 mr-2" />Categorias
          </Button>
          <Button size="sm" onClick={() => setTipoCustoDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />Novo
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Two-column layout */}
          {(() => {
            const fixas = filteredTiposCustos.filter(t => t.tipo === 'fixa');
            const variaveis = filteredTiposCustos.filter(t => t.tipo === 'variavel');
            const totalFixas = fixas.reduce((sum, t) => sum + t.valor_maximo_mensal, 0);
            const totalVariaveis = variaveis.reduce((sum, t) => sum + t.valor_maximo_mensal, 0);

            const renderTable = (items: TipoCusto[], title: string, total: number) => (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{title} <span className="text-white/50 font-normal">({items.length})</span></h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/70">Nome</TableHead>
                      <TableHead className="text-white/70">Categoria</TableHead>
                      <TableHead className="text-white/70 text-right">Limite Mensal</TableHead>
                      <TableHead className="text-white/70 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-white/50 py-8">Nenhuma despesa encontrada</TableCell></TableRow>
                    ) : (
                      items.map((tipo) => (
                        <TableRow key={tipo.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-medium text-white">{tipo.nome}</TableCell>
                          <TableCell>{tipo.categoria && (<Badge variant="outline" style={{ borderColor: tipo.categoria.cor, color: tipo.categoria.cor }}>{tipo.categoria.nome}</Badge>)}</TableCell>
                          <TableCell className="text-right font-medium text-white">{formatCurrency(tipo.valor_maximo_mensal)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditTipoCusto(tipo)} className="text-white/70 hover:text-white hover:bg-white/10"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ type: "tipo", id: tipo.id })} className="text-white/70 hover:text-red-400 hover:bg-white/10"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {items.length > 0 && (
                      <TableRow className="border-white/10 bg-white/5">
                        <TableCell colSpan={2} className="font-semibold text-white/70">Total</TableCell>
                        <TableCell className="text-right font-bold text-white">{formatCurrency(total)}</TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            );

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {renderTable(fixas, "Despesas Fixas", totalFixas)}
                {renderTable(variaveis, "Despesas Variáveis", totalVariaveis)}
              </div>
            );
          })()}
        </div>
      )}

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
    </MinimalistLayout>
  );
}
