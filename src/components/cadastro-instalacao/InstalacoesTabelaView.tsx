import { useState, useMemo } from 'react';
import { format, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
  Trash2,
  Pencil,
  Download,
  Search,
  X,
  ArrowUpDown,
  AlertCircle,
  Plus,
  Clock,
  UserX,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstalacaoCadastrada, CreateInstalacaoData } from '@/hooks/useInstalacoesCadastradas';
import { CadastroInstalacaoForm } from './CadastroInstalacaoForm';
import { AlterarParaCorrecaoDialog } from './AlterarParaCorrecaoDialog';
import { AlterarStatusDialog } from './AlterarStatusDialog';
import { DetalhesInstalacaoDialog } from './DetalhesInstalacaoDialog';
import { DataProducaoModal } from './DataProducaoModal';
import { ResponsavelInstalacaoModal } from './ResponsavelInstalacaoModal';
import { ESTADOS_BRASIL } from '@/utils/estadosCidades';
import { baixarInstalacoesPDF } from '@/utils/instalacoesPDFGenerator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface InstalacoesTabelaViewProps {
  instalacoes: InstalacaoCadastrada[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: CreateInstalacaoData) => Promise<boolean>;
  onAlterarParaCorrecao: (id: string, justificativa: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isAdmin: boolean;
}

type SortField = 'nome_cliente' | 'cidade' | 'data_instalacao' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const InstalacoesTabelaView = ({
  instalacoes,
  onDelete,
  onUpdate,
  onAlterarParaCorrecao,
  onUpdateStatus,
  isAdmin,
}: InstalacoesTabelaViewProps) => {
  const navigate = useNavigate();
  const [editingInstalacao, setEditingInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [correcaoInstalacao, setCorrecaoInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [statusInstalacao, setStatusInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [detalhesInstalacao, setDetalhesInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [dataProducaoInstalacao, setDataProducaoInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [responsavelInstalacao, setResponsavelInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const isAtrasado = (instalacao: InstalacaoCadastrada) => {
    if (!instalacao.data_instalacao || instalacao.status === 'finalizada') return false;
    return isPast(startOfDay(new Date(instalacao.data_instalacao))) && startOfDay(new Date(instalacao.data_instalacao)) < startOfDay(new Date());
  };

  const filteredAndSortedInstalacoes = useMemo(() => {
    let result = [...instalacoes];

    // Filtrar por busca (nome ou telefone)
    if (searchTerm) {
      result = result.filter(
        (inst) =>
          inst.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.telefone_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros rápidos
    if (quickFilter === 'sem_responsavel') {
      result = result.filter((inst) => !inst.responsavel_instalacao_id);
    } else if (quickFilter === 'atrasados') {
      result = result.filter((inst) => isAtrasado(inst));
    } else if (quickFilter === 'pendente_producao') {
      result = result.filter((inst) => inst.status === 'pendente_producao');
    } else if (quickFilter === 'pronta_fabrica') {
      result = result.filter((inst) => inst.status === 'pronta_fabrica');
    }

    // Filtrar por status
    if (filterStatus !== 'all') {
      result = result.filter((inst) => inst.status === filterStatus);
    }

    // Filtrar por categoria
    if (filterCategoria !== 'all') {
      result = result.filter((inst) => inst.categoria === filterCategoria);
    }

    // Filtrar por estado
    if (filterEstado !== 'all') {
      result = result.filter((inst) => inst.estado === filterEstado);
    }

    // Ordenar
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'data_instalacao' || sortField === 'created_at') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [instalacoes, searchTerm, quickFilter, filterStatus, filterCategoria, filterEstado, sortField, sortOrder]);

  const paginatedInstalacoes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedInstalacoes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedInstalacoes, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedInstalacoes.length / itemsPerPage);

  const handleEdit = (instalacao: InstalacaoCadastrada) => {
    setEditingInstalacao(instalacao);
  };

  const handleUpdate = async (data: CreateInstalacaoData) => {
    if (editingInstalacao) {
      await onUpdate(editingInstalacao.id, data);
      setEditingInstalacao(null);
    }
  };

  const handleDownloadPDF = () => {
    try {
      baixarInstalacoesPDF({ instalacoes: filteredAndSortedInstalacoes });
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleSaveDataProducao = async (instalacaoId: string, dataProducao: string) => {
    try {
      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .update({ data_producao: dataProducao })
        .eq('id', instalacaoId);

      if (error) throw error;

      toast.success('Data de produção atualizada com sucesso!');
      
      // Atualizar a lista de instalações
      const updatedInstalacao = instalacoes.find(i => i.id === instalacaoId);
      if (updatedInstalacao) {
        await onUpdate(instalacaoId, {
          nome_cliente: updatedInstalacao.nome_cliente,
          telefone_cliente: updatedInstalacao.telefone_cliente || '',
          estado: updatedInstalacao.estado,
          cidade: updatedInstalacao.cidade,
          tamanho: updatedInstalacao.tamanho || '',
          categoria: updatedInstalacao.categoria as 'instalacao' | 'entrega' | 'correcao' | 'carregamento_agendado',
          data_instalacao: updatedInstalacao.data_instalacao || '',
          status: updatedInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
          tipo_instalacao: updatedInstalacao.tipo_instalacao || undefined,
          responsavel_instalacao_id: updatedInstalacao.responsavel_instalacao_id || undefined,
          responsavel_instalacao_nome: updatedInstalacao.responsavel_instalacao_nome || undefined,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar data de produção:', error);
      toast.error('Erro ao atualizar data de produção');
      throw error;
    }
  };

  const handleSaveResponsavel = async (
    instalacaoId: string,
    tipoInstalacao: 'elisa' | 'autorizado',
    responsavelId: string,
    responsavelNome: string
  ) => {
    try {
      // Ajustar o tipo para o formato esperado pelo banco
      const tipoFormatado = tipoInstalacao === 'autorizado' ? 'autorizados' : 'elisa';
      
      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .update({
          tipo_instalacao: tipoFormatado,
          responsavel_instalacao_id: responsavelId,
          responsavel_instalacao_nome: responsavelNome,
        })
        .eq('id', instalacaoId);

      if (error) throw error;

      toast.success('Responsável atualizado com sucesso!');
      
      // Atualizar a lista de instalações
      const updatedInstalacao = instalacoes.find(i => i.id === instalacaoId);
      if (updatedInstalacao) {
        await onUpdate(instalacaoId, {
          nome_cliente: updatedInstalacao.nome_cliente,
          telefone_cliente: updatedInstalacao.telefone_cliente || '',
          estado: updatedInstalacao.estado,
          cidade: updatedInstalacao.cidade,
          tamanho: updatedInstalacao.tamanho || '',
          categoria: updatedInstalacao.categoria as 'instalacao' | 'entrega' | 'correcao' | 'carregamento_agendado',
          data_instalacao: updatedInstalacao.data_instalacao || '',
          status: updatedInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
          tipo_instalacao: tipoFormatado as 'elisa' | 'autorizados',
          responsavel_instalacao_id: responsavelId,
          responsavel_instalacao_nome: responsavelNome,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      toast.error('Erro ao atualizar responsável');
      throw error;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategoria('all');
    setFilterEstado('all');
    setQuickFilter('all');
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      instalacao: 'Instalação',
      entrega: 'Entrega',
      correcao: 'Correção',
      carregamento_agendado: 'Carregamento Agendado',
    };
    return labels[categoria] || categoria;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente_producao: 'Pendente Produção',
      pronta_fabrica: 'Pronta Fábrica',
      finalizada: 'Finalizada',
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, string> = {
      pendente_producao: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      pronta_fabrica: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      finalizada: 'bg-green-500/10 text-green-600 border-green-500/20',
    };
    return variants[status] || '';
  };

  const getCategoriaVariant = (categoria: string) => {
    const variants: Record<string, string> = {
      instalacao: 'bg-red-500/10 text-red-500 border-red-500/20',
      entrega: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      correcao: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      carregamento_agendado: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    return variants[categoria] || '';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Instalações Cadastradas</CardTitle>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Filtros Compactos */}
          <div className="h-[100px] overflow-hidden space-y-2">
            {/* Linha 1: Busca e Filtros Rápidos */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
              
              <div className="flex gap-1 shrink-0">
                <Button
                  variant={quickFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('all')}
                  className="h-8 px-2 text-[10px]"
                >
                  Todos
                </Button>
                <Button
                  variant={quickFilter === 'sem_responsavel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('sem_responsavel')}
                  className="h-8 px-2 text-[10px]"
                  title="Sem Responsável"
                >
                  <UserX className="h-3 w-3" />
                </Button>
                <Button
                  variant={quickFilter === 'atrasados' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('atrasados')}
                  className="h-8 px-2 text-[10px]"
                  title="Atrasados"
                >
                  <Clock className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Linha 2: Selects em Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-[10px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente_producao">Pendente</SelectItem>
                  <SelectItem value="pronta_fabrica">Pronta</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="h-8 text-[10px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="correcao">Correção</SelectItem>
                  <SelectItem value="carregamento_agendado">Carregamento</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="h-8 text-[10px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ESTADOS_BRASIL.map((estado) => (
                    <SelectItem key={estado.sigla} value={estado.sigla}>
                      {estado.sigla}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || filterStatus !== 'all' || filterCategoria !== 'all' || filterEstado !== 'all' || quickFilter !== 'all') && (
                <Button 
                  onClick={clearFilters} 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[10px] gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Linha 3: Filtros Rápidos Adicionais (Mobile) */}
            <div className="flex gap-1">
              <Button
                variant={quickFilter === 'pendente_producao' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('pendente_producao')}
                className="h-7 px-2 text-[10px] flex-1"
              >
                Pendente
              </Button>
              <Button
                variant={quickFilter === 'pronta_fabrica' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('pronta_fabrica')}
                className="h-7 px-2 text-[10px] flex-1"
              >
                Pronta
              </Button>
            </div>
          </div>

          {/* Tabela */}
          {filteredAndSortedInstalacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma instalação encontrada</p>
            </div>
          ) : (
            <>
              {/* Mobile First - Card View */}
              <div className="block lg:hidden space-y-2">
                {paginatedInstalacoes.map((instalacao) => (
                  <div
                    key={instalacao.id}
                    onClick={() => setDetalhesInstalacao(instalacao)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      instalacao.status === 'finalizada'
                        ? 'bg-green-500/5 hover:bg-green-500/10'
                        : isAtrasado(instalacao)
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {/* Coluna 1: Cliente */}
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Cliente</p>
                        <p className="text-xs font-semibold truncate">{instalacao.nome_cliente}</p>
                        <p className="text-[10px] text-muted-foreground">{instalacao.telefone_cliente || '-'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {instalacao.cidade}, {instalacao.estado}
                        </p>
                      </div>

                      {/* Coluna 2: Status e Data */}
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Status</p>
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] w-fit ${getStatusVariant(instalacao.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusInstalacao(instalacao);
                          }}
                        >
                          {getStatusLabel(instalacao.status)}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] w-fit ${getCategoriaVariant(instalacao.categoria)}`}>
                          {getCategoriaLabel(instalacao.categoria)}
                        </Badge>
                        {instalacao.data_instalacao && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(instalacao.data_instalacao), 'dd/MM/yyyy')}
                          </p>
                        )}
                        {isAtrasado(instalacao) && (
                          <div className="flex items-center gap-1 text-destructive mt-1">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-[9px]">Atrasado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop - Table View */}
              <div className="hidden lg:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('nome_cliente')}
                          className="gap-1 h-7 text-xs"
                        >
                          Cliente
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('cidade')}
                          className="gap-1 h-7 text-xs"
                        >
                          Localização
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('data_instalacao')}
                          className="gap-1 h-7 text-xs"
                        >
                          Data
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInstalacoes.map((instalacao) => (
                      <TableRow 
                        key={instalacao.id}
                        onDoubleClick={() => setDetalhesInstalacao(instalacao)}
                        className={`cursor-pointer ${
                          instalacao.status === 'finalizada'
                            ? 'bg-green-500/5 hover:bg-green-500/10'
                            : isAtrasado(instalacao)
                            ? 'bg-red-500/5 hover:bg-red-500/10'
                            : ''
                        }`}
                      >
                        <TableCell className="py-2">
                          <div className="space-y-0.5">
                            <p className="font-medium text-xs truncate max-w-[200px]">{instalacao.nome_cliente}</p>
                            <p className="text-[10px] text-muted-foreground">{instalacao.telefone_cliente || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] cursor-pointer hover:opacity-80 ${getStatusVariant(instalacao.status)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusInstalacao(instalacao);
                            }}
                            title="Clique para alterar status"
                          >
                            {getStatusLabel(instalacao.status)}
                          </Badge>
                          {isAtrasado(instalacao) && (
                            <div className="flex items-center gap-1 text-destructive mt-1">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-[9px]">Atrasado</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className={`text-[10px] ${getCategoriaVariant(instalacao.categoria)}`}>
                            {getCategoriaLabel(instalacao.categoria)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] truncate max-w-[150px]">
                              {instalacao.cidade}, {instalacao.estado}
                            </span>
                            {instalacao.latitude && instalacao.longitude && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/mapa-autorizados?instalacao=${instalacao.id}`);
                                }}
                                title="Ver no Mapa"
                                className="h-5 w-5 p-0 text-blue-500 hover:text-blue-600"
                              >
                                <Map className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] py-2">
                          {instalacao.data_instalacao
                            ? format(new Date(instalacao.data_instalacao), 'dd/MM/yy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(instalacao);
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Tem certeza que deseja excluir esta instalação?')) {
                                    onDelete(instalacao.id);
                                  }
                                }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedInstalacoes.length)} de{' '}
                    {filteredAndSortedInstalacoes.length} instalações
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingInstalacao} onOpenChange={() => setEditingInstalacao(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Instalação</DialogTitle>
          </DialogHeader>
          {editingInstalacao && (
            <CadastroInstalacaoForm
              onSubmit={handleUpdate}
              initialData={{
                nome_cliente: editingInstalacao.nome_cliente,
                telefone_cliente: editingInstalacao.telefone_cliente || '',
                estado: editingInstalacao.estado,
                cidade: editingInstalacao.cidade,
                tamanho: editingInstalacao.tamanho || '',
                categoria: editingInstalacao.categoria as 'instalacao' | 'entrega' | 'correcao' | 'carregamento_agendado',
                data_instalacao: editingInstalacao.data_instalacao || '',
                data_producao: editingInstalacao.data_producao || '',
                status: editingInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
                tipo_instalacao: editingInstalacao.tipo_instalacao || undefined,
                responsavel_instalacao_id: editingInstalacao.responsavel_instalacao_id || undefined,
                responsavel_instalacao_nome: editingInstalacao.responsavel_instalacao_nome || undefined,
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlterarParaCorrecaoDialog
        open={!!correcaoInstalacao}
        onOpenChange={(open) => !open && setCorrecaoInstalacao(null)}
        onConfirm={(justificativa) => {
          if (correcaoInstalacao) {
            onAlterarParaCorrecao(correcaoInstalacao.id, justificativa);
          }
        }}
        instalacaoNome={correcaoInstalacao?.nome_cliente || ''}
      />

      <AlterarStatusDialog
        open={!!statusInstalacao}
        onOpenChange={(open) => !open && setStatusInstalacao(null)}
        onConfirm={(status) => {
          if (statusInstalacao) {
            onUpdateStatus(statusInstalacao.id, status);
          }
        }}
        currentStatus={statusInstalacao?.status || 'pendente_producao'}
        instalacaoNome={statusInstalacao?.nome_cliente || ''}
      />

      <DetalhesInstalacaoDialog
        open={!!detalhesInstalacao}
        onOpenChange={(open) => !open && setDetalhesInstalacao(null)}
        instalacao={detalhesInstalacao}
      />

      <DataProducaoModal
        open={!!dataProducaoInstalacao}
        onOpenChange={(open) => !open && setDataProducaoInstalacao(null)}
        instalacaoId={dataProducaoInstalacao?.id || ''}
        dataAtual={dataProducaoInstalacao?.data_producao}
        onSave={handleSaveDataProducao}
      />

      <ResponsavelInstalacaoModal
        open={!!responsavelInstalacao}
        onOpenChange={(open) => !open && setResponsavelInstalacao(null)}
        instalacaoId={responsavelInstalacao?.id || ''}
        tipoAtual={responsavelInstalacao?.tipo_instalacao}
        responsavelIdAtual={responsavelInstalacao?.responsavel_instalacao_id}
        responsavelNomeAtual={responsavelInstalacao?.responsavel_instalacao_nome}
        onSave={handleSaveResponsavel}
      />
    </div>
  );
};
