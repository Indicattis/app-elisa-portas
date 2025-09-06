import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, MapPin, Users, Building2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
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
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const { toast } = useToast();

  // Dados agrupados para dashboard
  const estadosData = useMemo(() => {
    const grupos = autorizados.reduce((acc, autorizado) => {
      if (!autorizado.estado) return acc;
      
      if (!acc[autorizado.estado]) {
        acc[autorizado.estado] = {
          estado: autorizado.estado,
          total: 0,
          ativos: 0,
          cidades: new Set()
        };
      }
      
      acc[autorizado.estado].total++;
      if (autorizado.ativo) acc[autorizado.estado].ativos++;
      if (autorizado.cidade) acc[autorizado.estado].cidades.add(autorizado.cidade);
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grupos).map((grupo: any) => ({
      ...grupo,
      cidades: grupo.cidades.size
    })).sort((a: any, b: any) => b.total - a.total);
  }, [autorizados]);

  // Setup autoplay effect
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (!isHovering) {
        api.scrollNext();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [api, isHovering]);

  // Setup event listeners for carousel
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setSelectedIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const handleDotClick = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  }, [api]);

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
    <div 
      className="fixed inset-0 w-full h-full bg-gradient-to-br from-background via-background to-background/80"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
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

      <Carousel 
        setApi={setApi} 
        className="h-full w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="h-full">
          {/* Slide 1: Mapa */}
          <CarouselItem className="h-full">
            <div className="absolute inset-0 w-full" style={{ paddingTop: '50px' }}>
              <AutorizadosMapLeaflet autorizados={autorizados} />
            </div>
          </CarouselItem>

          {/* Slide 2: Dashboard */}
          <CarouselItem className="h-full">
            <div className="h-full p-8 overflow-y-auto" style={{ paddingTop: '50px' }}>
              <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h1 className="text-4xl font-bold text-foreground">Dashboard de Autorizados</h1>
                  <p className="text-xl text-muted-foreground">
                    Distribuição por Estados e Cidades
                  </p>
                </div>

                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-full">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{autorizados.length}</p>
                          <p className="text-sm text-muted-foreground">Total de Autorizados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/20 border-green-500/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-full">
                          <Building2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{estadosData.length}</p>
                          <p className="text-sm text-muted-foreground">Estados Atendidos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/20 border-blue-500/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full">
                          <MapPin className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {estadosData.reduce((sum, estado) => sum + estado.cidades, 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Cidades Atendidas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Grid de estados */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {estadosData.map((estado, index) => (
                    <Card 
                      key={estado.estado} 
                      className="hover-scale bg-gradient-to-br from-background to-muted/30 border-border/50 hover:border-primary/30 transition-all duration-300"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">{estado.estado}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-primary/10 rounded-lg">
                            <p className="text-xl font-bold text-primary">{estado.total}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="text-center p-2 bg-green-500/10 rounded-lg">
                            <p className="text-xl font-bold text-green-600">{estado.ativos}</p>
                            <p className="text-xs text-muted-foreground">Ativos</p>
                          </div>
                        </div>
                        <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                          <p className="text-lg font-bold text-blue-600">{estado.cidades}</p>
                          <p className="text-xs text-muted-foreground">Cidades</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50">
        {[0, 1].map(index => (
          <button 
            key={index} 
            onClick={() => handleDotClick(index)} 
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              selectedIndex === index ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white/70'
            }`} 
          />
        ))}
      </div>
    </div>
  );
}