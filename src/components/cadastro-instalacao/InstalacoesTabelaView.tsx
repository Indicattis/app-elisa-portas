import { useState, useMemo } from 'react';
import { format, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  onUpdateStatus: (id: string, status: string) => void;
  isAdmin: boolean;
}

type SortField = 'nome_cliente' | 'cidade' | 'data_instalacao' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const InstalacoesTabelaView = ({
  instalacoes,
  onDelete,
  onUpdate,
  onUpdateStatus,
  isAdmin,
}: InstalacoesTabelaViewProps) => {
  const navigate = useNavigate();
  const [statusInstalacao, setStatusInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [detalhesInstalacao, setDetalhesInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [dataProducaoInstalacao, setDataProducaoInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [responsavelInstalacao, setResponsavelInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
  }, [instalacoes, searchTerm, quickFilter, filterStatus, filterEstado, sortField, sortOrder]);

  const paginatedInstalacoes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedInstalacoes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedInstalacoes, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedInstalacoes.length / itemsPerPage);

  const handleDownloadPDF = () => {
    try {
      baixarInstalacoesPDF({ instalacoes: filteredAndSortedInstalacoes as any });
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
    <div className="w-full max-w-full overflow-hidden space-y-4">
      <Card className="w-full max-w-full">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-2xl truncate">Instalações Cadastradas</CardTitle>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-1 h-8 shrink-0">
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 w-full max-w-full overflow-hidden">
          {/* Filtros Compactos */}
          <div className="h-[100px] overflow-hidden space-y-2 w-full max-w-full">
            {/* Linha 1: Busca e Filtros Rápidos */}
            <div className="flex items-center gap-1 w-full min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-[9px] w-full"
                />
              </div>
              
              <div className="flex gap-1 shrink-0">
                <Button
                  variant={quickFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('all')}
                  className="h-8 px-1.5 text-[9px] min-w-0"
                >
                  Todos
                </Button>
                <Button
                  variant={quickFilter === 'sem_responsavel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('sem_responsavel')}
                  className="h-8 px-1.5 text-[9px] min-w-0"
                  title="Sem Responsável"
                >
                  <UserX className="h-3 w-3" />
                </Button>
                <Button
                  variant={quickFilter === 'atrasados' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('atrasados')}
                  className="h-8 px-1.5 text-[9px] min-w-0"
                  title="Atrasados"
                >
                  <Clock className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Linha 2: Selects em Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full min-w-0">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-[9px] min-w-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente_producao">Pendente</SelectItem>
                  <SelectItem value="pronta_fabrica">Pronta</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="h-8 text-[9px] min-w-0">
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

              {(searchTerm || filterStatus !== 'all' || filterEstado !== 'all' || quickFilter !== 'all') && (
                <Button 
                  onClick={clearFilters} 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[9px] gap-1 min-w-0 px-1.5"
                >
                  <X className="h-3 w-3" />
                  <span className="hidden sm:inline">Limpar</span>
                </Button>
              )}
            </div>

            {/* Linha 3: Filtros Rápidos Adicionais (Mobile) */}
            <div className="flex gap-1 w-full min-w-0">
              <Button
                variant={quickFilter === 'pendente_producao' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('pendente_producao')}
                className="h-7 px-1.5 text-[9px] flex-1 min-w-0"
              >
                Pendente
              </Button>
              <Button
                variant={quickFilter === 'pronta_fabrica' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('pronta_fabrica')}
                className="h-7 px-1.5 text-[9px] flex-1 min-w-0"
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
              {/* Mobile First - Card View (Single Column) */}
              <div className="block lg:hidden space-y-2 mt-4">
                {paginatedInstalacoes.map((instalacao) => (
                  <div
                    key={instalacao.id}
                    onClick={() => setDetalhesInstalacao(instalacao)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors w-full max-w-full ${
                      instalacao.status === 'finalizada'
                        ? 'bg-green-500/5 hover:bg-green-500/10'
                        : isAtrasado(instalacao)
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Cliente */}
                      <div>
                        <p className="text-[10px] text-muted-foreground">Cliente</p>
                        <p className="text-xs font-semibold truncate">{instalacao.nome_cliente}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{instalacao.telefone_cliente || '-'}</p>
                      </div>

                      {/* Localização */}
                      <div>
                        <p className="text-[10px] text-muted-foreground">Localização</p>
                        <p className="text-[10px] truncate">
                          {instalacao.cidade}, {instalacao.estado}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex flex-wrap gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] ${getStatusVariant(instalacao.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusInstalacao(instalacao);
                          }}
                        >
                          {getStatusLabel(instalacao.status)}
                        </Badge>
                        {isAtrasado(instalacao) && (
                          <Badge variant="destructive" className="text-[9px] gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Atrasado
                          </Badge>
                        )}
                      </div>

                      {/* Data */}
                      {instalacao.data_instalacao && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Data: {format(new Date(instalacao.data_instalacao), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop - Table View */}
              <div className="hidden lg:block rounded-md border mt-4">
                <ScrollArea className="w-full">
                  <Table className="w-full table-fixed">
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
                          <div className="flex gap-1 justify-end">
                            {instalacao.pedido_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/pedido/${instalacao.pedido_id}/edit`);
                                }}
                                className="h-7 px-2 text-xs"
                                title="Ver Pedido"
                              >
                                Pedido
                              </Button>
                            )}
                            {instalacao.venda_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/vendas/${instalacao.venda_id}/view`);
                                }}
                                className="h-7 px-2 text-xs"
                                title="Ver Venda"
                              >
                                Venda
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </ScrollArea>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 w-full">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedInstalacoes.length)} de{' '}
                    {filteredAndSortedInstalacoes.length}
                  </p>
                  <div className="flex gap-1 sm:gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 text-[10px] px-2"
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] sm:max-w-none">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 text-[10px] shrink-0"
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
                      className="h-8 text-[10px] px-2"
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
