import { useState, useMemo } from "react";
import { Users, Plus, Search, Pencil, Trash2, X, UserCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import {
  useClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
  Cliente,
  ClienteFormData,
  TipoCliente,
} from "@/hooks/useClientes";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";
import { Skeleton } from "@/components/ui/skeleton";

const TIPOS_CLIENTE_CONFIG: Record<TipoCliente, { label: string; variant: "secondary" | "default" }> = {
  CE: { label: "CE", variant: "secondary" },
  CR: { label: "CR", variant: "default" },
};

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// Função para formatar tempo desde a última compra
function formatarTempoDesdeUltimaCompra(dataUltimaCompra: string | null | undefined): string {
  if (!dataUltimaCompra) return "-";
  
  const hoje = new Date();
  const dataCompra = new Date(dataUltimaCompra);
  const diffMs = hoje.getTime() - dataCompra.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias < 0) return "-";
  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "1 dia";
  if (diffDias < 7) return `${diffDias} dias`;
  if (diffDias < 14) return "1 semana";
  if (diffDias < 30) return `${Math.floor(diffDias / 7)} semanas`;
  if (diffDias < 60) return "1 mês";
  if (diffDias < 365) return `${Math.floor(diffDias / 30)} meses`;
  if (diffDias < 730) return "1 ano";
  return `${Math.floor(diffDias / 365)} anos`;
}

export default function Clientes() {
  const { data: clientes, isLoading } = useClientes();
  const { canais } = useCanaisAquisicao();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteExcluir, setClienteExcluir] = useState<Cliente | null>(null);

  const clientesFiltrados = useMemo(() => {
    if (!clientes) return [];

    return clientes.filter((cliente) => {
      const buscaLower = busca.toLowerCase();
      const matchBusca =
        !busca ||
        cliente.nome?.toLowerCase().includes(buscaLower) ||
        cliente.telefone?.toLowerCase().includes(buscaLower) ||
        cliente.email?.toLowerCase().includes(buscaLower) ||
        cliente.cpf_cnpj?.toLowerCase().includes(buscaLower) ||
        cliente.cidade?.toLowerCase().includes(buscaLower);

      const matchEstado = filtroEstado === "todos" || cliente.estado === filtroEstado;
      const matchCanal = filtroCanal === "todos" || cliente.canal_aquisicao_id === filtroCanal;
      const matchTipo = filtroTipo === "todos" || cliente.tipo_cliente === filtroTipo;

      return matchBusca && matchEstado && matchCanal && matchTipo;
    });
  }, [clientes, busca, filtroEstado, filtroCanal, filtroTipo]);

  const handleNovoCliente = () => {
    setClienteEditando(null);
    setDialogOpen(true);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: ClienteFormData) => {
    if (clienteEditando) {
      await updateCliente.mutateAsync({ id: clienteEditando.id, data });
    } else {
      await createCliente.mutateAsync(data);
    }
    setDialogOpen(false);
    setClienteEditando(null);
  };

  const handleExcluir = async () => {
    if (clienteExcluir) {
      await deleteCliente.mutateAsync(clienteExcluir.id);
      setClienteExcluir(null);
    }
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroEstado("todos");
    setFiltroCanal("todos");
    setFiltroTipo("todos");
  };

  const temFiltrosAtivos = busca || filtroEstado !== "todos" || filtroCanal !== "todos" || filtroTipo !== "todos";

  // Métricas para as metas
  const totalClientes = clientes?.length || 0;
  const totalClientesCR = useMemo(() => {
    return clientes?.filter(c => c.tipo_cliente === 'CR').length || 0;
  }, [clientes]);

  const META_TOTAL = 10000;
  const META_CR = 1000;
  const progressoTotal = Math.min((totalClientes / META_TOTAL) * 100, 100);
  const progressoCR = Math.min((totalClientesCR / META_CR) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clientes
          </h1>
          <p className="text-muted-foreground">Gestão de clientes da empresa</p>
        </div>
        <Button onClick={handleNovoCliente}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Cards de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">Meta: 10.000 Clientes Totais</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{totalClientes.toLocaleString('pt-BR')}</span>
              <span className="text-sm text-muted-foreground">
                / {META_TOTAL.toLocaleString('pt-BR')}
              </span>
            </div>
            <Progress value={progressoTotal} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {progressoTotal.toFixed(2)}% concluído
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Meta: 1.000 Clientes Recorrentes (CR)</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{totalClientesCR.toLocaleString('pt-BR')}</span>
              <span className="text-sm text-muted-foreground">
                / {META_CR.toLocaleString('pt-BR')}
              </span>
            </div>
            <Progress value={progressoCR} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {progressoCR.toFixed(2)}% concluído
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, e-mail, CPF/CNPJ ou cidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos UFs</SelectItem>
                {ESTADOS_BR.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroCanal} onValueChange={setFiltroCanal}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Canais</SelectItem>
                {canais.map((canal) => (
                  <SelectItem key={canal.id} value={canal.id}>
                    {canal.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Tipos</SelectItem>
                <SelectItem value="CE">CE - Esporádico</SelectItem>
                <SelectItem value="CR">CR - Recorrente</SelectItem>
              </SelectContent>
            </Select>

            {temFiltrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Lista de Clientes
            {clientesFiltrados.length > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({clientesFiltrados.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {clientes?.length === 0
                ? "Nenhum cliente cadastrado ainda."
                : "Nenhum cliente encontrado com os filtros aplicados."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[60px]">Tag</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
                    <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                    <TableHead className="hidden xl:table-cell">Canal</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Nº Vendas</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Total Vendas</TableHead>
                    <TableHead className="hidden md:table-cell">Última Compra</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cliente.nome}</div>
                          {cliente.email && (
                            <div className="text-sm text-muted-foreground">{cliente.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.tipo_cliente ? (
                          <Badge 
                            variant={TIPOS_CLIENTE_CONFIG[cliente.tipo_cliente].variant}
                            className={cliente.tipo_cliente === 'CR' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {TIPOS_CLIENTE_CONFIG[cliente.tipo_cliente].label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{cliente.telefone || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {cliente.cpf_cnpj || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {cliente.cidade && cliente.estado
                          ? `${cliente.cidade}/${cliente.estado}`
                          : cliente.cidade || cliente.estado || "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {cliente.canal_aquisicao?.nome || "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        {cliente.numero_vendas && cliente.numero_vendas > 0
                          ? cliente.numero_vendas
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right font-medium">
                        {cliente.total_vendas && cliente.total_vendas > 0
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.total_vendas)
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatarTempoDesdeUltimaCompra(cliente.ultima_compra)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditarCliente(cliente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setClienteExcluir(cliente)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {clienteEditando ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {clienteEditando
                ? "Atualize as informações do cliente abaixo."
                : "Preencha os dados para cadastrar um novo cliente."}
            </DialogDescription>
          </DialogHeader>
          <ClienteForm
            cliente={clienteEditando}
            onSubmit={handleSubmit}
            isLoading={createCliente.isPending || updateCliente.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!clienteExcluir} onOpenChange={() => setClienteExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clienteExcluir?.nome}"? Esta ação pode ser
              desfeita pelo administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
