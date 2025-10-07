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

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Loader2, RefreshCw, Download, Table as TableIcon, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getEtapasByTipo, getCurrentEtapa } from "@/utils/parceiros";
import { StarRating } from "@/components/StarRating";
import { AddRatingDialog } from "@/components/AddRatingDialog";
import { useAutorizadosPerformance } from "@/hooks/useAutorizadosPerformance";
import { aplicarFiltros } from "@/utils/autorizadosFilters";

interface Vendedor {
  id: string;
  nome: string;
  foto_perfil_url?: string;
}

export default function Representantes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: autorizados = [], isLoading: loading } = useAutorizadosPerformance();
  const [filteredRepresentantes, setFilteredRepresentantes] = useState(autorizados);
  const [geocoding, setGeocoding] = useState<string | null>(null);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
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
    const filtered = aplicarFiltros(autorizados.filter(a => a.tipo_parceiro === 'representante'), filtros);
    setFilteredRepresentantes(filtered);
  }, [autorizados, filtros]);

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
        description: 'Representante excluído com sucesso.'
      });

      queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
    } catch (error) {
      console.error('Erro ao excluir representante:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir representante.'
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
    const representantesToGeocode = autorizados.filter(autorizado => 
      autorizado.ativo && 
      autorizado.tipo_parceiro === 'representante' &&
      autorizado.cidade && 
      autorizado.estado && 
      !autorizado.latitude && 
      !autorizado.longitude
    );

    if (representantesToGeocode.length === 0) {
      toast({
        title: 'Info',
        description: 'Nenhum representante encontrado para geocodificação.'
      });
      return;
    }

    setBatchGeocoding(true);
    let success = 0;
    let errors = 0;

    toast({
      title: 'Geocodificação em lote iniciada',
      description: `Processando ${representantesToGeocode.length} representantes...`
    });

    for (const autorizado of representantesToGeocode) {
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
    doc.text('Relatório de Representantes', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 30, { align: 'center' });
    
    const { etapas } = getEtapasByTipo('representante');
    
    const tableData = filteredRepresentantes.map(representante => {
      const vendedor = vendedores.find(v => v.id === representante.vendedor_id);
      const etapaAtual = getCurrentEtapa(representante);
      return [
        representante.nome,
        vendedor?.nome || 'Sem vendedor',
        representante.responsavel || '-',
        representante.telefone || '-',
        representante.cidade || '-',
        representante.estado || '-',
        etapaAtual ? etapas[etapaAtual as keyof typeof etapas] || '-' : '-',
        representante.ativo ? 'Ativo' : 'Inativo'
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
    
    doc.save(`Representantes-${new Date().toISOString().split('T')[0]}.pdf`);
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
        <h1 className="text-3xl font-bold">Representantes</h1>
        <Button
          onClick={() => navigate('/dashboard/parceiros/novo/representante')}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Representante
        </Button>
      </div>

      <AutorizadosIndicadores tipoParceiro="representante" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Representantes Cadastrados</CardTitle>
              <CardDescription>
                Total de {filteredRepresentantes.length} representantes cadastrados
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
              <Input
                placeholder="Buscar representantes..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="max-w-sm"
              />
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
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRepresentantes.map((representante) => {
                  const vendedor = vendedores.find(v => v.id === representante.vendedor_id);
                  const { etapas } = getEtapasByTipo('representante');
                  const etapaAtual = getCurrentEtapa(representante);
                  
                  return (
                    <TableRow key={representante.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={representante.logo_url} alt={representante.nome} />
                          <AvatarFallback className="text-xs">
                            {getInitials(representante.nome)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{representante.nome}</div>
                          {representante.responsavel && (
                            <div className="text-sm text-muted-foreground">{representante.responsavel}</div>
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
                          {representante.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {representante.telefone}
                            </div>
                          )}
                          {representante.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {representante.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {representante.cidade && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {representante.cidade} - {representante.estado}
                            </div>
                          )}
                          {representante.endereco && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {representante.endereco}
                            </div>
                          )}
                          {representante.latitude && representante.longitude && (
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
                          {representante.average_rating !== undefined && representante.average_rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <StarRating rating={representante.average_rating} size={14} />
                              <span className="text-xs text-muted-foreground">
                                ({representante.total_ratings})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem avaliação</span>
                          )}
                          <AddRatingDialog 
                            autorizadoId={representante.id}
                            autorizadoNome={representante.nome}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={representante.ativo ? "default" : "secondary"}>
                          {representante.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/parceiros/${representante.id}/edit/representante`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!representante.latitude && !representante.longitude && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGeocode(representante)}
                              disabled={geocoding === representante.id}
                            >
                              {geocoding === representante.id ? (
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
                                  Tem certeza que deseja excluir o representante "{representante.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(representante.id)}
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
              autorizados={filteredRepresentantes.map(a => ({ ...a, tipo_parceiro: a.tipo_parceiro || 'representante' }))} 
              tipoParceiro="representante"
              onEtapaChange={() => {
                queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
              }} 
              onShowHistory={() => {}}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
