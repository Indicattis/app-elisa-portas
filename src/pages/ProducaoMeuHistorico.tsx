import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Clock, Trophy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMeuHistoricoProducao, OrdemHistorico } from "@/hooks/useMeuHistoricoProducao";
import { HistoricoOrdemDetalhesSheet } from "@/components/production/HistoricoOrdemDetalhesSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PeriodoType = 'hoje' | 'semana' | 'mes' | 'todos';
type SetorType = 'todos' | 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

const SETOR_LABELS: Record<string, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
};

const SETOR_COLORS: Record<string, string> = {
  soldagem: 'bg-orange-500',
  perfiladeira: 'bg-blue-500',
  separacao: 'bg-green-500',
  qualidade: 'bg-purple-500',
  pintura: 'bg-yellow-500',
};

function formatTempo(segundos: number | null): string {
  if (!segundos) return '-';
  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  if (minutos < 60) {
    return `${minutos}min ${segs}s`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas}h ${mins}min`;
}

export default function ProducaoMeuHistorico() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<PeriodoType>('mes');
  const [setor, setSetor] = useState<SetorType>('todos');
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemHistorico | null>(null);

  const { data: ordens = [], isLoading } = useMeuHistoricoProducao({ periodo, setor });

  // Calcular estatísticas
  const totalOrdens = ordens.length;
  const tempoMedio = totalOrdens > 0
    ? Math.round(ordens.reduce((acc, o) => acc + (o.tempo_conclusao_segundos || 0), 0) / totalOrdens)
    : 0;

  const ordensPorSetor = ordens.reduce((acc, o) => {
    acc[o.setor] = (acc[o.setor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/producao')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5" />
            Meu Histórico
          </h1>
          <p className="text-sm text-muted-foreground">
            Ordens de produção que você concluiu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOrdens}</p>
              <p className="text-xs text-muted-foreground">Ordens concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatTempo(tempoMedio)}</p>
              <p className="text-xs text-muted-foreground">Tempo médio</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Por setor</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(ordensPorSetor).map(([s, count]) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {SETOR_LABELS[s]}: {count}
                </Badge>
              ))}
              {Object.keys(ordensPorSetor).length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhuma ordem</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoType)}>
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Setores</SelectItem>
                <SelectItem value="soldagem">Soldagem</SelectItem>
                <SelectItem value="perfiladeira">Perfiladeira</SelectItem>
                <SelectItem value="separacao">Separação</SelectItem>
                <SelectItem value="qualidade">Qualidade</SelectItem>
                <SelectItem value="pintura">Pintura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ordens Concluídas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando histórico...
            </div>
          ) : ordens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma ordem encontrada no período selecionado.
            </div>
          ) : (
            <div className="divide-y">
              {ordens.map((ordem) => (
                <div
                  key={`${ordem.setor}-${ordem.id}`}
                  className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setOrdemSelecionada(ordem)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">#{ordem.numero_ordem}</span>
                        <Badge className={`${SETOR_COLORS[ordem.setor]} text-white text-xs`}>
                          {SETOR_LABELS[ordem.setor]}
                        </Badge>
                      </div>
                      {(ordem.cliente_nome || (ordem.cores && ordem.cores.length > 0)) && (
                        <div className="flex items-center gap-2 mt-1">
                          {ordem.cliente_nome && (
                            <p className="text-sm text-muted-foreground truncate">
                              {ordem.cliente_nome}
                            </p>
                          )}
                          {ordem.cores && ordem.cores.length > 0 && (
                            <div className="flex items-center gap-1">
                              {ordem.cores.map((cor) => (
                                <div
                                  key={cor.nome}
                                  className="h-4 w-4 rounded-full border-2 border-border shadow-sm shrink-0"
                                  style={{ backgroundColor: cor.codigo_hex }}
                                  title={cor.nome}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="text-muted-foreground">
                        {format(new Date(ordem.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ordem.data_conclusao), "HH:mm", { locale: ptBR })}
                      </p>
                      {ordem.tempo_conclusao_segundos && (
                        <p className="text-xs font-medium text-primary">
                          ⏱️ {formatTempo(ordem.tempo_conclusao_segundos)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <HistoricoOrdemDetalhesSheet
        ordem={ordemSelecionada}
        open={!!ordemSelecionada}
        onOpenChange={(open) => { if (!open) setOrdemSelecionada(null); }}
      />
    </div>
  );
}
