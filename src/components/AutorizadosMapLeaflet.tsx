import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Phone, Mail, User, Navigation, X, Home } from 'lucide-react';
import { getMarkerColorByTipo, TIPO_PARCEIRO_LABELS, type TipoParceiro } from '@/utils/parceiros';
import { InstalacaoCadastrada } from '@/hooks/useInstalacoesCadastradas';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
  nearestAutorizados: Array<Autorizado & { distance: number }>;
  distanceToHQ: number;
}

// Headquarters coordinates (Caxias do Sul/RS)
const HQ_COORDINATES = {
  lat: -29.1678,
  lng: -51.1794
};

const AutorizadosMapLeaflet: React.FC<AutorizadosMapLeafletProps> = ({ autorizados, instalacoes = [], showOverlays = true }) => {
  const mapRef = useRef<L.Map | null>(null);
  const [clickedPoint, setClickedPoint] = useState<ClickedPoint | null>(null);

  // Filter autorizados with valid coordinates
  const autorizadosWithCoords = autorizados.filter(
    autorizado => 
      autorizado.latitude && 
      autorizado.longitude && 
      autorizado.ativo
  );

  // Filter instalacoes with valid coordinates
  const instalacoesWithCoords = instalacoes.filter(
    instalacao => 
      instalacao.latitude && 
      instalacao.longitude
  );

  // Count parceiros by state and type
  const parceirosPorEstado = autorizados
    .filter(autorizado => autorizado.ativo && autorizado.estado)
    .reduce((acc, autorizado) => {
      const estado = autorizado.estado!;
      const tipo = autorizado.tipo_parceiro;
      if (!acc[estado]) {
        acc[estado] = { autorizado: 0, representante: 0, licenciado: 0 };
      }
      acc[estado][tipo] = (acc[estado][tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, Record<TipoParceiro, number>>);

  // Convert to flat array for display
  const estadosOrdenados = Object.entries(parceirosPorEstado)
    .map(([estado, tipos]) => ({
      estado,
      total: Object.values(tipos).reduce((sum, count) => sum + count, 0),
      tipos
    }))
    .sort((a, b) => b.total - a.total);

  // Count parceiros by attendant
  const parceirosPorAtendente = autorizados
    .filter(autorizado => autorizado.ativo && autorizado.vendedor)
    .reduce((acc, autorizado) => {
      const vendedor = autorizado.vendedor!;
      if (!acc[vendedor.nome]) {
        acc[vendedor.nome] = {
          count: 0,
          foto_perfil_url: vendedor.foto_perfil_url
        };
      }
      acc[vendedor.nome].count++;
      return acc;
    }, {} as Record<string, { count: number; foto_perfil_url?: string }>);

  // Sort attendants by count (descending)
  const atendentesOrdenados = Object.entries(parceirosPorAtendente)
    .sort(([, a], [, b]) => b.count - a.count);
    
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Calculate distances to all autorizados with coordinates
    const autorizadosWithDistances = autorizadosWithCoords.map(autorizado => ({
      ...autorizado,
      distance: calculateDistance(lat, lng, autorizado.latitude!, autorizado.longitude!)
    }));

    // Sort by distance and get the 3 nearest
    const nearestAutorizados = autorizadosWithDistances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    // Calculate distance to headquarters
    const distanceToHQ = calculateDistance(lat, lng, HQ_COORDINATES.lat, HQ_COORDINATES.lng);

    setClickedPoint({
      lat,
      lng,
      nearestAutorizados,
      distanceToHQ
    });
  };

  // Custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    return L.divIcon({
      html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
  };

  // Custom icon for clicked point
  const createClickedPointIcon = () => {
    return L.divIcon({
      html: `<div class="clicked-point-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg></div>`,
      className: 'custom-clicked-point',
      iconSize: L.point(24, 24, true),
    });
  };

  // Custom marker icon based on partner type
  const createPartnerIcon = (tipoParceiro: TipoParceiro) => {
    const color = getMarkerColorByTipo(tipoParceiro);
    return L.divIcon({
      html: `
        <div class="custom-partner-marker" style="background-color: ${color};">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      className: 'custom-partner-marker-container',
      iconSize: L.point(32, 40),
      iconAnchor: L.point(16, 40),
    });
  };

  // Custom marker icon for instalacoes (red)
  const createInstalacaoIcon = () => {
    return L.divIcon({
      html: `
        <div class="custom-partner-marker" style="background-color: #ef4444;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
      `,
      className: 'custom-partner-marker-container',
      iconSize: L.point(32, 40),
      iconAnchor: L.point(16, 40),
    });
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  useEffect(() => {
    // Add custom CSS for clusters and markers
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker-cluster {
        background-color: hsl(var(--primary));
        border: 3px solid hsl(var(--background));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      .cluster-icon {
        color: hsl(var(--primary-foreground));
        font-weight: bold;
        font-size: 14px;
      }
      .custom-clicked-point {
        background: none;
        border: none;
      }
      .clicked-point-icon {
        color: hsl(var(--destructive));
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      .custom-partner-marker-container {
        background: none;
        border: none;
      }
      .custom-partner-marker {
        width: 28px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .custom-partner-marker svg {
        transform: rotate(45deg);
        margin-top: -2px;
        margin-left: -1px;
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

  if (autorizadosWithCoords.length === 0 && instalacoesWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhum ponto com localização</h3>
          <p className="text-sm text-muted-foreground">
            Os endereços precisam ser geocodificados para aparecer no mapa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border relative">
      {/* Floating info panel */}
      {clickedPoint && (
        <div className="absolute z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg w-80 max-h-[calc(100%-2rem)] overflow-y-auto" style={{ top: '100px', right: '20px' }}>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Navigation className="h-4 w-4 text-destructive" />
                Análise de Localização
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setClickedPoint(null)}
              >
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
                  {clickedPoint.nearestAutorizados.map((autorizado, index) => (
                    <div key={autorizado.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{autorizado.nome}</p>
                        <p className="text-xs text-muted-foreground">{autorizado.cidade} - {autorizado.estado}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{autorizado.distance.toFixed(1)} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setClickedPoint(null)}
              className="w-full"
            >
              Limpar Ponto
            </Button>
          </div>
        </div>
      )}

      {/* Attendant indicators */}
      {atendentesOrdenados.length > 0 && showOverlays && (
        <div className="absolute z-[1000] bottom-4 left-4 ml-[60px] bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 max-w-sm">
          <h4 className="text-base font-semibold mb-4 text-center">Parceiros por Atendente</h4>
          <div className="space-y-3">
            {atendentesOrdenados.map(([nome, { count, foto_perfil_url }]) => (
              <div key={nome} className="flex items-center gap-4 bg-muted/50 rounded-lg p-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={foto_perfil_url} alt={nome} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{nome}</p>
                  <Badge variant="secondary" className="h-5 text-sm mt-1">
                    {count} parceiros
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State indicators */}
      {estadosOrdenados.length > 0 && showOverlays && (
        <div className="absolute z-[1000] top-[100px] right-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 max-w-md">
          <h4 className="text-lg font-semibold mb-4 text-center">Parceiros por Estado</h4>
          <div className="space-y-3 text-sm">
            {estadosOrdenados.map(({ estado, total, tipos }) => (
              <div key={estado} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-base">{estado}</span>
                  <Badge variant="secondary" className="h-6 text-sm px-2">
                    {total}
                  </Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(tipos).map(([tipo, count]) => (
                    <Badge 
                      key={tipo}
                      variant="outline" 
                      className="h-5 text-xs px-2"
                      style={{
                        borderColor: getMarkerColorByTipo(tipo as TipoParceiro) + '60',
                        color: getMarkerColorByTipo(tipo as TipoParceiro)
                      }}
                    >
                      {count} {TIPO_PARCEIRO_LABELS[tipo as TipoParceiro].toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border text-center">
            <span className="text-sm text-muted-foreground">
              Total: {autorizados.filter(a => a.ativo).length} parceiros
            </span>
          </div>
        </div>
      )}

      <MapContainer
        ref={mapRef}
        center={[-14.235, -51.9253]} // Center of Brazil
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        className="leaflet-container"
      >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler />
          
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            maxClusterRadius={50}
          >
            {autorizadosWithCoords.map((autorizado) => (
              <Marker
                key={autorizado.id}
                position={[autorizado.latitude!, autorizado.longitude!]}
                icon={createPartnerIcon(autorizado.tipo_parceiro)}
              >
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
                       {autorizado.vendedor && (
                         <div className="flex items-center gap-2">
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
                         </div>
                       )}
                       
                       {autorizado.responsavel && (
                         <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span>{autorizado.responsavel}</span>
                         </div>
                       )}
                      
                      {autorizado.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{autorizado.telefone}</span>
                        </div>
                      )}
                      
                      {autorizado.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{autorizado.email}</span>
                        </div>
                      )}
                      
                      {autorizado.endereco && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="leading-tight">
                            {autorizado.endereco}
                            {autorizado.cidade && `, ${autorizado.cidade}`}
                            {autorizado.estado && ` - ${autorizado.estado}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {autorizado.whatsapp && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`https://wa.me/55${autorizado.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                        >
                          WhatsApp
                        </Button>
                      )}
                      {autorizado.telefone && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`tel:${autorizado.telefone}`, '_blank')}
                        >
                          Ligar
                        </Button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {/* Instalações markers (not clustered) */}
          {instalacoesWithCoords.map((instalacao) => (
            <Marker
              key={`instalacao-${instalacao.id}`}
              position={[instalacao.latitude!, instalacao.longitude!]}
              icon={createInstalacaoIcon()}
            >
              <Popup className="custom-popup" minWidth={250}>
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
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
                    {instalacao.tamanho && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tamanho:</span>
                        <span className="font-medium">{instalacao.tamanho}</span>
                      </div>
                    )}
                    {instalacao.geocode_precision && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">{instalacao.geocode_precision}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Clicked point marker */}
          {clickedPoint && (
            <>
              <Marker
                position={[clickedPoint.lat, clickedPoint.lng]}
                icon={createClickedPointIcon()}
              />
              
              {/* Polylines to nearest autorizados */}
              {clickedPoint.nearestAutorizados.map((autorizado, index) => (
                <Polyline
                  key={autorizado.id}
                  positions={[
                    [clickedPoint.lat, clickedPoint.lng],
                    [autorizado.latitude!, autorizado.longitude!]
                  ]}
                  color={index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : '#ef4444'}
                  weight={3}
                  opacity={0.7}
                  dashArray={index === 0 ? undefined : "5, 10"}
                />
              ))}
            </>
          )}
        </MapContainer>
    </div>
  );
};

export default AutorizadosMapLeaflet;