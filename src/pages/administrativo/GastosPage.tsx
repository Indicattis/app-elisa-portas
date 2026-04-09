import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { useGastos, Gasto } from "@/hooks/useGastos";
import { useBancos } from "@/hooks/useBancos";
import { useTiposCustos } from "@/hooks/useTiposCustos";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface ColaboradorOption {
  user_id: string;
  nome: string;
}

export default function GastosPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  const now = new Date();
  const [mesFiltro, setMesFiltro] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const { gastos, loading, saveGasto, updateGasto, deleteGasto } = useGastos(mesFiltro);
  const { tiposCustos } = useTiposCustos();
  const { bancos } = useBancos();
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // form state
  const [tipoCustoId, setTipoCustoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [responsavelId, setResponsavelId] = useState("");
  const [bancoId, setBancoId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchColaboradores = async () => {
      const { data } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .eq("ativo", true)
        .eq("tipo_usuario", "colaborador")
        .eq("setor", "administrativo")
        .order("nome");
      setColaboradores((data || []) as ColaboradorOption[]);
    };
    fetchColaboradores();
  }, []);

  const resetForm = () => {
    setTipoCustoId("");
    setDescricao("");
    setValor("");
    setData(new Date().toISOString().split("T")[0]);
    setResponsavelId("");
    setBancoId("");
    setObservacoes("");
    setEditingGasto(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (g: Gasto) => {
    setEditingGasto(g);
    setTipoCustoId(g.tipo_custo_id);
    setDescricao(g.descricao || "");
    setValor(String(g.valor));
    setData(g.data);
    setResponsavelId(g.responsavel_id);
    setBancoId(g.banco_id || "");
    setObservacoes(g.observacoes || "");
    setDialogOpen(true);
  };

  const handleTipoCustoChange = (id: string) => {
    setTipoCustoId(id);
    if (!editingGasto) {
      const tipo = tiposCustos.find((t) => t.id === id);
      if (tipo?.descricao) setDescricao(tipo.descricao);
    }
  };

  const handleSave = async () => {
    if (!tipoCustoId || !valor || !responsavelId || !bancoId) return;
    setSaving(true);
    const payload = {
      tipo_custo_id: tipoCustoId,
      descricao: descricao || null,
      valor: parseFloat(valor),
      data,
      responsavel_id: responsavelId,
      banco_id: bancoId,
      observacoes: observacoes || null,
    };
    const ok = editingGasto
      ? await updateGasto(editingGasto.id, payload)
      : await saveGasto(payload);
    setSaving(false);
    if (ok) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteGasto(deletingId);
    setDeleteOpen(false);
    setDeletingId(null);
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const tiposAtivos = tiposCustos.filter((t) => t.ativo);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center overflow-hidden relative">
      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Financeiro", path: "/administrativo/financeiro" },
          { label: "Gastos" },
        ]}
        mounted={mounted}
      />
      <FloatingProfileMenu mounted={mounted} />

      <button
        onClick={() => navigate("/administrativo/financeiro")}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
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

      <div className="w-full max-w-6xl px-4 pt-20 pb-10">
        {/* Header */}
        <div
          className="flex items-center justify-between mb-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease 200ms",
          }}
        >
          <h1 className="text-xl font-semibold text-white">Gastos</h1>
          <div className="flex items-center gap-3">
            {/* Month Navigator */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/20 rounded-lg px-1 py-0.5">
              <button
                onClick={() => {
                  const [y, m] = mesFiltro.split("-").map(Number);
                  const prev = new Date(y, m - 2, 1);
                  setMesFiltro(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
                }}
                className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2 min-w-[130px] justify-center">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-sm text-white font-medium capitalize">
                  {(() => {
                    const [y, m] = mesFiltro.split("-").map(Number);
                    const d = new Date(y, m - 1, 1);
                    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                  })()}
                </span>
              </div>
              <button
                onClick={() => {
                  const [y, m] = mesFiltro.split("-").map(Number);
                  const next = new Date(y, m, 1);
                  setMesFiltro(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
                }}
                className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo Gasto
            </Button>
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease 300ms",
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
            </div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-20 text-white/40 text-sm">
              Nenhum gasto registrado neste mês.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Tipo de Custo</TableHead>
                  <TableHead className="text-white/60">Descrição</TableHead>
                  <TableHead className="text-white/60">Valor</TableHead>
                  <TableHead className="text-white/60">Data</TableHead>
                  <TableHead className="text-white/60">Banco</TableHead>
                  <TableHead className="text-white/60">Responsável</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60 w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((g) => (
                  <TableRow key={g.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white text-sm font-medium">
                      {g.tipo_custo_nome}
                    </TableCell>
                    <TableCell className="text-white/70 text-sm max-w-[200px] truncate">
                      {g.descricao || "—"}
                    </TableCell>
                    <TableCell className="text-white text-sm">
                      {formatCurrency(g.valor)}
                    </TableCell>
                    <TableCell className="text-white/70 text-sm">
                      {format(new Date(g.data + "T12:00:00"), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-white/70 text-sm">
                      {g.banco_nome || "—"}
                    </TableCell>
                    <TableCell className="text-white/70 text-sm">
                      {g.responsavel_nome}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          g.status === "pago"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {g.status === "pago" ? "Pago" : "Pendente"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(g)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(g.id);
                            setDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingGasto ? "Editar Gasto" : "Novo Gasto"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {editingGasto
                ? "Atualize as informações do gasto."
                : "Preencha os dados para registrar um novo gasto."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/80 text-sm">Tipo de Custo *</Label>
              <Select value={tipoCustoId} onValueChange={handleTipoCustoChange}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Selecione o tipo de custo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  {tiposAtivos.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-white hover:bg-white/10">
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80 text-sm">Descrição</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do gasto"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80 text-sm">Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">Data *</Label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/80 text-sm">Responsável pelo Pagamento *</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  {colaboradores.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id} className="text-white hover:bg-white/10">
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80 text-sm">Banco *</Label>
              <Select value={bancoId} onValueChange={setBancoId}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  {bancos.filter(b => b.ativo).map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-white hover:bg-white/10">
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80 text-sm">Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações opcionais"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30 min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !tipoCustoId || !valor || !responsavelId || !bancoId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#111] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir gasto?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
