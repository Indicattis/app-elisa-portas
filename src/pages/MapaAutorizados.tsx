import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Eye, EyeOff, Filter } from "lucide-react";
import AutorizadosMapLeaflet from "@/components/AutorizadosMapLeaflet";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";

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
  tipo_parceiro: 'autorizado' | 'representante' | 'licenciado';
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

export default function MapaAutorizados() {
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [filters, setFilters] = useState({
    autorizados: true,
    representantes: true,
    licenciados: true,
    instalacoes: true
  });
  const { instalacoes } = useInstalacoesCadastradas();
  const { toast } = useToast();

  useEffect(() => {
    fetchAutorizados();
  }, []);

  const fetchAutorizados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('autorizados')
        .select(`
          id, nome, email, telefone, whatsapp, responsavel, endereco, 
          cidade, estado, cep, regiao, ativo, logo_url, latitude, 
          longitude, last_geocoded_at, geocode_precision, created_at, 
          updated_at, vendedor_id, tipo_parceiro, etapa, 
          representante_etapa, licenciado_etapa,
          vendedor:admin_users(nome, foto_perfil_url)
        `)
        .order('nome');

      if (error) throw error;
      setAutorizados(data || []);
    } catch (error) {
      console.error('Erro ao buscar autorizados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao buscar autorizados.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGeocode = async () => {
    const autorizadosToGeocode = autorizados.filter(autorizado => 
      autorizado.ativo && 
      autorizado.cidade && 
      autorizado.estado
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

      // Delay para respeitar limites da API do Nominatim
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setBatchGeocoding(false);
    
    toast({
      title: 'Geocodificação em lote concluída',
      description: `${success} sucessos, ${errors} erros`
    });

    fetchAutorizados();
  };

  // Filtrar autorizados baseado nas opções selecionadas
  const filteredAutorizados = autorizados.filter(autorizado => {
    if (autorizado.tipo_parceiro === 'autorizado') return filters.autorizados;
    if (autorizado.tipo_parceiro === 'representante') return filters.representantes;
    if (autorizado.tipo_parceiro === 'licenciado') return filters.licenciados;
    return false;
  });

  // Filtrar instalações
  const filteredInstalacoes = filters.instalacoes ? instalacoes : [];

  // Calcular estatísticas dos parceiros
  const stats = {
    total: autorizados.length,
    ativos: autorizados.filter(a => a.ativo).length,
    inativos: autorizados.filter(a => !a.ativo).length,
    geocodificados: autorizados.filter(a => a.latitude && a.longitude).length,
    naoGeocodificados: autorizados.filter(a => !a.latitude || !a.longitude).length,
    ativosComCoordenadas: autorizados.filter(a => a.ativo && a.latitude && a.longitude).length,
    instalacoesGeocodificadas: instalacoes.filter(i => i.latitude && i.longitude).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando autorizados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full">
      {/* Mapa em tela cheia */}
      <div className="absolute inset-0 w-full">
        <AutorizadosMapLeaflet 
          autorizados={filteredAutorizados} 
          instalacoes={filteredInstalacoes}
          showOverlays={showOverlays}
          stats={stats}
        />
      </div>
    </div>
  );
}