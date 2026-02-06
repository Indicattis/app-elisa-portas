import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  useColaboradorInfo,
  useDesempenhoDiarioColaborador,
  useMetasColaborador,
  useExcluirMeta,
  MetaColaborador,
} from "@/hooks/useMetasColaboradorIndividual";
import { useMetaProgressoCalculado } from "@/hooks/useMetaProgressoCalculado";
import { GraficoDesempenhoDiario } from "@/components/metas/GraficoDesempenhoDiario";
import { MetaCard } from "@/components/metas/MetaCard";
import { MetaDialog } from "@/components/metas/MetaDialog";
import { toast } from "sonner";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ColaboradorDesempenhoModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(nome: string): string {
  const partes = nome.split(" ").filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

export function ColaboradorDesempenhoModal({ userId, open, onOpenChange }: ColaboradorDesempenhoModalProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metaParaEditar, setMetaParaEditar] = useState<MetaColaborador | null>(null);
  const [metaParaExcluir, setMetaParaExcluir] = useState<MetaColaborador | null>(null);

  const { dataInicio, dataFim, periodoLabel } = useMemo(() => {
    const hoje = new Date();
    const inicio = startOfWeek(hoje, { weekStartsOn: 1 });
    return {
      dataInicio: inicio,
      dataFim: hoje,
      periodoLabel: `${format(inicio, "dd/MM", { locale: ptBR })} - ${format(hoje, "dd/MM/yyyy", { locale: ptBR })}`,
    };
  }, []);

  const { data: colaborador, isLoading: loadingColaborador } = useColaboradorInfo(userId || "");
  const { data: desempenho, isLoading: loadingDesempenho } = useDesempenhoDiarioColaborador(userId || "", dataInicio, dataFim);
  const { data: metas, isLoading: loadingMetas } = useMetasColaborador(userId || "");
  const { data: progressosPorMeta } = useMetaProgressoCalculado(userId || "", metas || []);
  const excluirMeta = useExcluirMeta();

  const getProgressoMeta = (metaId: string) => progressosPorMeta?.[metaId] || 0;

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
    } catch {
      toast.error("Erro ao excluir meta");
    }
  };

  const isLoading = loadingColaborador || loadingDesempenho;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !colaborador ? (
            <div className="p-6 text-center text-muted-foreground">Colaborador não encontrado</div>
          ) : (
            <>
              <DialogHeader className="p-6 pb-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(colaborador.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-base">{colaborador.nome}</DialogTitle>
                    <p className="text-xs text-muted-foreground">Semana: {periodoLabel}</p>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-100px)] px-6 pb-6">
                <div className="space-y-6 pt-4">
                  {/* Desempenho Semanal */}
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Desempenho Semanal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <GraficoDesempenhoDiario dados={desempenho || []} tipo="solda_qtd" titulo="Solda" cor="hsl(24, 95%, 53%)" unidade=" portas" />
                      <GraficoDesempenhoDiario dados={desempenho || []} tipo="perfiladeira_metros" titulo="Perfiladeira" cor="hsl(217, 91%, 60%)" unidade="m" />
                      <GraficoDesempenhoDiario dados={desempenho || []} tipo="separacao_qtd" titulo="Separação" cor="hsl(271, 91%, 65%)" unidade=" ordens" />
                      <GraficoDesempenhoDiario dados={desempenho || []} tipo="qualidade_qtd" titulo="Qualidade" cor="hsl(142, 71%, 45%)" unidade=" ordens" />
                      <GraficoDesempenhoDiario dados={desempenho || []} tipo="pintura_m2" titulo="Pintura" cor="hsl(330, 81%, 60%)" unidade="m²" />
                      <GraficoDesempenhoDiario dados={desempenho || []} tipo="carregamento_qtd" titulo="Expedição" cor="hsl(45, 93%, 47%)" unidade=" cargas" />
                    </div>
                  </section>

                  {/* Metas */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Metas</h3>
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
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : !metas || metas.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhuma meta definida
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {metas.map((meta) => (
                          <MetaCard
                            key={meta.id}
                            meta={meta}
                            progressoAtual={getProgressoMeta(meta.id)}
                            onEdit={() => handleEditarMeta(meta)}
                            onDelete={() => setMetaParaExcluir(meta)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

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
    </>
  );
}
