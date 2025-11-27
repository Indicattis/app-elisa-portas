import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWeekend, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Video, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePostagens, usePostagensStats, usePostagensPorDia } from "@/hooks/usePostagens";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function CronogramaPostagens() {
  const hoje = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth());
  const [modalAberto, setModalAberto] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [visualizacao, setVisualizacao] = useState<"mes" | "ano">("mes");

  const { data: postagens = [] } = usePostagens(anoSelecionado);
  const { data: stats } = usePostagensStats(anoSelecionado);
  const { data: postagensDia = [] } = usePostagensPorDia(dataSelecionada || "");

  useEffect(() => {
    document.title = "Cronograma de Postagens - Marketing";
  }, []);

  // Agrupar postagens por data
  const postagensPorData = useMemo(() => {
    const grouped: Record<string, number> = {};
    postagens.forEach((post) => {
      grouped[post.data_postagem] = (grouped[post.data_postagem] || 0) + 1;
    });
    return grouped;
  }, [postagens]);

  const abrirModalParaData = (data: string) => {
    setDataSelecionada(data);
    setModalAberto(true);
  };

  const handlePrevYear = () => setAnoSelecionado((prev) => prev - 1);
  const handleNextYear = () => setAnoSelecionado((prev) => prev + 1);

  const getEstiloIntervalo = (data: Date, numPostagens: number, inMonth: boolean) => {
    const hojeLimpo = new Date();
    hojeLimpo.setHours(0, 0, 0, 0);
    const ehPassado = data < hojeLimpo && !isSameDay(data, hojeLimpo);
    const ehFimDeSemana = isWeekend(data);

    if (!inMonth) {
      return "bg-muted text-muted-foreground opacity-40";
    }

    // Verde: 1+ postagens (meta atingida)
    if (numPostagens >= 1) {
      return "bg-success text-success-foreground";
    }

    // Vermelho: Dia passado sem postagem
    if (ehPassado && !ehFimDeSemana) {
      return "bg-destructive text-destructive-foreground";
    }

    // Cinza: Fim de semana ou futuro
    return "bg-muted text-muted-foreground";
  };

  const renderMes = (mesIndex: number, large = false) => {
    const primeiroDia = new Date(anoSelecionado, mesIndex, 1);
    const mesInicio = startOfMonth(primeiroDia);
    const mesFim = endOfMonth(primeiroDia);

    const inicioGrade = startOfWeek(mesInicio, { weekStartsOn: 0 });
    const fimGrade = endOfWeek(mesFim, { weekStartsOn: 0 });

    const dias: Date[] = [];
    let dia = inicioGrade;
    while (dia <= fimGrade) {
      dias.push(dia);
      dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
    }

    const daySize = large ? 'w-28 h-28 md:w-32 md:h-32' : 'w-20 h-20 md:w-24 md:h-24';

    return (
      <div className="space-y-3" key={mesIndex}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">
            {format(primeiroDia, "LLLL", { locale: ptBR })}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i} className="text-sm font-medium text-muted-foreground text-center">
              {d}
            </div>
          ))}
          {dias.map((d, idx) => {
            const inMonth = isSameMonth(d, primeiroDia);
            const iso = format(d, "yyyy-MM-dd");
            const numPostagens = postagensPorData[iso] || 0;
            const estilo = getEstiloIntervalo(d, numPostagens, inMonth);
            const ehHoje = isSameDay(d, hoje);

            return (
              <div key={idx} className="flex items-center justify-center">
                <button
                  onClick={() => inMonth ? abrirModalParaData(iso) : undefined}
                  disabled={!inMonth}
                  className={`relative ${daySize} rounded-full flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-105 border ${estilo} ${ehHoje ? "ring-2 ring-primary" : ""}`}
                >
                  <span className="text-sm opacity-90">{format(d, "d")}</span>
                  <div className="text-center">
                    <span className="text-sm font-semibold block">
                      {numPostagens > 0 ? `${numPostagens} post${numPostagens > 1 ? 's' : ''}` : "-"}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
          <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            Cronograma de Postagens
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Acompanhamento de postagens nas redes sociais
          </p>
        </div>
        <Button asChild variant="default" size="sm">
          <Link to="/dashboard/marketing/postagens">
            <Video className="w-4 h-4 mr-2" />
            Gerenciar Posts
          </Link>
        </Button>
      </div>

      {/* Navegação e controles */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrevYear} className="hover-scale">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-lg font-semibold">
            {anoSelecionado}
          </div>
          <Button variant="outline" onClick={handleNextYear} className="hover-scale">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={visualizacao === "mes" ? "default" : "outline"}
            size="sm"
            onClick={() => setVisualizacao("mes")}
          >
            Mês
          </Button>
          <Button
            variant={visualizacao === "ano" ? "default" : "outline"}
            size="sm"
            onClick={() => setVisualizacao("ano")}
          >
            Ano
          </Button>
        </div>
      </header>

      {/* Legenda */}
      <Card className="sticky top-16 z-40 bg-background/95 backdrop-blur border-border/50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success" />
              <span className="text-muted-foreground">Meta atingida (1+ posts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Sem postagem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-muted" />
              <span className="text-muted-foreground">Fim de semana / Futuro</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Posts no Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                <span className="text-xl sm:text-2xl font-bold">{stats.total_mes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Posts na Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xl sm:text-2xl font-bold">{stats.total_semana}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Média de Curtidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-xl sm:text-2xl font-bold">{stats.media_curtidas}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Média de Visualizações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-xl sm:text-2xl font-bold">{stats.media_visualizacoes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade de calendário */}
      {visualizacao === "mes" ? (
        <div className="mt-6">
          {renderMes(mesSelecionado, true)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {Array.from({ length: 12 }, (_, i) => i).map((mes) => renderMes(mes, false))}
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Postagens de {dataSelecionada && new Date(dataSelecionada + "T00:00:00").toLocaleDateString("pt-BR")}
            </DialogTitle>
          </DialogHeader>
          
          {postagensDia.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma postagem neste dia.
            </p>
          ) : (
            <div className="space-y-4">
              {postagensDia.map((post) => (
                <Card key={post.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{post.titulo}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {post.plataforma}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {(post.descricao || post.link_post) && (
                    <CardContent className="p-4 pt-0 space-y-2">
                      {post.descricao && (
                        <p className="text-sm text-muted-foreground">{post.descricao}</p>
                      )}
                      {post.link_post && (
                        <a
                          href={post.link_post}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Ver postagem →
                        </a>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" /> {post.curtidas}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {post.visualizacoes}
                        </span>
                        <span className="flex items-center gap-1">
                          💬 {post.comentarios}
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
