import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2 } from "lucide-react";
import AutorizadosMapLeaflet from "@/components/AutorizadosMapLeaflet";

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
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

export default function MapaAutorizados() {
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
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
          updated_at, vendedor_id,
          vendedor:admin_users(nome, foto_perfil_url)
        `)
        .order('nome')
        .limit(50);

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

    fetchAutorizados();
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
      {/* Botão fixo de geocodificação */}
      <div className="fixed z-[9999]" style={{ top: '70px', right: '20px' }}>
        <Button
          onClick={handleBatchGeocode}
          disabled={batchGeocoding}
          variant="default"
          size="sm"
          className="shadow-lg"
        >
          {batchGeocoding ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Geocodificar todos
        </Button>
      </div>

      {/* Mapa com margem superior e altura total relativa */}
      <div className="absolute inset-0 w-full" style={{ paddingTop: '50px' }}>
        <AutorizadosMapLeaflet autorizados={autorizados} />
      </div>
    </div>
  );
}