import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useHistoricoColaborador, useColaboradorInfo, OrdemHistoricoColaborador } from "@/hooks/useHistoricoColaborador";

type PeriodoType = 'hoje' | 'semana' | 'mes' | 'todos';
type SetorType = 'todos' | 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

function formatarTempo(segundos: number | null): string {
  if (!segundos || segundos <= 0) return '--';
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}h ${minutos}min`;
  }
  if (minutos > 0) {
    return `${minutos}min ${segs}s`;
  }
  return `${segs}s`;
}

function getSetorConfig(setor: string) {
  const configs: Record<string, { label: string; bgColor: string; textColor: string }> = {
    soldagem: { label: 'Solda', bgColor: 'bg-orange-500', textColor: 'text-white' },
    perfiladeira: { label: 'Perfil', bgColor: 'bg-blue-500', textColor: 'text-white' },
    separacao: { label: 'Sep.', bgColor: 'bg-purple-500', textColor: 'text-white' },
    qualidade: { label: 'Qual.', bgColor: 'bg-green-500', textColor: 'text-white' },
    pintura: { label: 'Pint.', bgColor: 'bg-pink-500', textColor: 'text-white' },
  };
  return configs[setor] || { label: setor, bgColor: 'bg-gray-500', textColor: 'text-white' };
}

interface OrdemItemProps {
  ordem: OrdemHistoricoColaborador;
}

function OrdemItem({ ordem }: OrdemItemProps) {
  const config = getSetorConfig(ordem.setor);
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
      <Badge className={`${config.bgColor} ${config.textColor} text-[9px] px-1.5 py-0.5 min-w-[40px] text-center`}>
        {config.label}
      </Badge>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{ordem.numero_ordem}</p>
        {ordem.cliente_nome && (
          <p className="text-xs text-muted-foreground truncate">{ordem.cliente_nome}</p>
        )}
      </div>
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{format(new Date(ordem.data_conclusao), "dd/MM HH:mm", { locale: ptBR })}</span>
      </div>
      
      <div className="flex items-center gap-1 text-sm font-medium min-w-[70px] justify-end">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{formatarTempo(ordem.tempo_conclusao_segundos)}</span>
      </div>
    </div>
  );
}

export default function ColaboradorDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [periodo, setPeriodo] = useState<PeriodoType>('mes');
  const [setor, setSetor] = useState<SetorType>('todos');
  
  const { data: colaborador, isLoading: loadingColaborador } = useColaboradorInfo(id || '');
  const { data: ordens = [], isLoading: loadingOrdens } = useHistoricoColaborador({
    userId: id || '',
    periodo,
    setor,
  });

  const iniciais = colaborador?.nome
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {loadingColaborador ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={colaborador?.foto_perfil_url || undefined} alt={colaborador?.nome} />
                  <AvatarFallback className="text-sm">{iniciais}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold">{colaborador?.nome}</h1>
                  {colaborador?.setor && (
                    <p className="text-sm text-muted-foreground capitalize">{colaborador.setor}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoType)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={setor} onValueChange={(v) => setSetor(v as SetorType)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Setores</SelectItem>
                <SelectItem value="soldagem">Solda</SelectItem>
                <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
                <SelectItem value="separacao">Separação</SelectItem>
                <SelectItem value="qualidade">Qualidade</SelectItem>
                <SelectItem value="pintura">Pintura</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="ml-auto text-sm text-muted-foreground">
              {ordens.length} ordens concluídas
            </div>
          </div>
        </Card>

        {/* Orders List */}
        <Card className="p-4">
          <h2 className="text-sm font-medium mb-4">Ordens Concluídas</h2>
          
          {loadingOrdens ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : ordens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma ordem concluída neste período</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ordens.map((ordem) => (
                <OrdemItem key={ordem.id} ordem={ordem} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
