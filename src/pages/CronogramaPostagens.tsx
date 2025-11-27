import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Video, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePostagens, usePostagensStats, usePostagensPorDia } from "@/hooks/usePostagens";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function CronogramaPostagens() {
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
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

  const getEstiloIntervalo = (data: string, numPostagens: number) => {
    const dataObj = new Date(data + "T00:00:00");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diaSemana = dataObj.getDay();
    const ehPassado = dataObj < hoje;
    const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;

    // Verde: 1+ postagens
    if (numPostagens >= 1) {
      return {
        bg: "bg-success/20 hover:bg-success/30",
        text: "text-success-foreground",
        border: "border-success/40",
        ring: "ring-success/20",
      };
    }

    // Vermelho: Dia passado sem postagem
    if (ehPassado && !ehFimDeSemana) {
      return {
        bg: "bg-destructive/20 hover:bg-destructive/30",
        text: "text-destructive-foreground",
        border: "border-destructive/40",
        ring: "ring-destructive/20",
      };
    }

    // Cinza: Fim de semana ou futuro
    return {
      bg: "bg-muted hover:bg-muted/80",
      text: "text-muted-foreground",
      border: "border-border",
      ring: "ring-ring/20",
    };
  };

  const renderMes = (mes: number) => {
    const nomeMes = new Date(anoSelecionado, mes - 1).toLocaleDateString("pt-BR", {
      month: "long",
    });
    const primeiroDia = new Date(anoSelecionado, mes - 1, 1);
    const ultimoDia = new Date(anoSelecionado, mes, 0);
    const diasNoMes = ultimoDia.getDate();
    const iniciaSemana = primeiroDia.getDay();

    const dias = [];
    for (let i = 0; i < iniciaSemana; i++) {
      dias.push(<div key={`vazio-${i}`} className="aspect-square" />);
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = `${anoSelecionado}-${String(mes).padStart(2, "0")}-${String(
        dia
      ).padStart(2, "0")}`;
      const numPostagens = postagensPorData[data] || 0;
      const estilo = getEstiloIntervalo(data, numPostagens);

      dias.push(
        <button
          key={dia}
          onClick={() => abrirModalParaData(data)}
          className={`
            aspect-square rounded-full flex flex-col items-center justify-center
            transition-all duration-200 cursor-pointer
            border ${estilo.border} ${estilo.bg} ${estilo.text}
            hover:scale-105 hover:shadow-lg hover:ring-2 ${estilo.ring}
          `}
        >
          <span className="text-xs sm:text-sm font-bold">{dia}</span>
          {numPostagens > 0 && (
            <span className="text-[10px] font-medium">{numPostagens} post{numPostagens > 1 ? 's' : ''}</span>
          )}
        </button>
      );
    }

    return (
      <Card key={mes} className="overflow-hidden">
        <CardHeader className="bg-card/50 p-3">
          <CardTitle className="text-base sm:text-lg capitalize">{nomeMes}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
              <div key={dia} className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{dias}</div>
        </CardContent>
      </Card>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevYear}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-bold min-w-[100px] text-center">
            {anoSelecionado}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextYear}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={visualizacao === "mes" ? "default" : "outline"}
            size="sm"
            onClick={() => setVisualizacao("mes")}
          >
            Por Mês
          </Button>
          <Button
            variant={visualizacao === "ano" ? "default" : "outline"}
            size="sm"
            onClick={() => setVisualizacao("ano")}
          >
            Ano Completo
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <Card className="sticky top-16 z-40 bg-background/95 backdrop-blur">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success/20 border border-success/40" />
              <span className="text-muted-foreground">Meta atingida (1+ posts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive/20 border border-destructive/40" />
              <span className="text-muted-foreground">Sem postagem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-muted border border-border" />
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

      {/* Grade de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {visualizacao === "mes"
          ? renderMes(new Date().getMonth() + 1)
          : Array.from({ length: 12 }, (_, i) => i + 1).map(renderMes)}
      </div>

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
