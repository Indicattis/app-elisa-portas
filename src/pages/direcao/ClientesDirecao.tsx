import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, Cliente, ClienteFormData, TipoCliente } from '@/hooks/useClientes';
import { useCanaisAquisicao } from '@/hooks/useCanaisAquisicao';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { ClienteForm } from '@/components/clientes/ClienteForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, User, RefreshCw, Pencil, Trash2, X, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const TIPOS_CLIENTE_CONFIG: Record<TipoCliente, { label: string; color: string }> = {
  'CE': { label: 'CE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'CR': { label: 'CR', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const formatarTempoDesdeUltimaCompra = (dataUltimaCompra: string | null): string => {
  if (!dataUltimaCompra) return 'Nunca';
  
  const agora = new Date();
  const ultimaCompra = new Date(dataUltimaCompra);
  const diffMs = agora.getTime() - ultimaCompra.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias === 0) return 'Hoje';
  if (diffDias === 1) return 'Ontem';
  if (diffDias < 7) return `${diffDias} dias`;
  if (diffDias < 30) return `${Math.floor(diffDias / 7)} sem.`;
  if (diffDias < 365) return `${Math.floor(diffDias / 30)} meses`;
  return `${Math.floor(diffDias / 365)} anos`;
};

export default function ClientesDirecao() {
  const navigate = useNavigate();
  const { data: clientes, isLoading } = useClientes();
  const { canais } = useCanaisAquisicao();
  const { mutate: createCliente, isPending: isCreating } = useCreateCliente();
  const { mutate: updateCliente, isPending: isUpdating } = useUpdateCliente();
  const { mutate: deleteCliente, isPending: isDeleting } = useDeleteCliente();

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroCanal, setFiltroCanal] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroVendedor, setFiltroVendedor] = useState<string>('todos');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);

  // Calcular clientes CR por vendedor
  const clientesCRPorVendedor = useMemo(() => {
    const vendedoresMap = new Map<string, { nome: string; totalCR: number; total: number }>();
    
    clientes?.forEach(cliente => {
      if (cliente.created_by && cliente.vendedor) {
        const atual = vendedoresMap.get(cliente.created_by) || { 
          nome: cliente.vendedor.nome, 
          totalCR: 0,
          total: 0
        };
        atual.total++;
        if (cliente.tipo_cliente === 'CR') {
          atual.totalCR++;
        }
        vendedoresMap.set(cliente.created_by, atual);
      }
    });
    
    return Array.from(vendedoresMap.entries()).map(([id, data]) => ({
      id,
      nome: data.nome,
      totalCR: data.totalCR,
      total: data.total,
      meta: 500
    })).sort((a, b) => b.totalCR - a.totalCR);
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    if (!clientes) return [];
    
    return clientes.filter(cliente => {
      const matchBusca = !searchTerm || 
        cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cpf_cnpj?.includes(searchTerm) ||
        cliente.telefone?.includes(searchTerm);
      
      const matchEstado = filtroEstado === 'todos' || cliente.estado === filtroEstado;
      const matchCanal = filtroCanal === 'todos' || cliente.canal_aquisicao_id === filtroCanal;
      const matchTipo = filtroTipo === 'todos' || cliente.tipo_cliente === filtroTipo;
      const matchVendedor = filtroVendedor === 'todos' || cliente.created_by === filtroVendedor;
      
      return matchBusca && matchEstado && matchCanal && matchTipo && matchVendedor;
    });
  }, [clientes, searchTerm, filtroEstado, filtroCanal, filtroTipo, filtroVendedor]);

  const totalClientes = clientes?.length || 0;

  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroEstado('todos');
    setFiltroCanal('todos');
    setFiltroTipo('todos');
    setFiltroVendedor('todos');
  };

  const handleNovoCliente = () => {
    setClienteEditando(null);
    setDialogOpen(true);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setDialogOpen(true);
  };

  const handleSubmit = (data: ClienteFormData) => {
    if (clienteEditando) {
      updateCliente({ id: clienteEditando.id, data }, {
        onSuccess: () => {
          setDialogOpen(false);
          setClienteEditando(null);
        }
      });
    } else {
      createCliente(data, {
        onSuccess: () => {
          setDialogOpen(false);
        }
      });
    }
  };

  const handleExcluir = () => {
    if (!clienteParaExcluir) return;
    deleteCliente(clienteParaExcluir.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setClienteParaExcluir(null);
      }
    });
  };

  const headerActions = (
    <Button
      size="sm"
      onClick={handleNovoCliente}
      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
    >
      <Plus className="h-4 w-4 mr-1" />
      <span className="hidden sm:inline">Novo Cliente</span>
    </Button>
  );

  if (isLoading) {
    return (
      <MinimalistLayout 
        title="Clientes" 
        backPath="/direcao/vendas"
        breadcrumbItems={[
          { label: "Home", path: "/home" },
          { label: "Direção", path: "/direcao" },
          { label: "Vendas", path: "/direcao/vendas" },
          { label: "Clientes" }
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout 
      title="Clientes" 
      subtitle={`${totalClientes} clientes cadastrados`}
      backPath="/direcao/vendas"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Vendas", path: "/direcao/vendas" },
        { label: "Clientes" }
      ]}
      headerActions={headerActions}
    >
      {/* Cards de Meta por Vendedor - 500 CR cada */}
      {clientesCRPorVendedor.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {clientesCRPorVendedor.map(vendedor => (
            <div 
              key={vendedor.id} 
              className={`p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border transition-colors cursor-pointer ${
                filtroVendedor === vendedor.id ? 'border-emerald-500/50' : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setFiltroVendedor(filtroVendedor === vendedor.id ? 'todos' : vendedor.id)}
            >
              <div className="p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-sm text-white/70 truncate">{vendedor.nome}</span>
                  </div>
                  <span className="text-xl font-bold text-white shrink-0 ml-2">{vendedor.totalCR}</span>
                </div>
                <Progress 
                  value={Math.min((vendedor.totalCR / vendedor.meta) * 100, 100)} 
                  className="h-2" 
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-white/50">
                    {((vendedor.totalCR / vendedor.meta) * 100).toFixed(1)}% da meta
                  </p>
                  <p className="text-xs text-white/40">
                    {vendedor.total} clientes
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card de Filtros */}
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 mb-6">
        <div className="p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="todos" className="text-white">Todos Estados</SelectItem>
                {ESTADOS_BR.map(estado => (
                  <SelectItem key={estado} value={estado} className="text-white">{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroCanal} onValueChange={setFiltroCanal}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="todos" className="text-white">Todos Canais</SelectItem>
                {canais?.map(canal => (
                  <SelectItem key={canal.id} value={canal.id} className="text-white">{canal.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="todos" className="text-white">Todos Tipos</SelectItem>
                <SelectItem value="CE" className="text-white">CE - Eventual</SelectItem>
                <SelectItem value="CR" className="text-white">CR - Recorrente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="todos" className="text-white">Todos Vendedores</SelectItem>
                {clientesCRPorVendedor.map(v => (
                  <SelectItem key={v.id} value={v.id} className="text-white">{v.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || filtroEstado !== 'todos' || filtroCanal !== 'todos' || filtroTipo !== 'todos' || filtroVendedor !== 'todos') && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
              <span className="text-xs text-white/50">{clientesFiltrados.length} resultados</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="text-white/60 hover:text-white hover:bg-white/10 h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60 font-medium">Tag</TableHead>
                <TableHead className="text-white/60 font-medium">Nome</TableHead>
                <TableHead className="text-white/60 font-medium hidden md:table-cell">Contato</TableHead>
                <TableHead className="text-white/60 font-medium hidden lg:table-cell">Cidade/UF</TableHead>
                <TableHead className="text-white/60 font-medium hidden xl:table-cell">Canal</TableHead>
                <TableHead className="text-white/60 font-medium text-center">Vendas</TableHead>
                <TableHead className="text-white/60 font-medium text-right hidden sm:table-cell">Total</TableHead>
                <TableHead className="text-white/60 font-medium text-center hidden lg:table-cell">Última</TableHead>
                <TableHead className="text-white/60 font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-white/40">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map(cliente => (
                  <TableRow 
                    key={cliente.id} 
                    className="border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => handleEditarCliente(cliente)}
                  >
                    <TableCell>
                      {cliente.tipo_cliente ? (
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0.5 ${TIPOS_CLIENTE_CONFIG[cliente.tipo_cliente as TipoCliente]?.color || ''}`}
                        >
                          {cliente.tipo_cliente}
                        </Badge>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white font-medium">{cliente.nome}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {cliente.telefone && (
                          <span className="text-white/70 text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {cliente.telefone}
                          </span>
                        )}
                        {cliente.email && (
                          <span className="text-white/50 text-xs flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {cliente.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70 hidden lg:table-cell">
                      {cliente.cidade && cliente.estado 
                        ? `${cliente.cidade}/${cliente.estado}` 
                        : cliente.cidade || cliente.estado || '-'}
                    </TableCell>
                    <TableCell className="text-white/60 text-xs hidden xl:table-cell">
                      {cliente.canal_aquisicao?.nome || '-'}
                    </TableCell>
                    <TableCell className="text-center text-white/70">
                      {cliente.numero_vendas || 0}
                    </TableCell>
                    <TableCell className="text-right text-white font-medium hidden sm:table-cell">
                      {(cliente.total_vendas || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-center text-white/60 text-xs hidden lg:table-cell">
                      {formatarTempoDesdeUltimaCompra(cliente.ultima_compra)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditarCliente(cliente);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/50 hover:text-red-400 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClienteParaExcluir(cliente);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog Criar/Editar Cliente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {clienteEditando ? 'Atualize os dados do cliente' : 'Preencha os dados para cadastrar um novo cliente'}
            </DialogDescription>
          </DialogHeader>

          <div className="
            [&_label]:text-white/80
            [&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder:text-white/40
            [&_input:focus]:border-blue-500/50 [&_input:focus]:ring-blue-500/20
            [&_textarea]:bg-white/5 [&_textarea]:border-white/10 [&_textarea]:text-white [&_textarea]:placeholder:text-white/40
            [&_textarea:focus]:border-blue-500/50 [&_textarea:focus]:ring-blue-500/20
            [&_button[role=combobox]]:bg-white/5 [&_button[role=combobox]]:border-white/10 [&_button[role=combobox]]:text-white
            [&_button[role=combobox]:hover]:bg-white/10
            [&_[data-placeholder]]:text-white/40
            [&_.text-destructive]:text-red-400
            [&_.text-muted-foreground]:text-white/50
            [&_[data-state=checked]]:bg-blue-600 [&_[data-state=checked]]:border-blue-600
          ">
            <ClienteForm 
              cliente={clienteEditando || undefined}
              onSubmit={handleSubmit} 
              isLoading={isCreating || isUpdating} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Excluir Cliente */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir o cliente <strong className="text-white">{clienteParaExcluir?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
