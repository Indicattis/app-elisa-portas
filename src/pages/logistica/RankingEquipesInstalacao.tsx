import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useRankingEquipesInstalacao, PeriodoFiltro } from "@/hooks/useRankingEquipesInstalacao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Calendar, CalendarDays, CalendarRange, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const periodosOptions: { value: PeriodoFiltro; label: string; icon: React.ElementType }[] = [
  { value: 'mes', label: 'Este Mês', icon: Calendar },
  { value: 'ano', label: 'Este Ano', icon: CalendarDays },
  { value: 'todos', label: 'Todo Período', icon: CalendarRange },
];

function getMedalColor(posicao: number): string {
  switch (posicao) {
    case 1: return '#FFD700'; // Ouro
    case 2: return '#C0C0C0'; // Prata
    case 3: return '#CD7F32'; // Bronze
    default: return 'transparent';
  }
}

function getMedalIcon(posicao: number) {
  if (posicao <= 3) {
    return (
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: getMedalColor(posicao) }}
      >
        {posicao === 1 ? (
          <Trophy className="w-5 h-5 text-white" />
        ) : (
          <Medal className="w-5 h-5 text-white" />
        )}
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
      <span className="text-white/60 font-bold">{posicao}º</span>
    </div>
  );
}

export default function RankingEquipesInstalacao() {
  const { ranking, loading, periodo, setPeriodo, maxInstalacoes } = useRankingEquipesInstalacao();

  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Logística', path: '/logistica' },
    { label: 'Instalações', path: '/logistica/instalacoes' },
    { label: 'Ranking Equipes' }
  ];

  return (
    <MinimalistLayout
      title="Ranking de Equipes"
      subtitle="Desempenho das equipes de instalação"
      backPath="/logistica/instalacoes"
      breadcrumbItems={breadcrumbItems}
    >
      {/* Filtros de Período */}
      <div className="mb-6">
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 inline-flex gap-1">
          {periodosOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = periodo === opt.value;
            return (
              <Button
                key={opt.value}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodo(opt.value)}
                className={`gap-2 ${isActive 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Lista Vazia */}
      {!loading && ranking.length === 0 && (
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">Nenhuma instalação concluída neste período</p>
          </div>
        </div>
      )}

      {/* Ranking Cards */}
      {!loading && ranking.length > 0 && (
        <div className="space-y-3">
          {ranking.map((equipe, index) => {
            const posicao = index + 1;
            const progressPercent = maxInstalacoes > 0 
              ? (equipe.quantidade_instalacoes / maxInstalacoes) * 100 
              : 0;
            
            return (
              <div 
                key={equipe.equipe_id}
                className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <Card 
                  className="bg-transparent border-0 shadow-none"
                  style={{
                    borderLeft: equipe.equipe_cor ? `4px solid ${equipe.equipe_cor}` : undefined
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Medalha/Posição */}
                      {getMedalIcon(posicao)}

                      {/* Info da Equipe */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold truncate">
                            {equipe.equipe_nome}
                          </h3>
                          {equipe.equipe_cor && (
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: equipe.equipe_cor }}
                            />
                          )}
                        </div>
                        
                        {/* Barra de Progresso */}
                        <div className="mb-2">
                          <Progress 
                            value={progressPercent} 
                            className="h-2 bg-white/10"
                          />
                        </div>

                        {/* Métricas */}
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>
                            <strong className="text-white">{equipe.quantidade_instalacoes}</strong> instalações
                          </span>
                          {equipe.metragem_total > 0 && (
                            <span>
                              <strong className="text-white">{equipe.metragem_total.toFixed(1)}</strong> m²
                            </span>
                          )}
                          {equipe.ultima_instalacao && (
                            <span className="hidden sm:inline">
                              Última: {format(new Date(equipe.ultima_instalacao), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badge de Quantidade */}
                      <div className="flex-shrink-0">
                        <div 
                          className="px-4 py-2 rounded-lg font-bold text-lg text-white"
                          style={{ 
                            backgroundColor: equipe.equipe_cor || '#3B82F6',
                            opacity: 0.9
                          }}
                        >
                          {equipe.quantidade_instalacoes}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </MinimalistLayout>
  );
}
