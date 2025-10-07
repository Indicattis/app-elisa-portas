import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AutorizadosKanban } from "@/components/AutorizadosKanban";
import { AutorizadosIndicadores } from "@/components/AutorizadosIndicadores";
import { AutorizadosFiltros, FiltrosAutorizados } from "@/components/AutorizadosFiltros";
import { InativacaoAutomaticaModal } from "@/components/InativacaoAutomaticaModal";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Loader2, RefreshCw, Download, Table as TableIcon, LayoutDashboard, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getEtapasByTipo, getCurrentEtapa } from "@/utils/parceiros";
import { StarRating } from "@/components/StarRating";
import { AddRatingDialog } from "@/components/AddRatingDialog";
import { useAutorizadosPerformance } from "@/hooks/useAutorizadosPerformance";
import { aplicarFiltros } from "@/utils/autorizadosFilters";

// Componente para contagem regressiva até inativação
interface CountdownToInactivationProps {
  autorizado: any;
}

function CountdownToInactivation({ autorizado }: CountdownToInactivationProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      if (!autorizado.ativo) {
        setTimeRemaining("Inativo");
        return;
      }

      const diasLimite = 90;
      
      let diasSemAvaliacao = 0;
      if (autorizado.data_inicio_contagem_inativacao) {
        const dataInicio = new Date(autorizado.data_inicio_contagem_inativacao);
        const agora = new Date();
        diasSemAvaliacao = Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        diasSemAvaliacao = autorizado.dias_sem_avaliacao || 0;
      }
      
      const diasRestantes = diasLimite - diasSemAvaliacao;

      if (diasRestantes <= 0) {
        setTimeRemaining("Pode ser inativado");
        return;
      }

      if (diasRestantes >= 30) {
        const meses = Math.floor(diasRestantes / 30);
        const diasExcedentes = diasRestantes % 30;
        if (diasExcedentes === 0) {
          setTimeRemaining(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
        } else {
          setTimeRemaining(`${meses}m ${diasExcedentes}d`);
        }
      } else if (diasRestantes >= 7) {
        const semanas = Math.floor(diasRestantes / 7);
        const diasExcedentes = diasRestantes % 7;
        if (diasExcedentes === 0) {
          setTimeRemaining(`${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`);
        } else {
          setTimeRemaining(`${semanas}s ${diasExcedentes}d`);
        }
      } else {
        setTimeRemaining(`${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [autorizado]);

  const getCountdownColor = () => {
    if (!autorizado.ativo) return "text-muted-foreground";
    
    const diasLimite = 90;
    
    let diasSemAvaliacao = 0;
    if (autorizado.data_inicio_contagem_inativacao) {
      const dataInicio = new Date(autorizado.data_inicio_contagem_inativacao);
      const agora = new Date();
      diasSemAvaliacao = Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      diasSemAvaliacao = autorizado.dias_sem_avaliacao || 0;
    }
    
    const diasRestantes = diasLimite - diasSemAvaliacao;

    if (diasRestantes <= 0) return "text-red-600 font-bold";
    if (diasRestantes <= 7) return "text-red-500 font-semibold";
    if (diasRestantes <= 30) return "text-orange-500 font-medium";
    return "text-green-600";
  };

  return (
    <div className={`text-sm ${getCountdownColor()}`}>
      {timeRemaining || "Calculando..."}
    </div>
  );
}

interface Vendedor {
  id: string;
  nome: string;
  foto_perfil_url?: string;
}

export default function Autorizados() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: autorizados = [], isLoading: loading } = useAutorizadosPerformance();
  const [filteredAutorizados, setFilteredAutorizados] = useState(autorizados);
  const [geocoding, setGeocoding] = useState<string | null>(null);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isInativacaoModalOpen, setIsInativacaoModalOpen] = useState(false);
  
  const [filtros, setFiltros] = useState<FiltrosAutorizados>({
    busca: '',
    etapa: 'todos',
    statusRisco: 'todos',
    atendente: 'todos',
    faixaAvaliacao: 'todos',
    tempoUltimaAvaliacao: 'todos'
  });

  useEffect(() => {
    fetchVendedores();
  }, []);

  useEffect(() => {
    const filtered = aplicarFiltros(autorizados.filter(a => a.tipo_parceiro === 'autorizado'), filtros);
    setFilteredAutorizados(filtered);
  }, [autorizados, filtros]);

  const autorizadosCriticos = autorizados
    .filter(a => a.ativo && a.status_risco === 'critico' && a.tipo_parceiro === 'autorizado')
    .map(a => ({
      nome: a.nome,
      diasSemAvaliacao: a.dias_sem_avaliacao,
      ultimaAvaliacao: a.ultima_avaliacao
    }));

  const fetchVendedores = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, foto_perfil_url')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setVendedores(data || []);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('autorizados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Autorizado excluído com sucesso.'
      });

      queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
    } catch (error) {
      console.error('Erro ao excluir autorizado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir autorizado.'
      });
    }
  };

  const handleGeocode = async (autorizado: any) => {
    if (!autorizado.cidade || !autorizado.estado) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Cidade e estado são obrigatórios para geocodificação.'
      });
      return;
    }

    try {
      setGeocoding(autorizado.id);
      
      const { data, error } = await supabase.functions.invoke('geocode-nominatim', {
        body: {
          id: autorizado.id,
          cidade: autorizado.cidade,
          estado: autorizado.estado
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: `Coordenadas obtidas: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
        });
      } else {
        throw new Error(data.error || 'Erro ao geocodificar endereço');
      }
    } catch (error: any) {
      console.error('Erro na geocodificação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na geocodificação',
        description: error.message || 'Não foi possível geocodificar o endereço.'
      });
    } finally {
      setGeocoding(null);
    }
  };

  const handleBatchGeocode = async () => {
    const autorizadosToGeocode = autorizados.filter(autorizado => 
      autorizado.ativo && 
      autorizado.tipo_parceiro === 'autorizado' &&
      autorizado.cidade && 
      autorizado.estado && 
      !autorizado.latitude && 
      !autorizado.longitude
    );

    if (autorizadosToGeocode.length === 0) {
      toast({
        title: 'Info',
        description: 'Nenhum autorizado encontrado para geocodificação.'
      });
      return;
    }

    setBatchGeocoding(true);
    let success = 0;
    let errors = 0;

    toast({
      title: 'Geocodificação em lote iniciada',
      description: `Processando ${autorizadosToGeocode.length} autorizados...`
    });

    for (const autorizado of autorizadosToGeocode) {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-nominatim', {
          body: {
            id: autorizado.id,
            cidade: autorizado.cidade,
            estado: autorizado.estado
          }
        });

        if (error) throw error;

        if (data.success) {
          success++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`Erro ao geocodificar ${autorizado.nome}:`, error);
        errors++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setBatchGeocoding(false);
    
    toast({
      title: 'Geocodificação em lote concluída',
      description: `${success} sucessos, ${errors} erros`
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Autorizados', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 30, { align: 'center' });
    
    const { etapas } = getEtapasByTipo('autorizado');
    
    const tableData = filteredAutorizados.map(autorizado => {
      const vendedor = vendedores.find(v => v.id === autorizado.vendedor_id);
      const etapaAtual = getCurrentEtapa(autorizado);
      return [
        autorizado.nome,
        vendedor?.nome || 'Sem vendedor',
        autorizado.responsavel || '-',
        autorizado.telefone || '-',
        autorizado.cidade || '-',
        autorizado.estado || '-',
        etapaAtual ? etapas[etapaAtual as keyof typeof etapas] || '-' : '-',
        autorizado.ativo ? 'Ativo' : 'Inativo'
      ];
    });
    
    const headers = [['Nome', 'Vendedor', 'Responsável', 'Telefone', 'Cidade', 'Estado', 'Etapa', 'Status']];
    
    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
        7: { cellWidth: 15 },
      },
    });
    
    doc.save(`Autorizados-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Autorizados</h1>
        <Button
          onClick={() => navigate('/dashboard/parceiros/novo/autorizado')}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Autorizado
        </Button>
      </div>

      <AutorizadosIndicadores tipoParceiro="autorizado" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Autorizados Cadastrados</CardTitle>
              <CardDescription>
                Total de {filteredAutorizados.length} autorizados cadastrados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Kanban
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <AutorizadosFiltros 
              filtros={filtros} 
              onFiltrosChange={setFiltros}
              atendentes={vendedores.map(v => ({ id: v.id, nome: v.nome }))} 
            />
            
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar autorizados..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="max-w-sm"
                />
                {isAdmin && autorizadosCriticos.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setIsInativacaoModalOpen(true)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Inativação Automática ({autorizadosCriticos.length})
                  </Button>
                )}
              </div>
            </div>
            <Button
              onClick={handleBatchGeocode}
              disabled={batchGeocoding}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              {batchGeocoding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Geocodificar todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Tempo até Inativação
                    </div>
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAutorizados.map((autorizado) => {
                  const vendedor = vendedores.find(v => v.id === autorizado.vendedor_id);
                  const { etapas } = getEtapasByTipo('autorizado');
                  const etapaAtual = getCurrentEtapa(autorizado);
                  
                  return (
                    <TableRow key={autorizado.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={autorizado.logo_url} alt={autorizado.nome} />
                          <AvatarFallback className="text-xs">
                            {getInitials(autorizado.nome)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{autorizado.nome}</div>
                          {autorizado.responsavel && (
                            <div className="text-sm text-muted-foreground">{autorizado.responsavel}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vendedor ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={vendedor.foto_perfil_url} alt={vendedor.nome} />
                              <AvatarFallback className="text-xs">
                                {getInitials(vendedor.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{vendedor.nome}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem vendedor</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {autorizado.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {autorizado.telefone}
                            </div>
                          )}
                          {autorizado.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {autorizado.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {autorizado.cidade && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {autorizado.cidade} - {autorizado.estado}
                            </div>
                          )}
                          {autorizado.endereco && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {autorizado.endereco}
                            </div>
                          )}
                          {autorizado.latitude && autorizado.longitude && (
                            <Badge variant="secondary" className="text-xs">
                              Geocodificado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {etapaAtual ? (
                          <Badge variant="outline">
                            {etapas[etapaAtual as keyof typeof etapas]}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem etapa</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {autorizado.average_rating !== undefined && autorizado.average_rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <StarRating rating={autorizado.average_rating} size={14} />
                              <span className="text-xs text-muted-foreground">
                                ({autorizado.total_ratings})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem avaliação</span>
                          )}
                          <AddRatingDialog 
                            autorizadoId={autorizado.id}
                            autorizadoNome={autorizado.nome}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={autorizado.ativo ? "default" : "secondary"}>
                            {autorizado.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CountdownToInactivation autorizado={autorizado} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/parceiros/${autorizado.id}/edit/autorizado`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!autorizado.latitude && !autorizado.longitude && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGeocode(autorizado)}
                              disabled={geocoding === autorizado.id}
                            >
                              {geocoding === autorizado.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o autorizado "{autorizado.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(autorizado.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <AutorizadosKanban 
              autorizados={filteredAutorizados.map(a => ({ ...a, tipo_parceiro: a.tipo_parceiro || 'autorizado' }))} 
              tipoParceiro="autorizado"
              onEtapaChange={(id, etapa) => {
                queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
              }} 
              onShowHistory={() => {}}
            />
          )}
        </CardContent>
      </Card>

      <InativacaoAutomaticaModal
        isOpen={isInativacaoModalOpen}
        onClose={() => setIsInativacaoModalOpen(false)}
        autorizadosCriticos={autorizadosCriticos}
      />
    </div>
  );
}
