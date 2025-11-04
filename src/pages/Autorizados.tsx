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
import { AutorizadosGrid } from "@/components/AutorizadosGrid";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Loader2, RefreshCw, Download, Table as TableIcon, LayoutDashboard, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getEtapasByTipo, getCurrentEtapa } from "@/utils/parceiros";
import { useAutorizadosPerformance } from "@/hooks/useAutorizadosPerformance";
import { aplicarFiltros } from "@/utils/autorizadosFilters";

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
  const { data: autorizados = [], isLoading: loading } = useAutorizadosPerformance('autorizado');
  const [filteredAutorizados, setFilteredAutorizados] = useState(autorizados);
  const [geocoding, setGeocoding] = useState<string | null>(null);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  
  const [filtros, setFiltros] = useState<FiltrosAutorizados>({
    busca: '',
    etapa: 'todos',
    atendente: 'todos'
  });

  useEffect(() => {
    fetchVendedores();
  }, []);

  useEffect(() => {
    const filtered = aplicarFiltros(autorizados, filtros);
    setFilteredAutorizados(filtered);
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
        queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
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
    queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
    
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Autorizados Cadastrados</CardTitle>
              <CardDescription>
                Total de {filteredAutorizados.length} autorizados cadastrados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
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
              <Button
                onClick={handleBatchGeocode}
                disabled={batchGeocoding}
                variant="outline"
                size="sm"
              >
                {batchGeocoding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Geocodificar todos
              </Button>
            </div>
          </div>
          
          <AutorizadosFiltros 
            filtros={filtros} 
            onFiltrosChange={setFiltros}
            atendentes={vendedores.map(v => ({ id: v.id, nome: v.nome }))} 
          />
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <AutorizadosGrid 
              autorizados={filteredAutorizados}
              onEdit={(id) => navigate(`/dashboard/parceiros/${id}/edit/autorizado`)}
              onDelete={handleDelete}
              onView={(id) => navigate(`/dashboard/parceiros/${id}/edit/autorizado`)}
            />
          ) : (
            <AutorizadosKanban 
              autorizados={filteredAutorizados.map(a => ({ ...a, tipo_parceiro: a.tipo_parceiro || 'autorizado' }))} 
              tipoParceiro="autorizado"
              onEtapaChange={(id, etapa) => {
                queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
              }} 
              onShowHistory={() => {}}
              onDoubleClick={(autorizado) => navigate(`/dashboard/parceiros/${autorizado.id}/edit/autorizado`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
