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
          updated_at, vendedor_id, tipo_parceiro,
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
      {showOverlays && (
        <>
          {/* Painel de estatísticas */}
          <div className="fixed z-[9999]" style={{ top: '70px', left: '20px' }}>
            <Card className="min-w-[200px] shadow-lg bg-card/95 backdrop-blur ml-[60px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Ativos:</span>
                  <span className="font-medium">{stats.ativos}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Inativos:</span>
                  <span className="font-medium">{stats.inativos}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Geocodificados:</span>
                  <span className="font-medium">{stats.geocodificados}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Não geocodificados:</span>
                  <span className="font-medium">{stats.naoGeocodificados}</span>
                </div>
                <div className="border-t pt-1 mt-1 flex justify-between text-primary font-medium">
                  <span>No mapa:</span>
                  <span>{stats.ativosComCoordenadas}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Instalações:</span>
                  <span>{stats.instalacoesGeocodificadas}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Painel de filtros */}
      <div className="fixed z-[9999] left-1/2 -translate-x-1/2 bottom-0">
        <Card className="shadow-2xl bg-card/95 backdrop-blur rounded-t-3xl rounded-b-none border-t border-x border-b-0">
          <CardContent className="px-8 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 group cursor-pointer transition-transform duration-200 hover:scale-110">
                <Checkbox 
                  id="filter-autorizados"
                  checked={filters.autorizados}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, autorizados: checked as boolean }))
                  }
                  className="rounded-full h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                />
                <Label 
                  htmlFor="filter-autorizados" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Autorizados
                </Label>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer transition-transform duration-200 hover:scale-110">
                <Checkbox 
                  id="filter-representantes"
                  checked={filters.representantes}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, representantes: checked as boolean }))
                  }
                  className="rounded-full h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                />
                <Label 
                  htmlFor="filter-representantes" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Representantes
                </Label>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer transition-transform duration-200 hover:scale-110">
                <Checkbox 
                  id="filter-licenciados"
                  checked={filters.licenciados}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, licenciados: checked as boolean }))
                  }
                  className="rounded-full h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                />
                <Label 
                  htmlFor="filter-licenciados" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Licenciados
                </Label>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer transition-transform duration-200 hover:scale-110">
                <Checkbox 
                  id="filter-instalacoes"
                  checked={filters.instalacoes}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, instalacoes: checked as boolean }))
                  }
                  className="rounded-full h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                />
                <Label 
                  htmlFor="filter-instalacoes" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Instalações
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões fixos de geocodificação e toggle */}
      <div className="fixed z-[9999] flex flex-col gap-2" style={{ top: '70px', right: '20px' }}>
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
        
        <Button
          onClick={() => setShowOverlays(!showOverlays)}
          variant="outline"
          size="sm"
          className="shadow-lg bg-background/95 backdrop-blur"
        >
          {showOverlays ? (
            <EyeOff className="h-4 w-4 mr-2" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          {showOverlays ? 'Ocultar' : 'Mostrar'} dados
        </Button>
      </div>

      {/* Mapa com margem superior e altura total relativa */}
      <div className="absolute inset-0 w-full" style={{ paddingTop: '50px' }}>
        <AutorizadosMapLeaflet 
          autorizados={filteredAutorizados} 
          instalacoes={filteredInstalacoes}
          showOverlays={showOverlays} 
        />
      </div>
    </div>
  );
}