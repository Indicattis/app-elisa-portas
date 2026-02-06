import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X, Loader2, Plus, Check, XCircle, UserPlus, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useVagas, StatusVaga } from "@/hooks/useVagas";
import { PreencherVagaDialog } from "@/components/vagas/PreencherVagaDialog";

const STATUS_CONFIG: Record<StatusVaga, { label: string; classes: string }> = {
  em_analise: { label: "Em Análise", classes: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
  aberta: { label: "Aberta", classes: "border-green-500/30 text-green-400 bg-green-500/10" },
  fechada: { label: "Fechada", classes: "border-red-500/30 text-red-400 bg-red-500/10" },
  preenchida: { label: "Preenchida", classes: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
};

export default function VagasPage() {
  const queryClient = useQueryClient();
  const { vagas, loading, createVaga, updateVagaStatus, deleteVaga, refetch } = useVagas();

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Dialog Nova Vaga
  const [novaVagaOpen, setNovaVagaOpen] = useState(false);
  const [novaVagaCargo, setNovaVagaCargo] = useState("");
  const [novaVagaJustificativa, setNovaVagaJustificativa] = useState("");
  const [criandoVaga, setCriandoVaga] = useState(false);

  // Dialog Preencher Vaga
  const [preencherVagaId, setPreencherVagaId] = useState<string | null>(null);
  const [preencherVagaCargo, setPreencherVagaCargo] = useState("");

  // Buscar roles do sistema
  const { data: systemRoles = [] } = useQuery({
    queryKey: ["system-roles-vagas"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("system_roles")
        .select("key, label")
        .eq("ativo", true)
        .order("ordem");
      if (result.error) throw result.error;
      return result.data as { key: string; label: string }[];
    },
  });

  const getRoleLabel = (key: string) => {
    const role = systemRoles.find((r) => r.key === key);
    return role?.label || key;
  };

  // Filtros
  const filteredVagas = useMemo(() => {
    return vagas.filter((v) => {
      const matchSearch = getRoleLabel(v.cargo).toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.justificativa.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filtroStatus === "todos" || v.status === filtroStatus;
      return matchSearch && matchStatus;
    });
  }, [vagas, searchTerm, filtroStatus, systemRoles]);

  const clearFilters = () => {
    setSearchTerm("");
    setFiltroStatus("todos");
  };

  const hasActiveFilters = searchTerm || filtroStatus !== "todos";

  // Criar vaga
  const handleCriarVaga = async () => {
    if (!novaVagaCargo || !novaVagaJustificativa.trim()) return;
    setCriandoVaga(true);
    const success = await createVaga({
      cargo: novaVagaCargo as any,
      justificativa: novaVagaJustificativa,
    });
    if (success) {
      setNovaVagaOpen(false);
      setNovaVagaCargo("");
      setNovaVagaJustificativa("");
    }
    setCriandoVaga(false);
  };

  // Preencher vaga
  const handlePreencherClick = (vagaId: string, cargo: string) => {
    setPreencherVagaId(vagaId);
    setPreencherVagaCargo(cargo);
  };

  const handlePreencherSuccess = async () => {
    if (preencherVagaId) {
      await updateVagaStatus(preencherVagaId, "preenchida");
    }
    setPreencherVagaId(null);
    setPreencherVagaCargo("");
    queryClient.invalidateQueries({ queryKey: ["colaboradores-minimalista"] });
  };

  const headerActions = (
    <Button onClick={() => setNovaVagaOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Nova Vaga
    </Button>
  );

  const breadcrumbItems = [
    { label: "Home", path: "/home" },
    { label: "Administrativo", path: "/administrativo" },
    { label: "RH/DP", path: "/administrativo/rh-dp" },
    { label: "Vagas" },
  ];

  return (
    <MinimalistLayout
      title="Vagas"
      subtitle="Gestão de vagas da empresa"
      backPath="/administrativo/rh-dp"
      headerActions={headerActions}
      breadcrumbItems={breadcrumbItems}
    >
      {/* Filtros */}
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 mb-6">
        <div className="p-4 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar por cargo ou justificativa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="fechada">Fechada</SelectItem>
                <SelectItem value="preenchida">Preenchida</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="text-white/60 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredVagas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/60">
              <p className="text-lg">Nenhuma vaga encontrada</p>
              <p className="text-sm">Ajuste os filtros ou crie uma nova vaga</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Cargo</TableHead>
                  <TableHead className="text-white/60">Justificativa</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Data</TableHead>
                  <TableHead className="text-white/60 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVagas.map((vaga) => (
                  <TableRow key={vaga.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                        {getRoleLabel(vaga.cargo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/80 max-w-xs truncate">
                      {vaga.justificativa}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CONFIG[vaga.status]?.classes}>
                        {STATUS_CONFIG[vaga.status]?.label || vaga.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {format(new Date(vaga.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {vaga.status === "em_analise" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateVagaStatus(vaga.id, "aberta")}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              title="Aprovar"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateVagaStatus(vaga.id, "fechada")}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Recusar"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {vaga.status === "aberta" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreencherClick(vaga.id, vaga.cargo)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              title="Preencher vaga"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              <span className="text-xs">Preencher</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateVagaStatus(vaga.id, "fechada")}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Cancelar"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Dialog Nova Vaga */}
      <Dialog open={novaVagaOpen} onOpenChange={setNovaVagaOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Vaga</DialogTitle>
            <DialogDescription>Solicite a abertura de uma nova vaga para a empresa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Select value={novaVagaCargo} onValueChange={setNovaVagaCargo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map((role) => (
                    <SelectItem key={role.key} value={role.key}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea
                placeholder="Descreva o motivo da abertura da vaga..."
                value={novaVagaJustificativa}
                onChange={(e) => setNovaVagaJustificativa(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaVagaOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCriarVaga}
              disabled={criandoVaga || !novaVagaCargo || !novaVagaJustificativa.trim()}
            >
              {criandoVaga && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Solicitar Vaga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Preencher Vaga */}
      <PreencherVagaDialog
        open={!!preencherVagaId}
        onOpenChange={(open) => { if (!open) { setPreencherVagaId(null); setPreencherVagaCargo(""); } }}
        defaultRole={preencherVagaCargo}
        onSuccess={handlePreencherSuccess}
      />
    </MinimalistLayout>
  );
}
