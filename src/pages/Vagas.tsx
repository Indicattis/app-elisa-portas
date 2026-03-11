import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Eye, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVagas, VagaFormData, StatusVaga, Vaga } from "@/hooks/useVagas";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS } from "@/types/permissions";

const cargoLabels: Record<UserRole, string> = {
  administrador: "Administrador",
  atendente: "Atendente",
  gerente_comercial: "Gerente Comercial",
  gerente_fabril: "Gerente Fabril",
  diretor: "Diretor",
  gerente_marketing: "Gerente de Marketing",
  gerente_financeiro: "Gerente Financeiro",
  gerente_producao: "Gerente de Produção",
  gerente_instalacoes: "Gerente de Instalações",
  instalador: "Instalador",
  aux_instalador: "Auxiliar de Instalação",
  analista_marketing: "Analista de Marketing",
  assistente_marketing: "Assistente de Marketing",
  coordenador_vendas: "Coordenador de Vendas",
  vendedor: "Vendedor",
  assistente_administrativo: "Assistente Administrativo",
  soldador: "Soldador",
  aux_geral: "Auxiliar Geral",
  pintor: "Pintor",
  aux_pintura: "Auxiliar de Pintura",
};

const statusConfig: Record<StatusVaga, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  em_analise: { label: "Em Análise", variant: "secondary" },
  aberta: { label: "Aberta", variant: "default" },
  fechada: { label: "Fechada", variant: "outline" },
  preenchida: { label: "Preenchida", variant: "default" },
};

export default function Vagas() {
  const { vagas, loading, createVaga, updateVagaStatus, deleteVaga } = useVagas();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [newStatus, setNewStatus] = useState<StatusVaga | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusVaga | "todas">("todas");

  const [formData, setFormData] = useState<VagaFormData>({
    cargo: "atendente",
    justificativa: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createVaga(formData);
    if (success) {
      setIsDialogOpen(false);
      setFormData({ cargo: "atendente", justificativa: "" });
    }
  };

  const handleViewDetails = (vaga: Vaga) => {
    setSelectedVaga(vaga);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = (vaga: Vaga, status: StatusVaga) => {
    setSelectedVaga(vaga);
    setNewStatus(status);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (selectedVaga && newStatus) {
      await updateVagaStatus(selectedVaga.id, newStatus);
      setIsStatusDialogOpen(false);
      setSelectedVaga(null);
      setNewStatus(null);
    }
  };

  const handleDeleteClick = (vaga: Vaga) => {
    setSelectedVaga(vaga);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedVaga) {
      await deleteVaga(selectedVaga.id);
      setIsDeleteDialogOpen(false);
      setSelectedVaga(null);
    }
  };

  const vagasFiltradas = filtroStatus === "todas" 
    ? vagas 
    : vagas.filter(v => v.status === filtroStatus);

  const vagasPorStatus = {
    em_analise: vagas.filter(v => v.status === "em_analise").length,
    aberta: vagas.filter(v => v.status === "aberta").length,
    fechada: vagas.filter(v => v.status === "fechada").length,
    preenchida: vagas.filter(v => v.status === "preenchida").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vagas</h1>
          <p className="text-muted-foreground">Gerencie solicitações de vagas</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Vaga
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFiltroStatus("em_analise")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vagasPorStatus.em_analise}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFiltroStatus("aberta")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vagasPorStatus.aberta}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFiltroStatus("preenchida")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preenchidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vagasPorStatus.preenchida}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFiltroStatus("fechada")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fechadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vagasPorStatus.fechada}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as StatusVaga | "todas")}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="aberta">Aberta</SelectItem>
              <SelectItem value="fechada">Fechada</SelectItem>
              <SelectItem value="preenchida">Preenchida</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabela de vagas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vagas</CardTitle>
          <CardDescription>
            {vagasFiltradas.length} {vagasFiltradas.length === 1 ? "vaga" : "vagas"} encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma vaga encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  vagasFiltradas.map((vaga) => (
                    <TableRow key={vaga.id}>
                      <TableCell>
                        <Badge variant="outline">{cargoLabels[vaga.cargo]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[vaga.status].variant}>
                          {statusConfig[vaga.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {vaga.justificativa}
                      </TableCell>
                      <TableCell>
                        {format(new Date(vaga.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(vaga)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select
                            value={vaga.status}
                            onValueChange={(v) => handleStatusChange(vaga, v as StatusVaga)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="em_analise">Em Análise</SelectItem>
                              <SelectItem value="aberta">Aberta</SelectItem>
                              <SelectItem value="fechada">Fechada</SelectItem>
                              <SelectItem value="preenchida">Preenchida</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(vaga)}
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
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Vaga */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Vaga</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova solicitação de vaga
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={formData.cargo}
                  onValueChange={(value) => setFormData({ ...formData, cargo: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(cargoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa</Label>
                <Textarea
                  id="justificativa"
                  value={formData.justificativa}
                  onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                  placeholder="Descreva o motivo da solicitação da vaga..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Vaga</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Vaga</DialogTitle>
          </DialogHeader>
          {selectedVaga && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Cargo</Label>
                <div className="mt-1">
                  <Badge variant="outline">{cargoLabels[selectedVaga.cargo]}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge variant={statusConfig[selectedVaga.status].variant}>
                    {statusConfig[selectedVaga.status].label}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Justificativa</Label>
                <p className="mt-1 text-sm">{selectedVaga.justificativa}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data de Criação</Label>
                <p className="mt-1 text-sm">
                  {format(new Date(selectedVaga.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmação Status */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Status da Vaga</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o status desta vaga para{" "}
              <strong>{newStatus && statusConfig[newStatus].label}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Confirmação Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vaga</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
