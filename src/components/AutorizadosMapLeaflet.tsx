import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { MapPin, Phone, Mail, User, Navigation, X, Home, Filter, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { getMarkerColorByTipo, TIPO_PARCEIRO_LABELS, type TipoParceiro, ETAPAS_AUTORIZADO, type AutorizadoEtapa } from '@/utils/parceiros';
import { InstalacaoCadastrada } from '@/hooks/useInstalacoesCadastradas';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
interface Autorizado {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  responsavel?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  ativo: boolean;
  tipo_parceiro: TipoParceiro;
  etapa?: string;
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}
interface AutorizadosMapLeafletProps {
  autorizados: Autorizado[];
  instalacoes?: InstalacaoCadastrada[];
  showOverlays?: boolean;
}
interface ClickedPoint {
  lat: number;
  lng: number;
  nearestAutorizados: Array<Autorizado & {
    distance: number;
  }>;
  distanceToHQ: number;
}

// Headquarters coordinates (Caxias do Sul/RS)
const HQ_COORDINATES = {
  lat: -29.1678,
  lng: -51.1794
};
const AutorizadosMapLeaflet: React.FC<AutorizadosMapLeafletProps> = ({
  autorizados,
  instalacoes = [],
  showOverlays = true
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [clickedPoint, setClickedPoint] = useState<ClickedPoint | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Filtros de etapas de autorizados
  const [etapaFilters, setEtapaFilters] = useState<Set<AutorizadoEtapa>>(new Set());
  
  // Filtros de tipos de instalação
  const [tipoInstalacaoFilters, setTipoInstalacaoFilters] = useState<Set<'instalacao' | 'entrega' | 'correcao'>>(new Set());
  
  // Filtros de data
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [quickDateFilter, setQuickDateFilter] = useState<'current_week' | 'next_week' | 'custom' | null>(null);

  // Filter autorizados with valid coordinates
  const autorizadosWithCoords = autorizados.filter(autorizado => {
    if (!autorizado.latitude || !autorizado.longitude || !autorizado.ativo) return false;
    
    // Se houver filtros de etapa selecionados, aplicar
    if (etapaFilters.size > 0 && autorizado.tipo_parceiro === 'autorizado') {
      return etapaFilters.has(autorizado.etapa as AutorizadoEtapa);
    }
    
    return true;
  });

  // Filter instalacoes with valid coordinates and exclude finalized ones
  const instalacoesWithCoords = instalacoes.filter(
    instalacao => {
      if (!instalacao.latitude || !instalacao.longitude || instalacao.status === 'finalizada') return false;
      
      // Filtro de tipo de instalação
      if (tipoInstalacaoFilters.size > 0) {
        if (!tipoInstalacaoFilters.has(instalacao.categoria)) return false;
      }
      
      // Filtro de data
      if (dateRange.from || dateRange.to) {
        if (!instalacao.data_instalacao) return false;
        
        const instalacaoDate = parseISO(instalacao.data_instalacao);
        
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(instalacaoDate, { start: dateRange.from, end: dateRange.to });
        } else if (dateRange.from) {
          return instalacaoDate >= dateRange.from;
        } else if (dateRange.to) {
          return instalacaoDate <= dateRange.to;
        }
      }
      
      return true;
    }
  );
  
  // Função para aplicar filtros rápidos de data
  const applyQuickDateFilter = (filter: 'current_week' | 'next_week') => {
    const now = new Date();
    let from: Date, to: Date;
    
    if (filter === 'current_week') {
      from = startOfWeek(now, { locale: ptBR });
      to = endOfWeek(now, { locale: ptBR });
    } else {
      const nextWeek = addWeeks(now, 1);
      from = startOfWeek(nextWeek, { locale: ptBR });
      to = endOfWeek(nextWeek, { locale: ptBR });
    }
    
    setDateRange({ from, to });
    setQuickDateFilter(filter);
  };
  
  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setEtapaFilters(new Set());
    setTipoInstalacaoFilters(new Set());
    setDateRange({});
    setQuickDateFilter(null);
  };
  
  // Contar filtros ativos
  const activeFiltersCount = etapaFilters.size + tipoInstalacaoFilters.size + (dateRange.from || dateRange.to ? 1 : 0);

  // Count parceiros by state and type
  const parceirosPorEstado = autorizados.filter(autorizado => autorizado.ativo && autorizado.estado).reduce((acc, autorizado) => {
    const estado = autorizado.estado!;
    const tipo = autorizado.tipo_parceiro;
    if (!acc[estado]) {
      acc[estado] = {
        autorizado: 0,
        representante: 0,
        licenciado: 0
      };
    }
    acc[estado][tipo] = (acc[estado][tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<TipoParceiro, number>>);

  // Convert to flat array for display
  const estadosOrdenados = Object.entries(parceirosPorEstado).map(([estado, tipos]) => ({
    estado,
    total: Object.values(tipos).reduce((sum, count) => sum + count, 0),
    tipos
  })).sort((a, b) => b.total - a.total);

  // Count parceiros by attendant
  const parceirosPorAtendente = autorizados.filter(autorizado => autorizado.ativo && autorizado.vendedor).reduce((acc, autorizado) => {
    const vendedor = autorizado.vendedor!;
    if (!acc[vendedor.nome]) {
      acc[vendedor.nome] = {
        count: 0,
        foto_perfil_url: vendedor.foto_perfil_url
      };
    }
    acc[vendedor.nome].count++;
    return acc;
  }, {} as Record<string, {
    count: number;
    foto_perfil_url?: string;
  }>);

  // Sort attendants by count (descending)
  const atendentesOrdenados = Object.entries(parceirosPorAtendente).sort(([, a], [, b]) => b.count - a.count);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2);
  };
  const handleMapClick = (lat: number, lng: number) => {
    // Calculate distances to all autorizados with coordinates
    const autorizadosWithDistances = autorizadosWithCoords.map(autorizado => ({
      ...autorizado,
      distance: calculateDistance(lat, lng, autorizado.latitude!, autorizado.longitude!)
    }));

    // Sort by distance and get the 3 nearest
    const nearestAutorizados = autorizadosWithDistances.sort((a, b) => a.distance - b.distance).slice(0, 3);

    // Calculate distance to headquarters
    const distanceToHQ = calculateDistance(lat, lng, HQ_COORDINATES.lat, HQ_COORDINATES.lng);
    setClickedPoint({
      lat,
      lng,
      nearestAutorizados,
      distanceToHQ
    });
  };

  // Custom cluster icon for autorizados
  const createClusterCustomIcon = (cluster: any) => {
    return L.divIcon({
      html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(32, 32, true)
    });
  };

  // Custom cluster icon for instalacoes
  const createInstalacaoClusterIcon = (cluster: any) => {
    return L.divIcon({
      html: `<span class="instalacao-cluster-icon">${cluster.getChildCount()}</span>`,
      className: 'custom-instalacao-cluster',
      iconSize: L.point(32, 32, true)
    });
  };

  // Custom icon for clicked point
  const createClickedPointIcon = () => {
    return L.divIcon({
      html: `<div class="clicked-point-icon"></div>`,
      className: 'custom-clicked-point',
      iconSize: L.point(16, 16, true),
      iconAnchor: L.point(8, 8)
    });
  };

  // Custom marker icon based on partner type and stage
  const createPartnerIcon = (tipoParceiro: TipoParceiro, etapa?: string) => {
    const color = getMarkerColorByTipo(tipoParceiro);
    const isPremium = etapa === 'premium';
    const markerClass = isPremium ? 'custom-partner-marker premium-marker' : 'custom-partner-marker';
    
    return L.divIcon({
      html: `<div class="${markerClass}" style="background-color: ${color};"></div>`,
      className: 'custom-partner-marker-container',
      iconSize: L.point(14, 14),
      iconAnchor: L.point(7, 7)
    });
  };

  // Custom marker icon for instalacoes with color based on categoria
  const createInstalacaoIcon = (categoria: 'instalacao' | 'entrega' | 'correcao' = 'instalacao') => {
    const colors = {
      instalacao: '#ef4444', // vermelho
      entrega: '#6b7280',    // cinza
      correcao: '#a855f7'    // roxo
    };
    
    return L.divIcon({
      html: `<div class="custom-instalacao-marker" style="background-color: ${colors[categoria]};"></div>`,
      className: 'custom-instalacao-marker-container',
      iconSize: L.point(12, 12),
      iconAnchor: L.point(6, 6)
    });
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: e => {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  };
  useEffect(() => {
    // Add custom CSS for clusters and markers
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker-cluster {
        background-color: hsl(var(--primary));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
      .cluster-icon {
        color: hsl(var(--primary-foreground));
        font-weight: 600;
        font-size: 12px;
      }
      .custom-instalacao-cluster {
        background-color: #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        border: 2px solid white;
      }
      .instalacao-cluster-icon {
        color: white;
        font-weight: 600;
        font-size: 12px;
      }
      .custom-clicked-point {
        background: none;
        border: none;
      }
      .clicked-point-icon {
        width: 16px;
        height: 16px;
        background-color: hsl(var(--destructive));
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      .custom-partner-marker-container {
        background: none;
        border: none;
      }
      .custom-partner-marker {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        transition: transform 0.2s ease;
      }
      .custom-partner-marker.premium-marker {
        border: 2px solid hsl(45, 100%, 51%);
        box-shadow: 0 0 0 2px white, 0 0 8px 2px hsla(45, 100%, 51%, 0.5);
        animation: premium-pulse 2s ease-in-out infinite;
      }
      @keyframes premium-pulse {
        0%, 100% {
          box-shadow: 0 0 0 2px white, 0 0 8px 2px hsla(45, 100%, 51%, 0.5);
        }
        50% {
          box-shadow: 0 0 0 2px white, 0 0 12px 3px hsla(45, 100%, 51%, 0.8);
        }
      }
      .custom-partner-marker-container:hover .custom-partner-marker {
        transform: scale(1.2);
      }
      .custom-instalacao-marker-container {
        background: none;
        border: none;
      }
      .custom-instalacao-marker {
        width: 12px;
        height: 12px;
        background-color: #ef4444;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        transition: transform 0.2s ease;
      }
      .custom-instalacao-marker-container:hover .custom-instalacao-marker {
        transform: scale(1.2);
      }
      .leaflet-popup-content-wrapper {
        border-radius: 8px;
        padding: 0;
      }
      .leaflet-popup-content {
        margin: 0;
        padding: 0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // Verificar se há algum elemento para mostrar no mapa (autorizados ou instalações)
  const hasMapContent = autorizadosWithCoords.length > 0 || instalacoesWithCoords.length > 0;
  
  if (!hasMapContent) {
    return <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhum local com coordenadas</h3>
          <p className="text-sm text-muted-foreground">
            Os endereços precisam ser geocodificados para aparecer no mapa
          </p>
        </div>
      </div>;
  }
  return <div className="h-full w-full rounded-lg overflow-hidden border relative flex">
      {/* Sidebar fixa na direita */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 z-[1000] bg-background border-l transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-[320px]" : "w-0"
        )}
      >
        {sidebarOpen && (
          <div className="h-full flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="font-semibold text-lg">Filtros do Mapa</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Filtre autorizados e instalações
              </p>
            </div>
            
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-6">
                {/* Filtros de Etapas de Autorizados */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Etapas de Autorizados
                  </h4>
                  <div className="space-y-2.5">
                    {(Object.entries(ETAPAS_AUTORIZADO) as [AutorizadoEtapa, string][]).map(([etapa, label]) => (
                      <div key={etapa} className="flex items-center space-x-2">
                        <Checkbox
                          id={`etapa-${etapa}`}
                          checked={etapaFilters.has(etapa)}
                          onCheckedChange={(checked) => {
                            const newFilters = new Set(etapaFilters);
                            if (checked) {
                              newFilters.add(etapa);
                            } else {
                              newFilters.delete(etapa);
                            }
                            setEtapaFilters(newFilters);
                          }}
                        />
                        <Label
                          htmlFor={`etapa-${etapa}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtros de Tipos de Instalação */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Tipos de Instalação
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tipo-instalacao"
                        checked={tipoInstalacaoFilters.has('instalacao')}
                        onCheckedChange={(checked) => {
                          const newFilters = new Set(tipoInstalacaoFilters);
                          if (checked) {
                            newFilters.add('instalacao');
                          } else {
                            newFilters.delete('instalacao');
                          }
                          setTipoInstalacaoFilters(newFilters);
                        }}
                      />
                      <Label
                        htmlFor="tipo-instalacao"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Instalação
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tipo-entrega"
                        checked={tipoInstalacaoFilters.has('entrega')}
                        onCheckedChange={(checked) => {
                          const newFilters = new Set(tipoInstalacaoFilters);
                          if (checked) {
                            newFilters.add('entrega');
                          } else {
                            newFilters.delete('entrega');
                          }
                          setTipoInstalacaoFilters(newFilters);
                        }}
                      />
                      <Label
                        htmlFor="tipo-entrega"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Entrega
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tipo-correcao"
                        checked={tipoInstalacaoFilters.has('correcao')}
                        onCheckedChange={(checked) => {
                          const newFilters = new Set(tipoInstalacaoFilters);
                          if (checked) {
                            newFilters.add('correcao');
                          } else {
                            newFilters.delete('correcao');
                          }
                          setTipoInstalacaoFilters(newFilters);
                        }}
                      />
                      <Label
                        htmlFor="tipo-correcao"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Correção
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Filtros de Data */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Data da Instalação
                  </h4>
                  
                  {/* Botões rápidos */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button
                      variant={quickDateFilter === 'current_week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => applyQuickDateFilter('current_week')}
                      className="w-full"
                    >
                      Semana Atual
                    </Button>
                    <Button
                      variant={quickDateFilter === 'next_week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => applyQuickDateFilter('next_week')}
                      className="w-full"
                    >
                      Próxima Semana
                    </Button>
                  </div>
                  
                  {/* Seletor de período customizado */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Período customizado</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            <span>Selecione o período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                          onSelect={(range) => {
                            setDateRange(range || {});
                            setQuickDateFilter('custom');
                          }}
                          numberOfMonths={1}
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({});
                        setQuickDateFilter(null);
                      }}
                      className="w-full mt-2"
                    >
                      Limpar Período
                    </Button>
                  )}
                </div>

                {/* Estatísticas */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-sm mb-3">Resultados</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Autorizados</p>
                      <p className="text-2xl font-bold">{autorizadosWithCoords.length}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Instalações</p>
                      <p className="text-2xl font-bold">{instalacoesWithCoords.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            {/* Footer com botão de limpar */}
            {activeFiltersCount > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Todos os Filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Botão de toggle no centro da lateral direita */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-[1001] bg-background shadow-lg transition-all duration-300",
          sidebarOpen ? "right-[310px]" : "right-2"
        )}
      >
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform duration-300",
          sidebarOpen ? "-rotate-180" : "rotate-0"
        )} />
      </Button>
      
      {/* Área do mapa */}
      <div className={cn(
        "flex-1 relative transition-all duration-300",
        sidebarOpen && "mr-[320px]"
      )}>

      {/* Floating info panel */}
      {clickedPoint && <div className="absolute z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg w-80 max-h-[calc(100%-2rem)] overflow-y-auto" style={{
      top: '100px',
      right: '20px'
    }}>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Navigation className="h-4 w-4 text-destructive" />
                Análise de Localização
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setClickedPoint(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium mb-1">Coordenadas:</p>
                <p className="text-muted-foreground text-xs font-mono">
                  {clickedPoint.lat.toFixed(6)}, {clickedPoint.lng.toFixed(6)}
                </p>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium mb-1">Distância até Matriz:</p>
                <p className="text-muted-foreground">Caxias do Sul/RS</p>
                <p className="text-lg font-semibold text-destructive">{clickedPoint.distanceToHQ.toFixed(1)} km</p>
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="font-medium mb-1">Valor do Frete:</p>
                  <p className="text-lg font-semibold text-primary">R$ {(clickedPoint.distanceToHQ * 12).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium mb-2">Autorizados mais próximos:</p>
                <div className="space-y-2">
                  {clickedPoint.nearestAutorizados.map((autorizado, index) => <div key={autorizado.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{autorizado.nome}</p>
                        <p className="text-xs text-muted-foreground">{autorizado.cidade} - {autorizado.estado}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{autorizado.distance.toFixed(1)} km</p>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
            
            <Button size="sm" variant="outline" onClick={() => setClickedPoint(null)} className="w-full">
              Limpar Ponto
            </Button>
          </div>
        </div>}

      {/* Attendant indicators */}
      {atendentesOrdenados.length > 0 && showOverlays}

      {/* State indicators */}
      {estadosOrdenados.length > 0 && showOverlays && <div className="fixed z-[1000] top-[50px] left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border-x border-b rounded-b-3xl rounded-t-none shadow-xl p-2 min-w-[300px]">
          {/* Resumo compacto com badges */}
          <div className="flex items-center justify-center gap-2 mb-2 pb-2 border-b">
            <div className="flex items-center gap-1">
              <span className="text-xs">Aut.</span>
              <Badge className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs" style={{ backgroundColor: '#3B82F6', color: 'white' }}>
                {autorizados.filter(a => a.ativo && a.tipo_parceiro === 'autorizado').length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Rep.</span>
              <Badge className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs" style={{ backgroundColor: '#6B7280', color: 'white' }}>
                {autorizados.filter(a => a.ativo && a.tipo_parceiro === 'representante').length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Lic.</span>
              <Badge className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs" style={{ backgroundColor: '#EAB308', color: 'white' }}>
                {autorizados.filter(a => a.ativo && a.tipo_parceiro === 'licenciado').length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Inst.</span>
              <Badge className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs" style={{ backgroundColor: '#EF4444', color: 'white' }}>
                {instalacoesWithCoords.length}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2 text-xs max-h-[300px] overflow-y-auto">
            {estadosOrdenados.map(({
          estado,
          total,
          tipos
        }) => <div key={estado} className="bg-muted/50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs">{estado}</span>
                  <Badge variant="secondary" className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {total}
                  </Badge>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(tipos).map(([tipo, count]) => <Badge key={tipo} variant="outline" className="rounded-full h-5 text-xs px-2" style={{
              backgroundColor: getMarkerColorByTipo(tipo as TipoParceiro) + '20',
              borderColor: getMarkerColorByTipo(tipo as TipoParceiro) + '60',
              color: getMarkerColorByTipo(tipo as TipoParceiro)
            }}>
                      {count} {TIPO_PARCEIRO_LABELS[tipo as TipoParceiro].toLowerCase()}
                    </Badge>)}
                </div>
              </div>)}
          </div>
        </div>}

      <MapContainer ref={mapRef} center={[-14.235, -51.9253]} // Center of Brazil
    zoom={4} style={{
      height: '100%',
      width: '100%'
    }} className="leaflet-container">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <MapClickHandler />
          
          <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon} spiderfyOnMaxZoom={true} showCoverageOnHover={false} zoomToBoundsOnClick={true} maxClusterRadius={50}>
            {autorizadosWithCoords.map(autorizado => <Marker key={autorizado.id} position={[autorizado.latitude!, autorizado.longitude!]} icon={createPartnerIcon(autorizado.tipo_parceiro, autorizado.etapa)}>
                <Popup className="custom-popup" minWidth={280}>
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={autorizado.logo_url} alt={autorizado.nome} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(autorizado.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight">
                          {autorizado.nome}
                        </h3>
                        <Badge variant="secondary" className="mt-1" style={{
                    backgroundColor: getMarkerColorByTipo(autorizado.tipo_parceiro) + '20',
                    color: getMarkerColorByTipo(autorizado.tipo_parceiro),
                    borderColor: getMarkerColorByTipo(autorizado.tipo_parceiro) + '40'
                  }}>
                          {TIPO_PARCEIRO_LABELS[autorizado.tipo_parceiro]}
                        </Badge>
                      </div>
                    </div>

                     {/* Contact Info */}
                     <div className="space-y-2 text-sm">
                       {autorizado.vendedor && <div className="flex items-center gap-2">
                           <Avatar className="h-4 w-4">
                             <AvatarImage src={autorizado.vendedor.foto_perfil_url} alt={autorizado.vendedor.nome} />
                             <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                               {getInitials(autorizado.vendedor.nome)}
                             </AvatarFallback>
                           </Avatar>
                           <div>
                             <span className="text-xs text-muted-foreground">Atendente:</span>
                             <span className="ml-1 font-medium">{autorizado.vendedor.nome}</span>
                           </div>
                         </div>}
                       
                       {autorizado.responsavel && <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span>{autorizado.responsavel}</span>
                         </div>}
                      
                      {autorizado.telefone && <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{autorizado.telefone}</span>
                        </div>}
                      
                      {autorizado.email && <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{autorizado.email}</span>
                        </div>}
                      
                      {autorizado.endereco && <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="leading-tight">
                            {autorizado.endereco}
                            {autorizado.cidade && `, ${autorizado.cidade}`}
                            {autorizado.estado && ` - ${autorizado.estado}`}
                          </span>
                        </div>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {autorizado.whatsapp && <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/55${autorizado.whatsapp?.replace(/\D/g, '')}`, '_blank')}>
                          WhatsApp
                        </Button>}
                      {autorizado.telefone && <Button size="sm" variant="outline" onClick={() => window.open(`tel:${autorizado.telefone}`, '_blank')}>
                          Ligar
                        </Button>}
                    </div>
                  </div>
                </Popup>
              </Marker>)}
          </MarkerClusterGroup>

          {/* Instalações markers with clustering */}
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createInstalacaoClusterIcon}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            maxClusterRadius={50}
          >
            {instalacoesWithCoords.map(instalacao => <Marker key={`instalacao-${instalacao.id}`} position={[instalacao.latitude!, instalacao.longitude!]} icon={createInstalacaoIcon(instalacao.categoria)}>
                <Popup className="custom-popup" minWidth={250}>
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: instalacao.categoria === 'instalacao' 
                            ? '#ef4444' 
                            : instalacao.categoria === 'entrega'
                            ? '#6b7280'
                            : '#a855f7'
                        }}
                      >
                        <Home className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight">
                          {instalacao.nome_cliente}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{instalacao.cidade}, {instalacao.estado}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Categoria:</span>
                        <span 
                          className="font-medium px-2 py-1 rounded-md text-xs"
                          style={{
                            backgroundColor: instalacao.categoria === 'instalacao' 
                              ? '#fee2e2' 
                              : instalacao.categoria === 'entrega'
                              ? '#f3f4f6'
                              : '#f3e8ff',
                            color: instalacao.categoria === 'instalacao' 
                              ? '#dc2626' 
                              : instalacao.categoria === 'entrega'
                              ? '#4b5563'
                              : '#9333ea'
                          }}
                        >
                          {instalacao.categoria === 'instalacao' && 'Instalação'}
                          {instalacao.categoria === 'entrega' && 'Entrega'}
                          {instalacao.categoria === 'correcao' && 'Correção'}
                        </span>
                      </div>
                      {instalacao.tamanho && <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tamanho:</span>
                          <span className="font-medium">{instalacao.tamanho}</span>
                        </div>}
                      {instalacao.criador && (
                        <div className="flex items-center gap-2 py-2 border-t">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={instalacao.criador.foto_perfil_url} alt={instalacao.criador.nome} />
                            <AvatarFallback className="text-xs">
                              {instalacao.criador.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Cadastrado por</span>
                            <p className="text-sm font-medium truncate">{instalacao.criador.nome}</p>
                          </div>
                        </div>
                      )}
                      {instalacao.geocode_precision && <div className="text-xs text-muted-foreground border-t pt-2">
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight">{instalacao.geocode_precision}</span>
                          </div>
                        </div>}
                    </div>
                  </div>
                </Popup>
              </Marker>)}
          </MarkerClusterGroup>

          {/* Clicked point marker */}
          {clickedPoint && <>
              <Marker position={[clickedPoint.lat, clickedPoint.lng]} icon={createClickedPointIcon()} />
              
              {/* Polylines to nearest autorizados */}
              {clickedPoint.nearestAutorizados.map((autorizado, index) => <Polyline key={autorizado.id} positions={[[clickedPoint.lat, clickedPoint.lng], [autorizado.latitude!, autorizado.longitude!]]} color={index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : '#ef4444'} weight={3} opacity={0.7} dashArray={index === 0 ? undefined : "5, 10"} />)}
            </>}
        </MapContainer>
      </div>
    </div>;
};
export default AutorizadosMapLeaflet;