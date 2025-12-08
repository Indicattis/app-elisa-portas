import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, MapPin, Clock, User, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstalacoesMinhaEquipe } from "@/hooks/useInstalacoesMinhaEquipe";
import { Skeleton } from "@/components/ui/skeleton";

export function ListaInstalacoesEquipe() {
  const { data, isLoading } = useInstalacoesMinhaEquipe();

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { instalacoes, equipe } = data || { instalacoes: [], equipe: null };

  if (!equipe) {
    return null; // Usuário não está em nenhuma equipe
  }

  return (
    <Card 
      className="border-2" 
      style={{ borderColor: equipe.cor || 'hsl(var(--border))' }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: equipe.cor || '#888' }}
          />
          <span>Minhas Instalações - {equipe.nome}</span>
          <Badge variant="outline" className="ml-auto">
            {instalacoes.length} pendente{instalacoes.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {instalacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-lg font-bold text-foreground">
              Missão cumprida soldado!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhuma instalação pendente para sua equipe
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {instalacoes.map((instalacao) => (
              <div
                key={instalacao.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div 
                  className="flex-shrink-0 w-1 h-full min-h-[60px] rounded-full"
                  style={{ backgroundColor: equipe.cor || '#888' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {instalacao.nome_cliente}
                  </p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    {instalacao.data_instalacao && (
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="h-3.5 w-3.5" />
                        {format(new Date(instalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                    
                    {instalacao.hora && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {instalacao.hora}
                      </span>
                    )}
                    
                    {instalacao.venda?.cidade && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {instalacao.venda.cidade}
                      </span>
                    )}
                  </div>
                </div>

                {instalacao.tipo_instalacao && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    {instalacao.tipo_instalacao}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
