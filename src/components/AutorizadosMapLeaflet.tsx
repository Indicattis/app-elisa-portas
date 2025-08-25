import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Phone, Mail, User } from 'lucide-react';

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
}

interface AutorizadosMapLeafletProps {
  autorizados: Autorizado[];
}

const AutorizadosMapLeaflet: React.FC<AutorizadosMapLeafletProps> = ({ autorizados }) => {
  const mapRef = useRef<L.Map | null>(null);

  // Filter autorizados with valid coordinates
  const autorizadosWithCoords = autorizados.filter(
    autorizado => 
      autorizado.latitude && 
      autorizado.longitude && 
      autorizado.ativo
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    return L.divIcon({
      html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
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
      <div className="flex items-center justify-center h-[600px] bg-muted/50 rounded-lg">
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
    <div className="h-[600px] w-full rounded-lg overflow-hidden border">
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
      </MapContainer>
    </div>
  );
};

export default AutorizadosMapLeaflet;