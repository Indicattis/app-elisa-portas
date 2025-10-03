import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
  RefreshCw,
  Eye,
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
import { ESTADOS_BRASIL } from '@/utils/estadosCidades';
import { baixarInstalacoesPDF } from '@/utils/instalacoesPDFGenerator';
import { toast } from 'sonner';

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
  const [editingInstalacao, setEditingInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [correcaoInstalacao, setCorrecaoInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [statusInstalacao, setStatusInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [detalhesInstalacao, setDetalhesInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
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
  }, [instalacoes, searchTerm, filterStatus, filterCategoria, filterEstado, sortField, sortOrder]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategoria('all');
    setFilterEstado('all');
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      instalacao: 'Instalação',
      entrega: 'Entrega',
      correcao: 'Correção',
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
        <CardContent>
          {/* Filtros */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente_producao">Pendente Produção</SelectItem>
                  <SelectItem value="pronta_fabrica">Pronta Fábrica</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="correcao">Correção</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {ESTADOS_BRASIL.map((estado) => (
                    <SelectItem key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || filterStatus !== 'all' || filterCategoria !== 'all' || filterEstado !== 'all') && (
              <Button onClick={clearFilters} variant="ghost" size="sm" className="gap-2">
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Tabela */}
          {filteredAndSortedInstalacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma instalação encontrada</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('nome_cliente')}
                          className="gap-1"
                        >
                          Cliente
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('cidade')}
                          className="gap-1"
                        >
                          Localização
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('data_instalacao')}
                          className="gap-1"
                        >
                          Data Instalação
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Data Produção</TableHead>
                      <TableHead>Geocodificação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInstalacoes.map((instalacao) => (
                      <TableRow key={instalacao.id}>
                        <TableCell className="font-medium">{instalacao.nome_cliente}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {instalacao.telefone_cliente || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {instalacao.cidade}, {instalacao.estado}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getCategoriaVariant(instalacao.categoria)}>
                            {getCategoriaLabel(instalacao.categoria)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusVariant(instalacao.status)}>
                            {getStatusLabel(instalacao.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{instalacao.tamanho || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {instalacao.data_instalacao
                            ? format(new Date(instalacao.data_instalacao), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {instalacao.responsavel_instalacao_nome || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {instalacao.saldo 
                            ? new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(instalacao.saldo)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {instalacao.data_producao
                            ? format(new Date(instalacao.data_producao), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {instalacao.latitude && instalacao.longitude ? (
                            <Badge variant="default" className="bg-green-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              Geocodificado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Processando
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetalhesInstalacao(instalacao)}
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStatusInstalacao(instalacao)}
                              title="Alterar Status"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            {instalacao.categoria !== 'correcao' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCorrecaoInstalacao(instalacao)}
                                title="Alterar para Correção"
                                className="text-orange-500 hover:text-orange-600"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(instalacao)}
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(instalacao.id)}
                                  className="text-destructive hover:text-destructive"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
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
                categoria: editingInstalacao.categoria as 'instalacao' | 'entrega' | 'correcao',
                data_instalacao: editingInstalacao.data_instalacao || '',
                data_producao: editingInstalacao.data_producao || '',
                status: editingInstalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
                tipo_instalacao: editingInstalacao.tipo_instalacao || undefined,
                responsavel_instalacao_id: editingInstalacao.responsavel_instalacao_id || undefined,
                responsavel_instalacao_nome: editingInstalacao.responsavel_instalacao_nome || undefined,
                saldo: editingInstalacao.saldo || 0,
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
    </div>
  );
};
