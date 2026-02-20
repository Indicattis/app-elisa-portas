import { useState } from "react";
import { History, Clock, Trophy, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMeuHistoricoMinimalista } from "@/hooks/useMeuHistoricoMinimalista";
import { HistoricoOrdemDetalhesSheet } from "@/components/production/HistoricoOrdemDetalhesSheet";
import { MinimalistLayout } from "@/components/MinimalistLayout";
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

export default function MeuHistoricoMinimalista() {
  const [periodo, setPeriodo] = useState<PeriodoType>('mes');
  const [setor, setSetor] = useState<SetorType>('todos');
  const [ordemSelecionada, setOrdemSelecionada] = useState<any | null>(null);

  const { data: ordens = [], isLoading } = useMeuHistoricoMinimalista({ periodo, setor });

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
    <MinimalistLayout 
      title="Meu Histórico" 
      subtitle="Ordens de produção que você concluiu"
      backPath="/fabrica/producao"
    >
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Trophy className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalOrdens}</p>
              <p className="text-xs text-white/60">Ordens concluídas</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatTempo(tempoMedio)}</p>
              <p className="text-xs text-white/60">Tempo médio</p>
            </div>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <p className="text-xs text-white/60 mb-2">Por setor</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(ordensPorSetor).map(([s, count]) => (
              <Badge key={s} className="bg-white/10 text-white/80 text-xs border-white/20">
                {SETOR_LABELS[s]}: {count}
              </Badge>
            ))}
            {Object.keys(ordensPorSetor).length === 0 && (
              <span className="text-sm text-white/40">Nenhuma ordem</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xl mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-white/40" />
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoType)}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
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
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
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
      </div>

      {/* Lista de Ordens */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden">
        <div className="p-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <History className="h-4 w-4" />
            Ordens Concluídas
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-white/40">
            Carregando histórico...
          </div>
        ) : ordens.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            Nenhuma ordem encontrada no período selecionado.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {ordens.map((ordem) => (
              <div
                key={`${ordem.setor}-${ordem.id}`}
                className="p-3 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => setOrdemSelecionada(ordem)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">#{ordem.numero_ordem}</span>
                      <Badge className={`${SETOR_COLORS[ordem.setor]} text-white text-xs`}>
                        {SETOR_LABELS[ordem.setor]}
                      </Badge>
                    </div>
                    {ordem.cliente_nome && (
                      <p className="text-sm text-white/60 truncate mt-1">
                        {ordem.cliente_nome}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="text-white/60">
                      {format(new Date(ordem.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-white/40">
                      {format(new Date(ordem.data_conclusao), "HH:mm", { locale: ptBR })}
                    </p>
                    {ordem.tempo_conclusao_segundos && (
                      <p className="text-xs font-medium text-blue-400">
                        ⏱️ {formatTempo(ordem.tempo_conclusao_segundos)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <HistoricoOrdemDetalhesSheet
        ordem={ordemSelecionada}
        open={!!ordemSelecionada}
        onOpenChange={(open) => { if (!open) setOrdemSelecionada(null); }}
      />
    </MinimalistLayout>
  );
}
