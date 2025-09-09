import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, User, Phone, Mail, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ETAPAS, ETAPA_COLORS, ETAPA_ORDER, AutorizadoEtapa } from "@/utils/etapas";
import { StarRating } from "./StarRating";
import { AddRatingDialog } from "./AddRatingDialog";

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
  etapa: AutorizadoEtapa;
  average_rating?: number;
  total_ratings?: number;
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface AutorizadosKanbanProps {
  autorizados: Autorizado[];
  onEtapaChange: (autorizadoId: string, novaEtapa: AutorizadoEtapa) => void;
  onShowHistory: (autorizado: Autorizado) => void;
}

export function AutorizadosKanban({ autorizados, onEtapaChange, onShowHistory }: AutorizadosKanbanProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<AutorizadoEtapa | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDragStart = (e: React.DragEvent, autorizadoId: string) => {
    setDraggedItem(autorizadoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
  };

  const handleDragOver = (e: React.DragEvent, etapa: AutorizadoEtapa) => {
    e.preventDefault();
    setDraggedOver(etapa);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = async (e: React.DragEvent, novaEtapa: AutorizadoEtapa) => {
    e.preventDefault();
    if (!draggedItem) return;

    const autorizado = autorizados.find(a => a.id === draggedItem);
    if (!autorizado || autorizado.etapa === novaEtapa) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    try {
      await supabase
        .from('autorizados')
        .update({ etapa: novaEtapa })
        .eq('id', draggedItem);

      // Invalidate the query cache to refresh the data immediately
      queryClient.invalidateQueries({ queryKey: ['autorizados-with-ratings'] });
      
      onEtapaChange(draggedItem, novaEtapa);
      
      toast({
        title: 'Sucesso',
        description: `${autorizado.nome} movido para ${ETAPAS[novaEtapa]}`
      });
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao mover autorizado'
      });
    }

    setDraggedItem(null);
    setDraggedOver(null);
  };

  const getAutorizadosPorEtapa = (etapa: AutorizadoEtapa) => {
    return autorizados.filter(autorizado => autorizado.etapa === etapa);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {ETAPA_ORDER.map((etapa) => {
        const autorizadosEtapa = getAutorizadosPorEtapa(etapa);
        const isDraggedOver = draggedOver === etapa;
        
        return (
          <div
            key={etapa}
            className={`flex-shrink-0 w-72 ${isDraggedOver ? 'bg-accent/50 rounded-lg' : ''}`}
            onDragOver={(e) => handleDragOver(e, etapa)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, etapa)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span style={{ color: ETAPA_COLORS[etapa] }}>
                    {ETAPAS[etapa]}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {autorizadosEtapa.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {autorizadosEtapa.map((autorizado) => (
                  <div
                    key={autorizado.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, autorizado.id)}
                    onDragEnd={handleDragEnd}
                    onDoubleClick={() => onShowHistory(autorizado)}
                    className={`p-3 rounded-lg border bg-card cursor-move hover:shadow-md transition-shadow ${
                      draggedItem === autorizado.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={autorizado.logo_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(autorizado.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{autorizado.nome}</p>
                          {autorizado.responsavel && (
                            <p className="text-xs text-muted-foreground">{autorizado.responsavel}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/autorizados/${autorizado.id}/edit`)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>

                    {autorizado.vendedor && (
                      <div className="flex items-center space-x-2 mb-2">
                        {autorizado.vendedor.foto_perfil_url ? (
                          <img
                            src={autorizado.vendedor.foto_perfil_url}
                            alt={autorizado.vendedor.nome}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">{autorizado.vendedor.nome}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {autorizado.email && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {autorizado.email}
                        </div>
                      )}
                      {autorizado.telefone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {autorizado.telefone}
                        </div>
                      )}
                      {autorizado.cidade && autorizado.estado && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {autorizado.cidade}, {autorizado.estado}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {autorizado.average_rating ? (
                          <StarRating 
                            rating={autorizado.average_rating} 
                            showValue 
                            size={12} 
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem avaliações</span>
                        )}
                        {autorizado.total_ratings && autorizado.total_ratings > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({autorizado.total_ratings})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <AddRatingDialog autorizadoId={autorizado.id} autorizadoNome={autorizado.nome}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Star className="h-3 w-3" />
                          </Button>
                        </AddRatingDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/autorizados/${autorizado.id}/edit`)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}