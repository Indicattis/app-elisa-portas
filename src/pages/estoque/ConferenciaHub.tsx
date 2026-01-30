import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Play, Clock, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConferenciaEstoque } from "@/hooks/useConferenciaEstoque";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatTempo(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  }
  if (minutos > 0) {
    return `${minutos}m ${segs}s`;
  }
  return `${segs}s`;
}

interface ConferenciaHubProps {
  returnPath?: string;
  executionBasePath?: string;
}

export default function ConferenciaHub({ 
  returnPath = "/estoque", 
  executionBasePath = "/estoque/conferencia" 
}: ConferenciaHubProps) {
  const navigate = useNavigate();
  const {
    conferenciasEmAndamento,
    loadingConferencias,
    iniciarConferencia,
    iniciando,
  } = useConferenciaEstoque();

  const handleIniciarNova = async () => {
    const conferencia = await iniciarConferencia();
    if (conferencia) {
      navigate(`${executionBasePath}/${conferencia.id}`);
    }
  };

  const handleRetomar = (conferenciaId: string) => {
    navigate(`${executionBasePath}/${conferenciaId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(returnPath)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Conferência de Estoque</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie e execute conferências do estoque da fábrica
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Ações principais */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={handleIniciarNova}
            disabled={iniciando || conferenciasEmAndamento.length > 0}
            className="w-full sm:w-auto h-14 sm:h-10"
          >
            <Plus className="h-5 w-5 mr-2" />
            {iniciando 
              ? "Iniciando..." 
              : conferenciasEmAndamento.length > 0 
                ? "Conferência em andamento" 
                : "Iniciar Nova Conferência"
            }
          </Button>
        </div>

        {/* Conferências em andamento */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Conferências em Andamento
          </h2>

          {loadingConferencias ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : conferenciasEmAndamento.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma conferência em andamento</p>
                  <p className="text-sm mt-1">
                    Clique em "Iniciar Nova Conferência" para começar
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conferenciasEmAndamento.map((conferencia) => {
                const progresso = conferencia.total_itens > 0
                  ? (conferencia.itens_conferidos / conferencia.total_itens) * 100
                  : 0;

                return (
                  <Card key={conferencia.id} className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={conferencia.usuario?.foto_perfil_url || undefined} 
                              alt={conferencia.usuario?.nome || "Usuário"} 
                            />
                            <AvatarFallback>
                              {conferencia.usuario?.nome 
                                ? conferencia.usuario.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                                : <User className="h-4 w-4" />
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              Conferência #{conferencia.id.substring(0, 8)}
                            </CardTitle>
                            <CardDescription>
                              {conferencia.usuario?.nome || "Usuário"} •{" "}
                              {format(new Date(conferencia.iniciada_em), "dd/MM 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={conferencia.pausada ? "secondary" : "default"}>
                          {conferencia.pausada ? "Pausada" : "Em andamento"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">
                            {conferencia.itens_conferidos} de {conferencia.total_itens} itens
                          </span>
                        </div>
                        <Progress value={progresso} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tempo acumulado</span>
                        <span className="font-mono">
                          {formatTempo(conferencia.tempo_acumulado_segundos)}
                        </span>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleRetomar(conferencia.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {conferencia.pausada ? "Retomar" : "Continuar"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
