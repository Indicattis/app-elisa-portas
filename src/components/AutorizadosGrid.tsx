import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Eye, Pencil, Trash2 } from "lucide-react";
import { ETAPAS_AUTORIZADO, ETAPA_COLORS } from "@/utils/etapas";
import type { AutorizadoPerformance } from "@/hooks/useAutorizadosPerformance";

interface AutorizadosGridProps {
  autorizados: AutorizadoPerformance[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AutorizadosGrid({ autorizados, onView, onEdit, onDelete }: AutorizadosGridProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {autorizados.map((autorizado) => (
        <Card key={autorizado.id} className="hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <Avatar className="h-12 w-12">
                {autorizado.logo_url ? (
                  <AvatarImage src={autorizado.logo_url} alt={autorizado.nome} />
                ) : (
                  <AvatarFallback>{getInitials(autorizado.nome)}</AvatarFallback>
                )}
              </Avatar>
              {autorizado.etapa === 'premium' && (
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <CardTitle className="text-lg">{autorizado.nome}</CardTitle>
            <CardDescription>
              {autorizado.cidade}, {autorizado.estado}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <Badge 
              style={{ 
                backgroundColor: ETAPA_COLORS[autorizado.etapa],
                color: 'white'
              }}
            >
              {ETAPAS_AUTORIZADO[autorizado.etapa]}
            </Badge>
            {autorizado.vendedor && (
              <div className="flex items-center gap-2 mt-3">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={autorizado.vendedor.foto_perfil_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(autorizado.vendedor.nome)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {autorizado.vendedor.nome}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="gap-2 pt-3">
            <Button variant="ghost" size="sm" onClick={() => onView(autorizado.id)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(autorizado.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(autorizado.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
