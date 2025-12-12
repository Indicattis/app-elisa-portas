import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Search, Plus, Loader2, Check, X, ArrowRight, FileEdit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Solicitacao {
  id: string;
  colaborador_id: string;
  solicitante_id: string;
  status: string;
  nome_atual: string | null;
  nome_novo: string | null;
  email_atual: string | null;
  email_novo: string | null;
  telefone_atual: string | null;
  telefone_novo: string | null;
  cpf_atual: string | null;
  cpf_novo: string | null;
  data_nascimento_atual: string | null;
  data_nascimento_novo: string | null;
  role_atual: string | null;
  role_novo: string | null;
  setor_atual: string | null;
  setor_novo: string | null;
  salario_atual: number | null;
  salario_novo: number | null;
  motivo: string | null;
  observacoes_aprovacao: string | null;
  aprovador_id: string | null;
  data_aprovacao: string | null;
  created_at: string;
}

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  role: string;
  setor: string | null;
  cpf: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  salario: number | null;
}

const SETORES = [
  { value: "vendas", label: "Vendas" },
  { value: "marketing", label: "Marketing" },
  { value: "instalacoes", label: "Instalações" },
  { value: "fabrica", label: "Fábrica" },
  { value: "administrativo", label: "Administrativo" },
];

export default function SolicitacoesMudancaCadastro() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // Form state for new request
  const [selectedColaborador, setSelectedColaborador] = useState<string>("");
  const [formData, setFormData] = useState({
    nome_novo: "",
    email_novo: "",
    telefone_novo: "",
    cpf_novo: "",
    data_nascimento_novo: "",
    role_novo: "",
    setor_novo: "",
    salario_novo: "",
    motivo: "",
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch solicitações
  const { data: solicitacoes = [], isLoading } = useQuery({
    queryKey: ["solicitacoes-mudanca-cadastro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_mudanca_cadastro")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Solicitacao[];
    },
  });

  // Fetch colaboradores for dropdown
  const { data: colaboradores = [] } = useQuery({
    queryKey: ["colaboradores-for-solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, nome, email, role, setor, cpf, telefone, data_nascimento, salario")
        .eq("ativo", true)
        .eq("eh_colaborador", true)
        .order("nome");

      if (error) throw error;
      return data as Colaborador[];
    },
  });

  // Fetch system roles
  const { data: systemRoles = [] } = useQuery({
    queryKey: ["system-roles-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_roles")
        .select("key, label")
        .eq("ativo", true)
        .order("ordem");

      if (error) throw error;
      return data as { key: string; label: string }[];
    },
  });

  // Fetch admin users for names
  const { data: adminUsers = [] } = useQuery({
    queryKey: ["admin-users-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id, nome");

      if (error) throw error;
      return data as { user_id: string; nome: string }[];
    },
  });

  const roleLabelsMap = systemRoles.reduce((acc, role) => {
    acc[role.key] = role.label;
    return acc;
  }, {} as Record<string, string>);

  const getUserName = (userId: string) => {
    const user = adminUsers.find(u => u.user_id === userId);
    return user?.nome || "Usuário desconhecido";
  };

  const getColaboradorName = (colaboradorId: string) => {
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    return colaborador?.nome || "Colaborador não encontrado";
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const colaborador = colaboradores.find(c => c.id === selectedColaborador);
      if (!colaborador) throw new Error("Colaborador não encontrado");

      const { error } = await supabase.from("solicitacoes_mudanca_cadastro").insert({
        colaborador_id: selectedColaborador,
        solicitante_id: user?.id,
        nome_atual: colaborador.nome,
        nome_novo: formData.nome_novo || null,
        email_atual: colaborador.email,
        email_novo: formData.email_novo || null,
        telefone_atual: colaborador.telefone,
        telefone_novo: formData.telefone_novo || null,
        cpf_atual: colaborador.cpf,
        cpf_novo: formData.cpf_novo || null,
        data_nascimento_atual: colaborador.data_nascimento,
        data_nascimento_novo: formData.data_nascimento_novo || null,
        role_atual: colaborador.role,
        role_novo: formData.role_novo || null,
        setor_atual: colaborador.setor,
        setor_novo: formData.setor_novo || null,
        salario_atual: colaborador.salario,
        salario_novo: formData.salario_novo ? parseFloat(formData.salario_novo.replace(/\D/g, "")) / 100 : null,
        motivo: formData.motivo,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-mudanca-cadastro"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Solicitação criada com sucesso" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao criar solicitação" });
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (solicitacao: Solicitacao) => {
      // Update the colaborador with new values
      const updateData: Record<string, unknown> = {};
      if (solicitacao.nome_novo) updateData.nome = solicitacao.nome_novo;
      if (solicitacao.email_novo) updateData.email = solicitacao.email_novo;
      if (solicitacao.telefone_novo) updateData.telefone = solicitacao.telefone_novo;
      if (solicitacao.cpf_novo) updateData.cpf = solicitacao.cpf_novo;
      if (solicitacao.data_nascimento_novo) updateData.data_nascimento = solicitacao.data_nascimento_novo;
      if (solicitacao.role_novo) updateData.role = solicitacao.role_novo;
      if (solicitacao.setor_novo) updateData.setor = solicitacao.setor_novo;
      if (solicitacao.salario_novo !== null) updateData.salario = solicitacao.salario_novo;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("admin_users")
          .update(updateData)
          .eq("id", solicitacao.colaborador_id);

        if (updateError) throw updateError;
      }

      // Update solicitação status
      const { error } = await supabase
        .from("solicitacoes_mudanca_cadastro")
        .update({
          status: "aprovada",
          aprovador_id: user?.id,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", solicitacao.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-mudanca-cadastro"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast({ title: "Solicitação aprovada e alterações aplicadas" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao aprovar solicitação" });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ solicitacao, reason }: { solicitacao: Solicitacao; reason: string }) => {
      const { error } = await supabase
        .from("solicitacoes_mudanca_cadastro")
        .update({
          status: "rejeitada",
          aprovador_id: user?.id,
          data_aprovacao: new Date().toISOString(),
          observacoes_aprovacao: reason,
        })
        .eq("id", solicitacao.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-mudanca-cadastro"] });
      setRejectDialogOpen(false);
      setSelectedSolicitacao(null);
      setRejectReason("");
      toast({ title: "Solicitação rejeitada" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao rejeitar solicitação" });
    },
  });

  const resetForm = () => {
    setSelectedColaborador("");
    setFormData({
      nome_novo: "",
      email_novo: "",
      telefone_novo: "",
      cpf_novo: "",
      data_nascimento_novo: "",
      role_novo: "",
      setor_novo: "",
      salario_novo: "",
      motivo: "",
    });
  };

  const handleColaboradorSelect = (colaboradorId: string) => {
    setSelectedColaborador(colaboradorId);
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    if (colaborador) {
      setFormData({
        nome_novo: colaborador.nome,
        email_novo: colaborador.email,
        telefone_novo: colaborador.telefone || "",
        cpf_novo: colaborador.cpf || "",
        data_nascimento_novo: colaborador.data_nascimento || "",
        role_novo: colaborador.role,
        setor_novo: colaborador.setor || "",
        salario_novo: colaborador.salario ? formatCurrency(colaborador.salario) : "",
        motivo: "",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSalarioChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      const formatted = (parseInt(numericValue) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setFormData(prev => ({ ...prev, salario_novo: formatted }));
    } else {
      setFormData(prev => ({ ...prev, salario_novo: "" }));
    }
  };

  const getChanges = (solicitacao: Solicitacao) => {
    const changes: { field: string; from: string; to: string }[] = [];
    
    if (solicitacao.nome_novo && solicitacao.nome_novo !== solicitacao.nome_atual) {
      changes.push({ field: "Nome", from: solicitacao.nome_atual || "—", to: solicitacao.nome_novo });
    }
    if (solicitacao.email_novo && solicitacao.email_novo !== solicitacao.email_atual) {
      changes.push({ field: "Email", from: solicitacao.email_atual || "—", to: solicitacao.email_novo });
    }
    if (solicitacao.telefone_novo && solicitacao.telefone_novo !== solicitacao.telefone_atual) {
      changes.push({ field: "Telefone", from: solicitacao.telefone_atual || "—", to: solicitacao.telefone_novo });
    }
    if (solicitacao.cpf_novo && solicitacao.cpf_novo !== solicitacao.cpf_atual) {
      changes.push({ field: "CPF", from: solicitacao.cpf_atual || "—", to: solicitacao.cpf_novo });
    }
    if (solicitacao.role_novo && solicitacao.role_novo !== solicitacao.role_atual) {
      changes.push({ 
        field: "Função", 
        from: roleLabelsMap[solicitacao.role_atual || ""] || solicitacao.role_atual || "—", 
        to: roleLabelsMap[solicitacao.role_novo] || solicitacao.role_novo 
      });
    }
    if (solicitacao.setor_novo && solicitacao.setor_novo !== solicitacao.setor_atual) {
      const setorAtualLabel = SETORES.find(s => s.value === solicitacao.setor_atual)?.label || solicitacao.setor_atual;
      const setorNovoLabel = SETORES.find(s => s.value === solicitacao.setor_novo)?.label || solicitacao.setor_novo;
      changes.push({ field: "Setor", from: setorAtualLabel || "—", to: setorNovoLabel });
    }
    if (solicitacao.salario_novo !== null && solicitacao.salario_novo !== solicitacao.salario_atual) {
      changes.push({ 
        field: "Salário", 
        from: solicitacao.salario_atual ? formatCurrency(solicitacao.salario_atual) : "—", 
        to: formatCurrency(solicitacao.salario_novo) 
      });
    }

    return changes;
  };

  const filteredSolicitacoes = solicitacoes.filter(s => {
    const colaboradorName = getColaboradorName(s.colaborador_id);
    const matchesSearch = colaboradorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = solicitacoes.filter(s => s.status === "pendente").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Mudança</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie solicitações de alterações no cadastro dos colaboradores
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Mudança</DialogTitle>
              <DialogDescription>
                Selecione o colaborador e preencha os campos que deseja alterar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Select value={selectedColaborador} onValueChange={handleColaboradorSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {colaboradores.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedColaborador && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={formData.nome_novo}
                        onChange={e => setFormData(prev => ({ ...prev, nome_novo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email_novo}
                        onChange={e => setFormData(prev => ({ ...prev, email_novo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.telefone_novo}
                        onChange={e => setFormData(prev => ({ ...prev, telefone_novo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        value={formData.cpf_novo}
                        onChange={e => setFormData(prev => ({ ...prev, cpf_novo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={formData.data_nascimento_novo}
                        onChange={e => setFormData(prev => ({ ...prev, data_nascimento_novo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Select 
                        value={formData.role_novo} 
                        onValueChange={value => setFormData(prev => ({ ...prev, role_novo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {systemRoles.map(role => (
                            <SelectItem key={role.key} value={role.key}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Setor</Label>
                      <Select 
                        value={formData.setor_novo} 
                        onValueChange={value => setFormData(prev => ({ ...prev, setor_novo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {SETORES.map(setor => (
                            <SelectItem key={setor.value} value={setor.value}>{setor.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Salário</Label>
                      <Input
                        value={formData.salario_novo}
                        onChange={e => handleSalarioChange(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Motivo / Justificativa *</Label>
                    <Textarea
                      value={formData.motivo}
                      onChange={e => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                      placeholder="Descreva o motivo da solicitação..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => createMutation.mutate()} 
                disabled={!selectedColaborador || !formData.motivo || createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Criar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Solicitações</CardTitle>
              <CardDescription className="text-xs">
                {pendingCount > 0 ? `${pendingCount} pendente(s) de aprovação` : "Nenhuma solicitação pendente"}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div className="relative flex-1 max-w-[280px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                <SelectItem value="pendente" className="text-xs">Pendente</SelectItem>
                <SelectItem value="aprovada" className="text-xs">Aprovada</SelectItem>
                <SelectItem value="rejeitada" className="text-xs">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-[10px] py-1 px-2">Colaborador</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Mudanças</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Solicitante</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Data</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Status</TableHead>
                  <TableHead className="text-right text-[10px] py-1 px-2">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      <FileEdit className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Nenhuma solicitação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSolicitacoes.map((solicitacao) => {
                    const changes = getChanges(solicitacao);
                    return (
                      <TableRow key={solicitacao.id} className="h-auto">
                        <TableCell className="py-2 px-2 text-[11px] font-medium">
                          {getColaboradorName(solicitacao.colaborador_id)}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-[10px]">
                          <div className="space-y-1 max-w-[300px]">
                            {changes.map((change, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[10px]">
                                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 shrink-0">
                                  {change.field}
                                </Badge>
                                <span className="text-muted-foreground truncate">{change.from}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="font-medium truncate">{change.to}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2 text-[10px]">
                          {getUserName(solicitacao.solicitante_id)}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-[10px]">
                          {format(new Date(solicitacao.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="py-2 px-2">
                          <Badge 
                            variant={
                              solicitacao.status === "aprovada" ? "default" :
                              solicitacao.status === "rejeitada" ? "destructive" : "secondary"
                            }
                            className="text-[9px] px-1 py-0 h-4"
                          >
                            {solicitacao.status === "pendente" ? "Pendente" :
                             solicitacao.status === "aprovada" ? "Aprovada" : "Rejeitada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-2 px-2">
                          {solicitacao.status === "pendente" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveMutation.mutate(solicitacao)}
                                disabled={approveMutation.isPending}
                                className="h-6 px-2 text-[10px]"
                                title="Aprovar"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSolicitacao(solicitacao);
                                  setRejectDialogOpen(true);
                                }}
                                className="h-6 px-2 text-[10px]"
                                title="Rejeitar"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {solicitacao.status !== "pendente" && solicitacao.observacoes_aprovacao && (
                            <span className="text-[9px] text-muted-foreground italic">
                              {solicitacao.observacoes_aprovacao}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da Rejeição</Label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedSolicitacao) {
                  rejectMutation.mutate({ solicitacao: selectedSolicitacao, reason: rejectReason });
                }
              }}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
