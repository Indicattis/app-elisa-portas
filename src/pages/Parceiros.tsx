import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AutorizadosKanban } from "@/components/AutorizadosKanban";
import { AutorizadosIndicadores } from "@/components/AutorizadosIndicadores";
import { AutorizadosFiltros, FiltrosAutorizados } from "@/components/AutorizadosFiltros";
import { InativacaoAutomaticaModal } from "@/components/InativacaoAutomaticaModal";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, User, Camera, Loader2, RefreshCw, Download, Table as TableIcon, LayoutDashboard, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  TipoParceiro, 
  TIPO_PARCEIRO_LABELS, 
  getEtapasByTipo, 
  getCurrentEtapa,
  RATING_CATEGORIES 
} from "@/utils/parceiros";
import { StarRating } from "@/components/StarRating";
import { AddRatingDialog } from "@/components/AddRatingDialog";
import { AutorizadoHistoryModal } from "@/components/AutorizadoHistoryModal";
import { useAutorizadosPerformance } from "@/hooks/useAutorizadosPerformance";
import { aplicarFiltros, formatarTempoUltimaAvaliacao, getStatusRiscoColor, getStatusRiscoLabel } from "@/utils/autorizadosFilters";

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
      
      // Usar data_inicio_contagem_inativacao se disponível, senão usar dias_sem_avaliacao como fallback
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

      // Converter dias restantes para formato mais específico
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
    const interval = setInterval(updateCountdown, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [autorizado]);

  // Determinar cor baseada no tempo restante
  const getCountdownColor = () => {
    if (!autorizado.ativo) return "text-muted-foreground";
    
    const diasLimite = 90;
    
    // Usar data_inicio_contagem_inativacao se disponível
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


interface Autorizado {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  responsavel?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  regiao?: string;
  ativo: boolean;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  last_geocoded_at?: string;
  geocode_precision?: string;
  created_at: string;
  updated_at: string;
  vendedor_id?: string;
  etapa?: string;
  tipo_parceiro: TipoParceiro;
  representante_etapa?: string;
  licenciado_etapa?: string;
  average_rating?: number;
  total_ratings?: number;
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface Vendedor {
  id: string;
  nome: string;
  foto_perfil_url?: string;
}

export default function Parceiros() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: autorizados = [], isLoading: loading } = useAutorizadosPerformance();
  const [filteredAutorizados, setFilteredAutorizados] = useState(autorizados);
  const [editingAutorizado, setEditingAutorizado] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState<string | null>(null);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [historyAutorizado, setHistoryAutorizado] = useState<any | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInativacaoModalOpen, setIsInativacaoModalOpen] = useState(false);
  const [tipoParceiro, setTipoParceiro] = useState<TipoParceiro>('autorizado');
  
  // Estados dos filtros
  const [filtros, setFiltros] = useState<FiltrosAutorizados>({
    busca: '',
    etapa: 'todos',
    statusRisco: 'todos',
    atendente: '',
    faixaAvaliacao: 'todos',
    tempoUltimaAvaliacao: 'todos'
  });

  useEffect(() => {
    fetchVendedores();
  }, []);

  useEffect(() => {
    const filtered = aplicarFiltros(autorizados.filter(a => a.tipo_parceiro === tipoParceiro), filtros);
    setFilteredAutorizados(filtered);
  }, [autorizados, filtros, tipoParceiro]);

  // Autorizados críticos para inativação
  const autorizadosCriticos = autorizados
    .filter(a => a.ativo && a.status_risco === 'critico')
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

  const handleEdit = (autorizado: Autorizado) => {
    setEditingAutorizado(autorizado);
    setIsEditDialogOpen(true);
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      // Validação do tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem.');
      }

      // Validação do tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB.');
      }

      if (!editingAutorizado) return;

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${editingAutorizado.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('autorizados-logos')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '31536000' // 1 ano
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('autorizados-logos')
        .getPublicUrl(filePath);

      setEditingAutorizado({ 
        ...editingAutorizado, 
        logo_url: publicUrl 
      });

      toast({
        title: 'Sucesso',
        description: 'Imagem carregada com sucesso!'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    if (editingAutorizado) {
      setEditingAutorizado({ 
        ...editingAutorizado, 
        logo_url: undefined 
      });
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

  const handleSaveEdit = async () => {
    if (!editingAutorizado) return;

    try {
      const { error } = await supabase
        .from('autorizados')
        .update({
          nome: editingAutorizado.nome,
          email: editingAutorizado.email,
          telefone: editingAutorizado.telefone,
          whatsapp: editingAutorizado.whatsapp,
          responsavel: editingAutorizado.responsavel,
          endereco: editingAutorizado.endereco,
          cidade: editingAutorizado.cidade,
          estado: editingAutorizado.estado,
          cep: editingAutorizado.cep,
          regiao: editingAutorizado.regiao,
          ativo: editingAutorizado.ativo,
          logo_url: editingAutorizado.logo_url,
          vendedor_id: editingAutorizado.vendedor_id,
          etapa: tipoParceiro === 'autorizado' ? editingAutorizado.etapa : null,
          representante_etapa: tipoParceiro === 'representante' ? editingAutorizado.representante_etapa : null,
          licenciado_etapa: tipoParceiro === 'licenciado' ? editingAutorizado.licenciado_etapa : null,
          tipo_parceiro: editingAutorizado.tipo_parceiro,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAutorizado.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Parceiro atualizado com sucesso.'
      });

      setIsEditDialogOpen(false);
      setEditingAutorizado(null);
        // Refresh will happen automatically via the hook
    } catch (error) {
      console.error('Erro ao atualizar parceiro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar parceiro.'
      });
    }
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
        description: 'Parceiro excluído com sucesso.'
      });

        // Auto-refresh handled by the hook
    } catch (error) {
      console.error('Erro ao excluir parceiro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir parceiro.'
      });
    }
  };

  const handleGeocode = async (autorizado: Autorizado) => {
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
          endereco: autorizado.endereco || '',
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
      // Auto-refresh handled by the hook
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
      autorizado.cidade && 
      autorizado.estado && 
      !autorizado.latitude && 
      !autorizado.longitude
    );

    if (autorizadosToGeocode.length === 0) {
      toast({
        title: 'Info',
        description: 'Nenhum parceiro encontrado para geocodificação.'
      });
      return;
    }

    setBatchGeocoding(true);
    let success = 0;
    let errors = 0;

    toast({
      title: 'Geocodificação em lote iniciada',
      description: `Processando ${autorizadosToGeocode.length} parceiros...`
    });

    for (const autorizado of autorizadosToGeocode) {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-nominatim', {
          body: {
            id: autorizado.id,
            endereco: autorizado.endereco || '',
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

      // Delay para respeitar limites da API do Nominatim
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setBatchGeocoding(false);
    
    toast({
      title: 'Geocodificação em lote concluída',
      description: `${success} sucessos, ${errors} erros`
    });

    // Auto-refresh handled by the hook
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório de ${TIPO_PARCEIRO_LABELS[tipoParceiro]}s`, 105, 20, { align: 'center' });
    
    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 30, { align: 'center' });
    
    const { etapas } = getEtapasByTipo(tipoParceiro);
    
    // Preparar dados para a tabela
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
    
    // Cabeçalhos da tabela
    const headers = [['Nome', 'Vendedor', 'Responsável', 'Telefone', 'Cidade', 'Estado', 'Etapa', 'Status']];
    
    // Gerar tabela
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
        0: { cellWidth: 30 }, // Nome
        1: { cellWidth: 25 }, // Vendedor
        2: { cellWidth: 25 }, // Responsável
        3: { cellWidth: 20 }, // Telefone
        4: { cellWidth: 20 }, // Cidade
        5: { cellWidth: 15 }, // Estado
        6: { cellWidth: 25 }, // Etapa
        7: { cellWidth: 15 }, // Status
      },
    });
    
    // Download do PDF
    doc.save(`${TIPO_PARCEIRO_LABELS[tipoParceiro]}s-${new Date().toISOString().split('T')[0]}.pdf`);
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
        <h1 className="text-3xl font-bold">Parceiros</h1>
        <Button
          onClick={() => navigate('/dashboard/autorizados/novo')}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo {TIPO_PARCEIRO_LABELS[tipoParceiro]}
        </Button>
      </div>

      <Tabs value={tipoParceiro} onValueChange={(value) => setTipoParceiro(value as TipoParceiro)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="autorizado">Autorizados</TabsTrigger>
          <TabsTrigger value="representante">Representantes</TabsTrigger>
          <TabsTrigger value="licenciado">Licenciados</TabsTrigger>
        </TabsList>

        <TabsContent value={tipoParceiro}>
          <AutorizadosIndicadores />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{TIPO_PARCEIRO_LABELS[tipoParceiro]}s Cadastrados</CardTitle>
                  <CardDescription>
                    Total de {filteredAutorizados.length} {TIPO_PARCEIRO_LABELS[tipoParceiro].toLowerCase()}s cadastrados
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
                  setFiltros={setFiltros} 
                  vendedores={vendedores} 
                />
                
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Buscar ${TIPO_PARCEIRO_LABELS[tipoParceiro].toLowerCase()}s...`}
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
                      const { etapas } = getEtapasByTipo(tipoParceiro);
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
                                tipoParceiro={tipoParceiro}
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
                                onClick={() => handleEdit(autorizado)}
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
                                      Tem certeza que deseja excluir o {TIPO_PARCEIRO_LABELS[tipoParceiro].toLowerCase()} "{autorizado.nome}"? Esta ação não pode ser desfeita.
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
                  autorizados={filteredAutorizados} 
                  onEtapaChange={() => {}} 
                  onShowHistory={() => {}}
                  tipoParceiro={tipoParceiro}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {TIPO_PARCEIRO_LABELS[tipoParceiro]}</DialogTitle>
            <DialogDescription>
              Edite as informações do {TIPO_PARCEIRO_LABELS[tipoParceiro].toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          {editingAutorizado && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={editingAutorizado.nome}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingAutorizado.email || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={editingAutorizado.telefone || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={editingAutorizado.whatsapp || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, whatsapp: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={editingAutorizado.responsavel || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, responsavel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendedor">Vendedor</Label>
                <Select
                  value={editingAutorizado.vendedor_id || ''}
                  onValueChange={(value) =>
                    setEditingAutorizado({ ...editingAutorizado, vendedor_id: value || null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem vendedor</SelectItem>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={editingAutorizado.endereco || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, endereco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={editingAutorizado.cidade || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, cidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={editingAutorizado.estado || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, estado: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={editingAutorizado.cep || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, cep: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regiao">Região</Label>
                <Input
                  id="regiao"
                  value={editingAutorizado.regiao || ''}
                  onChange={(e) => setEditingAutorizado({ ...editingAutorizado, regiao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ativo">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={editingAutorizado.ativo}
                    onCheckedChange={(checked) => setEditingAutorizado({ ...editingAutorizado, ativo: checked })}
                  />
                  <Label htmlFor="ativo">{editingAutorizado.ativo ? 'Ativo' : 'Inativo'}</Label>
                </div>
              </div>

              {/* Etapa baseada no tipo de parceiro */}
              <div className="space-y-2">
                <Label htmlFor="etapa">Etapa</Label>
                <Select
                  value={getCurrentEtapa(editingAutorizado) || ''}
                  onValueChange={(value) => {
                    const updates: any = { ...editingAutorizado };
                    if (tipoParceiro === 'autorizado') {
                      updates.etapa = value;
                    } else if (tipoParceiro === 'representante') {
                      updates.representante_etapa = value;
                    } else if (tipoParceiro === 'licenciado') {
                      updates.licenciado_etapa = value;
                    }
                    setEditingAutorizado(updates);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(getEtapasByTipo(tipoParceiro).etapas).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upload de imagem */}
              <div className="space-y-4 md:col-span-2">
                <Label>Logo do {TIPO_PARCEIRO_LABELS[tipoParceiro]}</Label>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={editingAutorizado.logo_url} />
                    <AvatarFallback className="text-lg">
                      {getInitials(editingAutorizado.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4 mr-2" />
                        )}
                        {uploading ? 'Carregando...' : 'Escolher Imagem'}
                      </Button>
                      {editingAutorizado.logo_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={uploadImage}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Formatos suportados: JPG, PNG, GIF. Tamanho máximo: 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de histórico */}
      <AutorizadoHistoryModal 
        autorizado={historyAutorizado}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Modal de inativação automática */}
      <InativacaoAutomaticaModal 
        isOpen={isInativacaoModalOpen}
        onClose={() => setIsInativacaoModalOpen(false)}
        autorizadosCriticos={autorizadosCriticos}
      />
    </div>
  );
}