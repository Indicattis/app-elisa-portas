import { useState } from "react";
import { Plus, Edit, Trash2, Search, Building2 } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTransportadoras, Transportadora } from "@/hooks/useTransportadoras";

export default function FreteTransportadoras() {
  const { transportadoras, isLoading, createTransportadora, updateTransportadora, deleteTransportadora, toggleAtivo } = useTransportadoras();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transportadora | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", cnpj: "", telefone: "" });

  const filtered = (transportadoras ?? []).filter(t =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.cnpj ?? "").includes(searchTerm)
  );

  const openNew = () => { setEditing(null); setForm({ nome: "", cnpj: "", telefone: "" }); setDialogOpen(true); };
  const openEdit = (t: Transportadora) => { setEditing(t); setForm({ nome: t.nome, cnpj: t.cnpj ?? "", telefone: t.telefone ?? "" }); setDialogOpen(true); };

  const handleSave = async () => {
    const input = { nome: form.nome, cnpj: form.cnpj || null, telefone: form.telefone || null };
    if (editing) await updateTransportadora.mutateAsync({ id: editing.id, ...input });
    else await createTransportadora.mutateAsync(input);
    setDialogOpen(false);
  };

  const handleDelete = async () => { if (deleteId) { await deleteTransportadora.mutateAsync(deleteId); setDeleteId(null); } };

  const headerActions = (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 w-48 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-10" />
      </div>
      <Button size="sm" onClick={openNew}
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400/30 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5">
        <Plus className="h-4 w-4" /><span className="hidden sm:inline">Nova</span>
      </Button>
    </>
  );

  return (
    <MinimalistLayout title="Transportadoras" subtitle="Gerencie as transportadoras" backPath="/logistica/frete"
      breadcrumbItems={[{ label: "Home", path: "/home" }, { label: "Logística", path: "/logistica" }, { label: "Frete", path: "/logistica/frete" }, { label: "Transportadoras" }]}
      headerActions={headerActions}>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" /></div>
      ) : (
        <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-blue-500/10 hover:bg-white/5">
                    <TableHead className="text-xs text-white/70">Nome</TableHead>
                    <TableHead className="text-xs text-white/70">CNPJ</TableHead>
                    <TableHead className="text-xs text-white/70">Telefone</TableHead>
                    <TableHead className="text-xs text-white/70">Ativo</TableHead>
                    <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id} className="border-blue-500/10 hover:bg-white/5 text-white/90">
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell>{t.cnpj || '-'}</TableCell>
                      <TableCell>{t.telefone || '-'}</TableCell>
                      <TableCell><Switch checked={t.ativo} onCheckedChange={checked => toggleAtivo.mutate({ id: t.id, ativo: checked })} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10" onClick={() => openEdit(t)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-white/50">
                      <div className="flex flex-col items-center gap-2"><Building2 className="h-8 w-8 text-white/30" /><span>Nenhuma transportadora cadastrada</span></div>
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-black/90 border-white/10 backdrop-blur-xl text-white">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Transportadora</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-white/70">Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="bg-white/5 border-white/10 text-white" /></div>
            <div><Label className="text-white/70">CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className="bg-white/5 border-white/10 text-white" /></div>
            <div><Label className="text-white/70">Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className="bg-white/5 border-white/10 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/70">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-black/90 border-white/10 backdrop-blur-xl">
          <AlertDialogHeader><AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-white/10 text-white hover:bg-white/15">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500/80 hover:bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
