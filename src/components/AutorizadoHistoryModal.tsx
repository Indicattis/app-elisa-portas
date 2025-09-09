import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, MapPin, Phone, Mail, Star } from "lucide-react";
import { ETAPAS } from "@/utils/etapas";
import { StarRating } from "./StarRating";
import { useAutorizadosRatings } from "@/hooks/useAutorizadosRatings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  etapa: string;
  average_rating?: number;
  total_ratings?: number;
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface AutorizadoHistoryModalProps {
  autorizado: Autorizado | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AutorizadoHistoryModal({ autorizado, isOpen, onClose }: AutorizadoHistoryModalProps) {
  const { ratings, isLoading: loadingRatings } = useAutorizadosRatings(autorizado?.id);

  if (!autorizado) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={autorizado.logo_url} />
              <AvatarFallback>
                {getInitials(autorizado.nome)}
              </AvatarFallback>
            </Avatar>
            Histórico - {autorizado.nome}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Informações Gerais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Gerais
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant={autorizado.ativo ? "default" : "secondary"} className="ml-2">
                    {autorizado.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Etapa:</span>
                  <Badge variant="outline" className="ml-2">
                    {ETAPAS[autorizado.etapa as keyof typeof ETAPAS] || autorizado.etapa}
                  </Badge>
                </div>
                {autorizado.responsavel && (
                  <div>
                    <span className="font-medium">Responsável:</span>
                    <span className="ml-2">{autorizado.responsavel}</span>
                  </div>
                )}
                {autorizado.vendedor && (
                  <div className="flex items-center">
                    <span className="font-medium">Vendedor:</span>
                    <div className="flex items-center ml-2 gap-2">
                      {autorizado.vendedor.foto_perfil_url ? (
                        <img
                          src={autorizado.vendedor.foto_perfil_url}
                          alt={autorizado.vendedor.nome}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span>{autorizado.vendedor.nome}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contato */}
              {(autorizado.email || autorizado.telefone || autorizado.whatsapp) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Contato</h4>
                  {autorizado.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {autorizado.email}
                    </div>
                  )}
                  {autorizado.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {autorizado.telefone}
                    </div>
                  )}
                  {autorizado.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      WhatsApp: {autorizado.whatsapp}
                    </div>
                  )}
                </div>
              )}

              {/* Endereço */}
              {(autorizado.endereco || autorizado.cidade || autorizado.estado) && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </h4>
                  <div className="text-sm space-y-1">
                    {autorizado.endereco && <div>{autorizado.endereco}</div>}
                    {(autorizado.cidade || autorizado.estado) && (
                      <div>
                        {autorizado.cidade}{autorizado.cidade && autorizado.estado && ', '}{autorizado.estado}
                      </div>
                    )}
                    {autorizado.cep && <div>CEP: {autorizado.cep}</div>}
                    {autorizado.regiao && <div>Região: {autorizado.regiao}</div>}
                  </div>
                  {(autorizado.latitude && autorizado.longitude) && (
                    <div className="text-sm text-muted-foreground">
                      Coordenadas: {autorizado.latitude.toFixed(6)}, {autorizado.longitude.toFixed(6)}
                      {autorizado.last_geocoded_at && (
                        <div>Geocodificado em: {formatDate(autorizado.last_geocoded_at)}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Avaliações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5" />
                Avaliações
                {autorizado.average_rating && (
                  <div className="flex items-center gap-2 ml-2">
                    <StarRating rating={autorizado.average_rating} showValue size={16} />
                    <span className="text-sm text-muted-foreground">
                      ({autorizado.total_ratings} avaliação{autorizado.total_ratings !== 1 ? 'ões' : ''})
                    </span>
                  </div>
                )}
              </h3>
              
              {loadingRatings ? (
                <div className="text-sm text-muted-foreground">Carregando avaliações...</div>
              ) : ratings.length > 0 ? (
                <div className="space-y-3">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarRating rating={rating.nota} size={14} />
                          <Badge variant="outline" className="text-xs">
                            {rating.categoria}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(rating.created_at)}
                        </span>
                      </div>
                      {rating.descricao && (
                        <p className="text-sm">{rating.descricao}</p>
                      )}
                      {(rating as any).atendente && (
                        <div className="text-xs text-muted-foreground">
                          Por: {(rating as any).atendente.nome}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Nenhuma avaliação encontrada.</div>
              )}
            </div>

            <Separator />

            {/* Histórico de Registro */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico de Registro
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Registro criado</div>
                    <div className="text-sm text-muted-foreground">
                      Autorizado cadastrado no sistema
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(autorizado.created_at)}
                  </div>
                </div>
                
                {autorizado.updated_at !== autorizado.created_at && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Última atualização</div>
                      <div className="text-sm text-muted-foreground">
                        Dados do autorizado foram modificados
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(autorizado.updated_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}