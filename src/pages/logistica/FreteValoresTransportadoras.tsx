import { useState } from "react";
import { Plus, Edit, Trash2, Truck } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTransportadoras } from "@/hooks/useTransportadoras";
import { useFreteTransportadoras, FreteTransportadora } from "@/hooks/useFreteTransportadoras";

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function FreteValoresTransportadoras() {
  const { transportadoras } = useTransportadoras();
  const [selectedTransportadora, setSelectedTransportadora] = useState<string>("");
  const { fretes, isLoading, createFrete, updateFrete, deleteFrete } = useFreteTransportadoras(selectedTransportadora || undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FreteTransportadora | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ estado: "", valor_porta_p: "", valor_porta_g: "", valor_porta_gg: "" });

  const openNew = () => { setEditing(null); setForm({ estado: "", valor_porta_p: "", valor_porta_g: "", valor_porta_gg: "" }); setDialogOpen(true); };
  const openEdit = (f: FreteTransportadora) => {
    setEditing(f);
    setForm({ estado: f.estado, valor_porta_p: String(f.valor_porta_p), valor_porta_g: String(f.valor_porta_g), valor_porta_gg: String(f.valor_porta_gg) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const input = {
      transportadora_id: selectedTransportadora,
      estado: form.estado,
      valor_porta_p: Number(form.valor_porta_p) || 0,
      valor_porta_g: Number(form.valor_porta_g) || 0,
      valor_porta_gg: Number(form.valor_porta_gg) || 0,
    };
    if (editing) await updateFrete.mutateAsync({ id: editing.id, ...input });
    else await createFrete.mutateAsync(input);
    setDialogOpen(false);
  };

  const handleDelete = async () => { if (deleteId) { await deleteFrete.mutateAsync(deleteId); setDeleteId(null); } };

  const headerActions = (
    <>
      <Select value={selectedTransportadora} onValueChange={setSelectedTransportadora}>
        <SelectTrigger className="w-52 bg-white/5 border-white/10 text-white h-10">
          <SelectValue placeholder="Selecione transportadora" />
        </SelectTrigger>
        <SelectContent>
          {(transportadoras ?? []).filter(t => t.ativo).map(t => (
            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedTransportadora && (
        <Button size="sm" onClick={openNew}
          className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400/30 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">Novo</span>
        </Button>
      )}
    </>
  );

  return (
    <MinimalistLayout title="Valores Transportadoras" subtitle="Valores de frete por estado e tipo de porta" backPath="/logistica/frete"
      breadcrumbItems={[{ label: "Home", path: "/home" }, { label: "Logística", path: "/logistica" }, { label: "Frete", path: "/logistica/frete" }, { label: "Valores Transportadoras" }]}
      headerActions={headerActions}>

      {!selectedTransportadora ? (
        <div className="flex items-center justify-center h-64 text-white/50">
          <div className="flex flex-col items-center gap-2"><Truck className="h-8 w-8 text-white/30" /><span>Selecione uma transportadora</span></div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" /></div>
      ) : (
        <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-blue-500/10 hover:bg-white/5">
                    <TableHead className="text-xs text-white/70">Estado</TableHead>
                    <TableHead className="text-xs text-white/70">Porta P</TableHead>
                    <TableHead className="text-xs text-white/70">Porta G</TableHead>
                    <TableHead className="text-xs text-white/70">Porta GG</TableHead>
                    <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fretes ?? []).map(f => (
                    <TableRow key={f.id} className="border-blue-500/10 hover:bg-white/5 text-white/90">
                      <TableCell className="font-medium">{f.estado}</TableCell>
                      <TableCell className="text-green-400">{formatCurrency(f.valor_porta_p)}</TableCell>
                      <TableCell className="text-green-400">{formatCurrency(f.valor_porta_g)}</TableCell>
                      <TableCell className="text-green-400">{formatCurrency(f.valor_porta_gg)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10" onClick={() => openEdit(f)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => setDeleteId(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(fretes ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-white/50">
                      <div className="flex flex-col items-center gap-2"><Truck className="h-8 w-8 text-white/30" /><span>Nenhum valor cadastrado</span></div>
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
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Valor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Estado *</Label>
              <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{ESTADOS_BR.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-white/70">Valor Porta P</Label><Input type="number" step="0.01" value={form.valor_porta_p} onChange={e => setForm(f => ({ ...f, valor_porta_p: e.target.value }))} className="bg-white/5 border-white/10 text-white" /></div>
            <div><Label className="text-white/70">Valor Porta G</Label><Input type="number" step="0.01" value={form.valor_porta_g} onChange={e => setForm(f => ({ ...f, valor_porta_g: e.target.value }))} className="bg-white/5 border-white/10 text-white" /></div>
            <div><Label className="text-white/70">Valor Porta GG</Label><Input type="number" step="0.01" value={form.valor_porta_gg} onChange={e => setForm(f => ({ ...f, valor_porta_gg: e.target.value }))} className="bg-white/5 border-white/10 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/70">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.estado} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">Salvar</Button>
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
