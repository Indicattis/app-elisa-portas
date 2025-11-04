import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star as StarIcon, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getEtapasByTipo, getCurrentEtapa, type TipoParceiro } from "@/utils/parceiros";

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
  representante_etapa?: string;
  franqueado_etapa?: string;
  tipo_parceiro: TipoParceiro;
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface AutorizadosKanbanProps {
  autorizados: Autorizado[];
  tipoParceiro: TipoParceiro;
  onEtapaChange: (autorizadoId: string, novaEtapa: string) => void;
  onShowHistory: (autorizado: Autorizado) => void;
  onDoubleClick?: (autorizado: Autorizado) => void;
}

export function AutorizadosKanban({ autorizados, tipoParceiro, onEtapaChange, onShowHistory, onDoubleClick }: AutorizadosKanbanProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  // Get dynamic stages based on partner type
  const { etapas, order, colors } = getEtapasByTipo(tipoParceiro);

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

  const handleDragOver = (e: React.DragEvent, etapa: string) => {
    e.preventDefault();
    setDraggedOver(etapa);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = async (e: React.DragEvent, novaEtapa: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const autorizado = autorizados.find(a => a.id === draggedItem);
    const etapaAtual = autorizado ? getCurrentEtapa(autorizado) : null;
    
    if (!autorizado || etapaAtual === novaEtapa) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    try {
      const updateField = tipoParceiro === 'autorizado' ? 'etapa' : 
                         tipoParceiro === 'representante' ? 'representante_etapa' : 
                         'franqueado_etapa';

      // Call the onEtapaChange callback immediately for optimistic update
      onEtapaChange(draggedItem, novaEtapa);

      const { error } = await supabase
        .from('autorizados')
        .update({ [updateField]: novaEtapa })
        .eq('id', draggedItem);

      if (error) throw error;

      // Invalidate the query cache to refresh the data from server
      await queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
      
      toast({
        title: 'Sucesso',
        description: `${autorizado.nome} movido para ${etapas[novaEtapa as keyof typeof etapas]}`
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

  const getAutorizadosPorEtapa = (etapa: string) => {
    return autorizados.filter(autorizado => getCurrentEtapa(autorizado) === etapa);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {order.map((etapa) => {
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
                  <span style={{ color: colors[etapa as keyof typeof colors] }}>
                    {etapas[etapa as keyof typeof etapas]}
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

                    {/* City and Badges */}
                    {autorizado.cidade && (
                      <div className="flex items-center text-xs text-muted-foreground mb-2 flex-wrap gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {autorizado.cidade}{autorizado.estado && `, ${autorizado.estado}`}
                        </span>
                        {(autorizado as any).contrato_url && (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-600 ml-1">
                            <FileText className="h-2 w-2" />
                            <span className="text-xs">Contrato</span>
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Premium Badge */}
                    {getCurrentEtapa(autorizado) === 'premium' && (
                      <div className="flex items-center justify-end pt-1">
                        <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
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