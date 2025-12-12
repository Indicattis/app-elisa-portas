import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, X, Edit, Save, Loader2 } from "lucide-react";
import { ROLE_LABELS } from "@/types/permissions";

interface Colaborador {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: string;
  setor: string | null;
  cpf: string | null;
  salario: number | null;
  foto_perfil_url: string | null;
  ativo: boolean;
}

export default function Colaboradores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSetor, setFilterSetor] = useState<string>("todos");
  const [filterRole, setFilterRole] = useState<string>("todos");
  const [editingSalario, setEditingSalario] = useState<string | null>(null);
  const [salarioInput, setSalarioInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar colaboradores ativos
  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, user_id, nome, email, role, setor, cpf, salario, foto_perfil_url, ativo")
        .eq("ativo", true)
        .eq("eh_colaborador", true)
        .order("nome");

      if (error) throw error;
      return data as Colaborador[];
    },
  });

  // Buscar cargos do sistema
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

  const roleLabelsMap = systemRoles.reduce((acc, role) => {
    acc[role.key] = role.label;
    return acc;
  }, {} as Record<string, string>);

  // Mutation para atualizar salário
  const updateSalarioMutation = useMutation({
    mutationFn: async ({ id, salario }: { id: string; salario: number | null }) => {
      const { error } = await supabase
        .from("admin_users")
        .update({ salario })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      setEditingSalario(null);
      setSalarioInput("");
      toast({ title: "Salário atualizado com sucesso" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar salário" });
    },
  });

  const handleSaveSalario = (id: string) => {
    const salarioNumerico = salarioInput ? parseFloat(salarioInput.replace(/\D/g, "")) / 100 : null;
    updateSalarioMutation.mutate({ id, salario: salarioNumerico });
  };

  const handleEditSalario = (colaborador: Colaborador) => {
    setEditingSalario(colaborador.id);
    setSalarioInput(colaborador.salario ? formatCurrency(colaborador.salario) : "");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSalarioInputChange = (value: string) => {
    // Remove tudo que não é número
    const numericValue = value.replace(/\D/g, "");
    // Formata como moeda
    if (numericValue) {
      const formatted = (parseInt(numericValue) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setSalarioInput(formatted);
    } else {
      setSalarioInput("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCPF = (cpf: string) => {
    if (cpf.length === 11 && /^\d+$/.test(cpf)) {
      return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    }
    return cpf;
  };

  const filteredColaboradores = colaboradores.filter((colaborador) => {
    const matchesSearch =
      colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSetor = filterSetor === "todos" || colaborador.setor === filterSetor;
    const matchesRole = filterRole === "todos" || colaborador.role === filterRole;

    return matchesSearch && matchesSetor && matchesRole;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSetor("todos");
    setFilterRole("todos");
  };

  const hasActiveFilters = searchTerm || filterSetor !== "todos" || filterRole !== "todos";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Colaboradores</h1>
        <p className="text-muted-foreground mt-2">
          Visualize os colaboradores da empresa
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Lista de Colaboradores</CardTitle>
              <CardDescription className="text-xs">
                {filteredColaboradores.length} de {colaboradores.length} colaboradores
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                <X className="w-3 h-3 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Select value={filterSetor} onValueChange={setFilterSetor}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-xs">Todos setores</SelectItem>
                <SelectItem value="vendas" className="text-xs">Vendas</SelectItem>
                <SelectItem value="marketing" className="text-xs">Marketing</SelectItem>
                <SelectItem value="instalacoes" className="text-xs">Instalações</SelectItem>
                <SelectItem value="fabrica" className="text-xs">Fábrica</SelectItem>
                <SelectItem value="administrativo" className="text-xs">Administrativo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-xs">Todas funções</SelectItem>
                {systemRoles.map((role) => (
                  <SelectItem key={role.key} value={role.key} className="text-xs">
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-[10px] py-1 px-2">Foto</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Nome</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Email</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Função</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Setor</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">CPF</TableHead>
                  <TableHead className="text-[10px] py-1 px-2">Salário</TableHead>
                  <TableHead className="text-right text-[10px] py-1 px-2">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum colaborador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredColaboradores.map((colaborador) => (
                    <TableRow key={colaborador.id} className="h-[36px]">
                      <TableCell className="py-1 px-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={colaborador.foto_perfil_url || undefined} alt={colaborador.nome} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(colaborador.nome)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="py-1 px-2 text-[11px] font-medium">
                        <span className="truncate block max-w-[150px]">{colaborador.nome}</span>
                      </TableCell>
                      <TableCell className="py-1 px-2 text-[10px]">
                        <span className="truncate block max-w-[180px]">{colaborador.email}</span>
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          <span className="truncate block max-w-[80px]">
                            {roleLabelsMap[colaborador.role] || ROLE_LABELS[colaborador.role] || colaborador.role}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {colaborador.setor === "vendas" ? "Vendas" :
                           colaborador.setor === "marketing" ? "Marketing" :
                           colaborador.setor === "instalacoes" ? "Instalações" :
                           colaborador.setor === "fabrica" ? "Fábrica" :
                           colaborador.setor === "administrativo" ? "Admin" : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 px-2 text-[10px]">
                        {colaborador.cpf ? formatCPF(colaborador.cpf) : "—"}
                      </TableCell>
                      <TableCell className="py-1 px-2 text-[10px]">
                        {editingSalario === colaborador.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={salarioInput}
                              onChange={(e) => handleSalarioInputChange(e.target.value)}
                              className="h-6 w-24 text-[10px] px-1"
                              placeholder="0,00"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveSalario(colaborador.id)}
                              disabled={updateSalarioMutation.isPending}
                              className="h-5 w-5 p-0"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSalario(null);
                                setSalarioInput("");
                              }}
                              className="h-5 w-5 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {colaborador.salario ? formatCurrency(colaborador.salario) : "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-1 px-2">
                        {editingSalario !== colaborador.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSalario(colaborador)}
                            className="h-5 w-5 p-0"
                            title="Editar salário"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
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
  );
}
