import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star } from "lucide-react";
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
  onDoubleClick?: (autorizado: Autorizado) => void;
}

export function AutorizadosKanban({ autorizados, onEtapaChange, onShowHistory, onDoubleClick }: AutorizadosKanbanProps) {
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
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto kanban-scroll">
                {autorizadosEtapa.map((autorizado) => (
                  <div
                    key={autorizado.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, autorizado.id)}
                    onDragEnd={handleDragEnd}
                    onDoubleClick={() => onDoubleClick?.(autorizado)}
                    className={`p-3 rounded-lg border bg-card cursor-move hover:shadow-md hover-scale transition-all duration-200 animate-fade-in ${
                      draggedItem === autorizado.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    {/* Header with logo and name */}
                    <div className="flex items-center space-x-3 mb-2">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={autorizado.logo_url} />
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(autorizado.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{autorizado.nome}</p>
                        {autorizado.responsavel && (
                          <p className="text-xs text-muted-foreground truncate">{autorizado.responsavel}</p>
                        )}
                      </div>
                    </div>

                    {/* City */}
                    {autorizado.cidade && (
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {autorizado.cidade}{autorizado.estado && `, ${autorizado.estado}`}
                        </span>
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
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
                      <AddRatingDialog autorizadoId={autorizado.id} autorizadoNome={autorizado.nome}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-70 hover:opacity-100">
                          <Star className="h-3 w-3" />
                        </Button>
                      </AddRatingDialog>
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