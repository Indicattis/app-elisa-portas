import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useMemo } from "react";
import {
  useColaboradorInfo,
  useDesempenhoDiarioColaborador,
  useMetasColaborador,
  useExcluirMeta,
  MetaColaborador,
} from "@/hooks/useMetasColaboradorIndividual";
import { GraficoDesempenhoDiario } from "@/components/metas/GraficoDesempenhoDiario";
import { MetaCard } from "@/components/metas/MetaCard";
import { MetaDialog } from "@/components/metas/MetaDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getInitials(nome: string): string {
  const partes = nome.split(" ").filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

export default function MetasColaboradorIndividual() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metaParaEditar, setMetaParaEditar] = useState<MetaColaborador | null>(null);
  const [metaParaExcluir, setMetaParaExcluir] = useState<MetaColaborador | null>(null);

  // Período: mês atual
  const dataInicio = useMemo(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }, []);
  
  const dataFim = useMemo(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }, []);

  const { data: colaborador, isLoading: loadingColaborador } = useColaboradorInfo(userId || "");
  const { data: desempenho, isLoading: loadingDesempenho } = useDesempenhoDiarioColaborador(
    userId || "",
    dataInicio,
    dataFim
  );
  const { data: metas, isLoading: loadingMetas } = useMetasColaborador(userId || "");
  const excluirMeta = useExcluirMeta();

  // Calcular totais do mês para progresso das metas
  const totaisMes = useMemo(() => {
    if (!desempenho) return null;
    return desempenho.reduce(
      (acc, dia) => ({
        solda: acc.solda + dia.solda_qtd,
        perfiladeira: acc.perfiladeira + dia.perfiladeira_metros,
        separacao: acc.separacao + dia.separacao_qtd,
        qualidade: acc.qualidade + dia.qualidade_qtd,
        pintura: acc.pintura + dia.pintura_m2,
        carregamento: acc.carregamento + dia.carregamento_qtd,
      }),
      { solda: 0, perfiladeira: 0, separacao: 0, qualidade: 0, pintura: 0, carregamento: 0 }
    );
  }, [desempenho]);

  const getProgressoMeta = (tipo: MetaColaborador["tipo_meta"]) => {
    if (!totaisMes) return 0;
    return totaisMes[tipo] || 0;
  };

  const handleEditarMeta = (meta: MetaColaborador) => {
    setMetaParaEditar(meta);
    setDialogOpen(true);
  };

  const handleExcluirMeta = async () => {
    if (!metaParaExcluir || !userId) return;
    
    try {
      await excluirMeta.mutateAsync({ id: metaParaExcluir.id, userId });
      toast.success("Meta excluída com sucesso!");
      setMetaParaExcluir(null);
    } catch (error) {
      toast.error("Erro ao excluir meta");
    }
  };

  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  if (loadingColaborador || loadingDesempenho) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate("/hub-fabrica/metas")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="text-center mt-8 text-muted-foreground">
          Colaborador não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/hub-fabrica/metas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={colaborador.foto_perfil_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(colaborador.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate">{colaborador.nome}</h1>
            <p className="text-xs text-muted-foreground capitalize">{mesAtual}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Gráficos de Desempenho */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Desempenho Diário
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <GraficoDesempenhoDiario
              dados={desempenho || []}
              tipo="solda_qtd"
              titulo="Solda"
              cor="hsl(24, 95%, 53%)"
              unidade=" portas"
            />
            <GraficoDesempenhoDiario
              dados={desempenho || []}
              tipo="perfiladeira_metros"
              titulo="Perfiladeira"
              cor="hsl(217, 91%, 60%)"
              unidade="m"
            />
            <GraficoDesempenhoDiario
              dados={desempenho || []}
              tipo="separacao_qtd"
              titulo="Separação"
              cor="hsl(271, 91%, 65%)"
              unidade=" ordens"
            />
            <GraficoDesempenhoDiario
              dados={desempenho || []}
              tipo="qualidade_qtd"
              titulo="Qualidade"
              cor="hsl(142, 71%, 45%)"
              unidade=" ordens"
            />
            <GraficoDesempenhoDiario
              dados={desempenho || []}
              tipo="pintura_m2"
              titulo="Pintura"
              cor="hsl(330, 81%, 60%)"
              unidade="m²"
            />
            <GraficoDesempenhoDiario
              dados={desempenho || []}
              tipo="carregamento_qtd"
              titulo="Expedição"
              cor="hsl(45, 93%, 47%)"
              unidade=" cargas"
            />
          </div>
        </section>

        {/* Metas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Metas Definidas
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setMetaParaEditar(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova Meta
            </Button>
          </div>

          {loadingMetas ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !metas || metas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma meta definida ainda
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {metas.map((meta) => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  progressoAtual={getProgressoMeta(meta.tipo_meta)}
                  onEdit={() => handleEditarMeta(meta)}
                  onDelete={() => setMetaParaExcluir(meta)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Dialog de Meta */}
      <MetaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId || ""}
        metaParaEditar={metaParaEditar}
      />

      {/* Alert de Exclusão */}
      <AlertDialog open={!!metaParaExcluir} onOpenChange={() => setMetaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A meta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirMeta}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
