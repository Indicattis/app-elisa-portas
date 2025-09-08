import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Phone, Mail, User, Navigation, X } from 'lucide-react';

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
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface AutorizadosMapLeafletProps {
  autorizados: Autorizado[];
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

const AutorizadosMapLeaflet: React.FC<AutorizadosMapLeafletProps> = ({ autorizados }) => {
  const mapRef = useRef<L.Map | null>(null);
  const [clickedPoint, setClickedPoint] = useState<ClickedPoint | null>(null);

  // Filter autorizados with valid coordinates
  const autorizadosWithCoords = autorizados.filter(
    autorizado => 
      autorizado.latitude && 
      autorizado.longitude && 
      autorizado.ativo
  );

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
    // Add custom CSS for clusters
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

  if (autorizadosWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhum autorizado com localização</h3>
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
                        <Badge variant="secondary" className="mt-1">
                          Autorizado Elisa
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