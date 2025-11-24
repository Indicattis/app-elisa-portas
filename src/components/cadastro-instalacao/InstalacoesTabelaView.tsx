import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
  Check,
  CheckCircle2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InstalacaoCadastrada, CreateInstalacaoData } from '@/hooks/useInstalacoesCadastradas';
import { CadastroInstalacaoForm } from './CadastroInstalacaoForm';
import { AlterarParaCorrecaoDialog } from './AlterarParaCorrecaoDialog';
import { AlterarStatusDialog } from './AlterarStatusDialog';
import { DetalhesInstalacaoDialog } from './DetalhesInstalacaoDialog';
import { DataProducaoModal } from './DataProducaoModal';
import { ResponsavelInstalacaoModal } from './ResponsavelInstalacaoModal';
import { ConfirmarCarregamentoInstalacaoSheet } from './ConfirmarCarregamentoInstalacaoSheet';
import { ESTADOS_BRASIL } from '@/utils/estadosCidades';
import { baixarInstalacoesPDF } from '@/utils/instalacoesPDFGenerator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { isAtrasado } from '@/hooks/useInstalacoesFilters';

interface InstalacoesTabelaViewProps {
  instalacoes: InstalacaoCadastrada[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: CreateInstalacaoData) => Promise<boolean>;
  onUpdateStatus: (id: string, status: string) => void;
  onConcluirInstalacao: (id: string) => Promise<boolean>;
  onGeocode: (id: string, cidade: string, estado: string) => Promise<boolean>;
  isAdmin: boolean;
}

type SortField = 'nome_cliente' | 'cidade' | 'data_instalacao' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const InstalacoesTabelaView = ({
  instalacoes,
  onDelete,
  onUpdate,
  onUpdateStatus,
  onConcluirInstalacao,
  onGeocode,
  isAdmin,
}: InstalacoesTabelaViewProps) => {
  const navigate = useNavigate();
  const [detalhesInstalacao, setDetalhesInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [dataProducaoInstalacao, setDataProducaoInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [responsavelInstalacao, setResponsavelInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAlterarStatusDialog, setShowAlterarStatusDialog] = useState(false);
  const [instalacaoParaAlterarStatus, setInstalacaoParaAlterarStatus] = useState<InstalacaoCadastrada | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };


  const [confirmingInstalacaoId, setConfirmingInstalacaoId] = useState<string | null>(null);
  const [showCarregamentoSheet, setShowCarregamentoSheet] = useState(false);
  const [instalacaoCarregamento, setInstalacaoCarregamento] = useState<InstalacaoCadastrada | null>(null);

  const handleConcluirInstalacao = async () => {
    if (!confirmingInstalacaoId) return;
    
    await onConcluirInstalacao(confirmingInstalacaoId);
    setConfirmingInstalacaoId(null);
  };

  const handleAlterarStatus = (instalacao: InstalacaoCadastrada) => {
    setInstalacaoParaAlterarStatus(instalacao);
    setShowAlterarStatusDialog(true);
  };

  const handleConfirmarAlterarStatus = async (novoStatus: string) => {
    if (!instalacaoParaAlterarStatus) return;

    try {
      const { error } = await supabase
        .from('instalacoes')
        .update({ status: novoStatus })
        .eq('id', instalacaoParaAlterarStatus.id);

      if (error) throw error;

      toast.success('Status alterado com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleGeocode = async (instalacao: InstalacaoCadastrada) => {
    const cidade = instalacao.venda?.cidade || '';
    const estado = instalacao.venda?.estado || '';
    if (cidade && estado) {
      await onGeocode(instalacao.id, cidade, estado);
    } else {
      toast.error('Dados de localização não disponíveis');
    }
  };

  const getGeocodeStatus = (instalacao: InstalacaoCadastrada) => {
    if (instalacao.latitude && instalacao.longitude) {
      return { label: 'Geocodificado', variant: 'success' as const };
    }
    return { label: 'Não Geocodificado', variant: 'warning' as const };
  };

  const sortedInstalacoes = useMemo(() => {
    const result = [...instalacoes];

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
  }, [instalacoes, sortField, sortOrder]);

  const paginatedInstalacoes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInstalacoes.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInstalacoes, currentPage]);

  const totalPages = Math.ceil(sortedInstalacoes.length / itemsPerPage);

  const handleDownloadPDF = () => {
    try {
      baixarInstalacoesPDF({ instalacoes: sortedInstalacoes as any });
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleSaveDataProducao = async (instalacaoId: string, dataProducao: string) => {
    try {
      // Data de produção não existe mais na tabela instalacoes
      toast.info('Data de produção é gerenciada pelo pedido');
      
      // Recarregar lista
      const updatedInstalacao = instalacoes.find(i => i.id === instalacaoId);
      if (updatedInstalacao) {
        await onUpdate(instalacaoId, {
          nome_cliente: updatedInstalacao.nome_cliente,
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
        .from('instalacoes')
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
          {/* Tabela */}
          {sortedInstalacoes.length === 0 ? (
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
                        <p className="text-[10px] text-muted-foreground truncate">{instalacao.venda?.cliente_telefone || '-'}</p>
                      </div>

                      {/* Localização */}
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Localização</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] truncate">
                            {instalacao.venda?.cidade || 'N/A'}, {instalacao.venda?.estado || 'N/A'}
                          </p>
                          {instalacao.latitude && instalacao.longitude ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/mapa-autorizados?instalacao=${instalacao.id}`);
                              }}
                              title="Ver no Mapa"
                              className="h-5 w-5 p-0 text-blue-500"
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGeocode(instalacao);
                              }}
                              title="Geocodificar endereço"
                              className="h-6 px-2 text-[9px] text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              Geocodificar
                            </Button>
                          )}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-[8px] w-fit mt-1 ${
                            getGeocodeStatus(instalacao).variant === 'success' 
                              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                              : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                          }`}
                        >
                          {getGeocodeStatus(instalacao).label}
                        </Badge>
                      </div>

                      {/* Status */}
                      <div className="flex flex-wrap gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] ${getStatusVariant(instalacao.status)}`}
                          title="Status sincronizado com o pedido"
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

                      {/* Data Agendada */}
                      <div>
                        <p className="text-[10px] text-muted-foreground">Data Agendada</p>
                        {instalacao.data_instalacao ? (
                          <p className="text-xs font-medium">
                            {format(new Date(instalacao.data_instalacao), 'dd/MM/yyyy - EEEE', { locale: ptBR })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Não agendada</p>
                        )}
                      </div>

                      {/* Instalação Concluída */}
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Instalação Concluída</p>
                        {instalacao.instalacao_concluida ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 w-fit text-[9px]">
                              <Check className="h-3 w-3 mr-1" />
                              Concluída
                            </Badge>
                            {instalacao.instalacao_concluida_em && (
                              <span className="text-[9px] text-muted-foreground">
                                {format(new Date(instalacao.instalacao_concluida_em), "dd/MM/yyyy")}
                              </span>
                            )}
                          </div>
                        ) : instalacao.status === 'pronta_fabrica' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlterarStatus(instalacao);
                            }}
                            className="h-7 px-2 text-[10px] w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Finalizar
                          </Button>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </div>
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
                          Data Agendada
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-xs">Instalação Concluída</TableHead>
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
                            <p className="text-[10px] text-muted-foreground">{instalacao.venda?.cliente_telefone || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${getStatusVariant(instalacao.status)}`}
                            title="Status sincronizado com o pedido"
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] truncate max-w-[150px]">
                                {instalacao.venda?.cidade || 'N/A'}, {instalacao.venda?.estado || 'N/A'}
                              </span>
                              {instalacao.latitude && instalacao.longitude ? (
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
                                  <MapPin className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGeocode(instalacao);
                                  }}
                                  title="Geocodificar endereço"
                                  className="h-6 px-2 text-[9px] text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Geocodificar
                                </Button>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-[8px] w-fit ${
                                getGeocodeStatus(instalacao).variant === 'success' 
                                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                                  : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                              }`}
                            >
                              {getGeocodeStatus(instalacao).label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="space-y-0.5">
                            {instalacao.data_instalacao ? (
                              <>
                                <p className="text-xs font-medium">
                                  {format(new Date(instalacao.data_instalacao), 'dd/MM/yyyy')}
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  {format(new Date(instalacao.data_instalacao), 'EEEE', { locale: ptBR })}
                                </p>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Não agendada</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {instalacao.instalacao_concluida ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 w-fit">
                                <Check className="h-3 w-3 mr-1" />
                                Concluída
                              </Badge>
                              {instalacao.instalacao_concluida_em && (
                                <span className="text-[9px] text-muted-foreground">
                                  {format(new Date(instalacao.instalacao_concluida_em), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                          ) : instalacao.status === 'pronta_fabrica' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlterarStatus(instalacao);
                              }}
                              className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Finalizar
                            </Button>
                          ) : (
                            <span className="text-[9px] text-muted-foreground">
                              N/A
                            </span>
                          )}
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
                    {Math.min(currentPage * itemsPerPage, sortedInstalacoes.length)} de{' '}
                    {sortedInstalacoes.length}
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

      <DetalhesInstalacaoDialog
        open={!!detalhesInstalacao}
        onOpenChange={(open) => !open && setDetalhesInstalacao(null)}
        instalacao={detalhesInstalacao}
      />

      <DataProducaoModal
        open={!!dataProducaoInstalacao}
        onOpenChange={(open) => !open && setDataProducaoInstalacao(null)}
        instalacaoId={dataProducaoInstalacao?.id || ''}
        dataAtual={dataProducaoInstalacao?.data_instalacao || undefined}
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

      <AlertDialog open={!!confirmingInstalacaoId} onOpenChange={(open) => !open && setConfirmingInstalacaoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Conclusão da Instalação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar esta instalação como concluída? O botão "Finalizar" do pedido será habilitado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConcluirInstalacao}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {instalacaoParaAlterarStatus && (
        <AlterarStatusDialog
          open={showAlterarStatusDialog}
          onOpenChange={setShowAlterarStatusDialog}
          onConfirm={handleConfirmarAlterarStatus}
          currentStatus={instalacaoParaAlterarStatus.status}
          instalacaoNome={instalacaoParaAlterarStatus.nome_cliente}
        />
      )}

      <ConfirmarCarregamentoInstalacaoSheet
        instalacao={instalacaoCarregamento}
        open={showCarregamentoSheet}
        onOpenChange={setShowCarregamentoSheet}
        onSuccess={() => {
          setShowCarregamentoSheet(false);
          window.location.reload();
        }}
      />
    </div>
  );
};
