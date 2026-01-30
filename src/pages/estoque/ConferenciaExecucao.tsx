import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Check, Search, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConferenciaEstoque, ItemConferencia } from "@/hooks/useConferenciaEstoque";
import { useCronometro } from "@/hooks/useCronometro";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

function formatTempo(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  return `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
}

interface ConferenciaExecucaoProps {
  returnPath?: string;
}

export default function ConferenciaExecucao({ 
  returnPath = "/estoque/conferencia" 
}: ConferenciaExecucaoProps) {
  const { id: conferenciaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [showConcluirDialog, setShowConcluirDialog] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [itensLocais, setItensLocais] = useState<Map<string, number | null>>(new Map());
  const [conferenciaCarregada, setConferenciaCarregada] = useState(false);

  const {
    produtos,
    loadingProdutos,
    buscarItensConferencia,
    salvarItemConferencia,
    pausarConferencia,
    retomarConferencia,
    concluirConferencia,
    pausando,
    concluindo,
  } = useConferenciaEstoque();

  const { segundosDecorridos, isRunning, start, pause, reset } = useCronometro();

  // Buscar dados da conferência
  const { data: conferencia, isLoading: loadingConferencia } = useQuery({
    queryKey: ["conferencia", conferenciaId],
    queryFn: async () => {
      if (!conferenciaId) return null;
      const { data, error } = await supabase
        .from("estoque_conferencias")
        .select("*")
        .eq("id", conferenciaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!conferenciaId,
  });

  // Buscar itens da conferência
  const { data: itensConferencia = [], isLoading: loadingItens } = useQuery({
    queryKey: ["itens-conferencia", conferenciaId],
    queryFn: async () => {
      if (!conferenciaId) return [];
      return buscarItensConferencia(conferenciaId);
    },
    enabled: !!conferenciaId,
  });

  // Inicializar itens locais e cronômetro
  useEffect(() => {
    if (itensConferencia.length > 0 && !conferenciaCarregada) {
      const mapa = new Map<string, number | null>();
      itensConferencia.forEach((item) => {
        mapa.set(item.produto_id, item.quantidade_conferida);
      });
      setItensLocais(mapa);
      setConferenciaCarregada(true);
    }
  }, [itensConferencia, conferenciaCarregada]);

  // Ref para evitar múltiplas inicializações do cronômetro
  const cronometroIniciado = useRef(false);
  const segundosRef = useRef(segundosDecorridos);
  const isRunningRef = useRef(isRunning);

  // Manter refs atualizados
  useEffect(() => {
    segundosRef.current = segundosDecorridos;
  }, [segundosDecorridos]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Iniciar cronômetro quando conferência é carregada
  useEffect(() => {
    const iniciarCronometro = async () => {
      if (conferencia && conferenciaCarregada && !cronometroIniciado.current) {
        cronometroIniciado.current = true;
        if (conferencia.pausada) {
          await retomarConferencia(conferenciaId!);
        }
        start();
      }
    };
    iniciarCronometro();
  }, [conferencia, conferenciaCarregada, conferenciaId, retomarConferencia, start]);

  // Auto-pausar ao sair da página
  useEffect(() => {
    return () => {
      if (cronometroIniciado.current && conferenciaId && isRunningRef.current) {
        pausarConferencia({
          conferenciaId,
          tempoSessao: segundosRef.current,
        });
      }
    };
  }, [conferenciaId, pausarConferencia]);

  const handleQuantidadeChange = useCallback(async (produtoId: string, valor: string) => {
    const quantidade = valor === "" ? null : parseInt(valor, 10);
    if (valor !== "" && (isNaN(quantidade!) || quantidade! < 0)) return;

    setItensLocais((prev) => {
      const novo = new Map(prev);
      novo.set(produtoId, quantidade);
      return novo;
    });

    // Salvar no banco
    if (conferenciaId) {
      await salvarItemConferencia({
        conferenciaId,
        produtoId,
        quantidade,
      });
    }
  }, [conferenciaId, salvarItemConferencia]);

  const handlePausar = async () => {
    if (!conferenciaId) return;
    pause();
    await pausarConferencia({
      conferenciaId,
      tempoSessao: segundosDecorridos,
    });
    navigate(returnPath);
  };

  const handleConcluir = async () => {
    if (!conferenciaId) return;
    pause();
    await concluirConferencia({
      conferenciaId,
      tempoSessao: segundosDecorridos,
      observacoes: observacoes || undefined,
    });
    navigate("/estoque/auditoria");
  };

  // Filtrar produtos
  const produtosFiltrados = produtos.filter((p) => {
    if (!searchTerm) return true;
    const termo = searchTerm.toLowerCase();
    return (
      p.nome_produto.toLowerCase().includes(termo) ||
      p.sku?.toLowerCase().includes(termo) ||
      p.categoria?.toLowerCase().includes(termo)
    );
  });

  // Calcular estatísticas
  const totalItens = produtos.length;
  const itensConferidosCount = Array.from(itensLocais.values()).filter(
    (v) => v !== null
  ).length;
  const progresso = totalItens > 0 ? (itensConferidosCount / totalItens) * 100 : 0;
  const podeConcluir = itensConferidosCount === totalItens && totalItens > 0;

  // Tempo total (acumulado + sessão atual)
  const tempoTotal = (conferencia?.tempo_acumulado_segundos || 0) + segundosDecorridos;

  // Encontrar quantidade anterior para um produto
  const getQuantidadeAnterior = (produtoId: string) => {
    const item = itensConferencia.find((i) => i.produto_id === produtoId);
    return item?.quantidade_anterior ?? 0;
  };

  if (loadingConferencia || loadingItens) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!conferencia) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
            <p>Conferência não encontrada</p>
            <Button className="mt-4" onClick={() => navigate(returnPath)}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex flex-col gap-2 md:gap-3">
            {/* Linha 1: Navegação e cronômetro */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-9 md:w-9"
                  onClick={() => navigate(returnPath)}
                >
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <div>
                  <h1 className="text-sm md:text-lg font-semibold">
                    Conf. #{conferenciaId?.substring(0, 8)}
                  </h1>
                </div>
              </div>

              {/* Cronômetro */}
              <div className="flex items-center gap-1.5 md:gap-2 bg-muted px-2 md:px-4 py-1.5 md:py-2 rounded-lg">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                <span className="font-mono text-sm md:text-lg font-semibold">
                  {formatTempo(tempoTotal)}
                </span>
              </div>
            </div>

            {/* Linha 2: Progresso e ações */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">
                    {itensConferidosCount}/{totalItens}
                  </span>
                  <span className="font-medium">{Math.round(progresso)}%</span>
                </div>
                <Progress value={progresso} className="h-1.5 md:h-2" />
              </div>

              <div className="flex gap-1.5 md:gap-2">
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  onClick={handlePausar}
                  disabled={pausando}
                  className="text-xs md:text-sm"
                >
                  <Pause className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                  {pausando ? "..." : "Pausar"}
                </Button>
                <Button
                  size={isMobile ? "sm" : "default"}
                  onClick={() => setShowConcluirDialog(true)}
                  disabled={!podeConcluir}
                  className="text-xs md:text-sm"
                >
                  <Check className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Concluir
                </Button>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 md:pl-10 h-8 md:h-10 text-xs md:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de itens */}
      <div className="container mx-auto px-4 py-4">
        {loadingProdutos ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell w-24">SKU</TableHead>
                  <TableHead className="text-xs md:text-sm">Produto</TableHead>
                  <TableHead className="hidden md:table-cell w-32">Categoria</TableHead>
                  <TableHead className="w-20 md:w-28 text-center text-xs md:text-sm">Atual</TableHead>
                  <TableHead className="w-20 md:w-32 text-center text-xs md:text-sm">Conf.</TableHead>
                  <TableHead className="hidden md:table-cell w-24 text-center">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosFiltrados.map((produto) => {
                  const quantidadeAnterior = getQuantidadeAnterior(produto.id);
                  const quantidadeConferida = itensLocais.get(produto.id);
                  const diferenca =
                    quantidadeConferida !== null && quantidadeConferida !== undefined
                      ? quantidadeConferida - quantidadeAnterior
                      : null;

                  return (
                    <TableRow key={produto.id}>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                        {produto.sku || "-"}
                      </TableCell>
                      <TableCell className="font-medium text-xs md:text-sm max-w-[120px] md:max-w-none truncate">
                        {produto.nome_produto}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {produto.categoria || "Sem categoria"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs md:text-sm">
                        {quantidadeAnterior}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Qtd"
                          value={quantidadeConferida ?? ""}
                          onChange={(e) => handleQuantidadeChange(produto.id, e.target.value)}
                          className="h-7 md:h-8 text-center text-xs md:text-sm"
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        {diferenca !== null ? (
                          <span
                            className={cn(
                              "font-medium",
                              diferenca > 0 && "text-green-600",
                              diferenca < 0 && "text-red-600",
                              diferenca === 0 && "text-muted-foreground"
                            )}
                          >
                            {diferenca > 0 ? `+${diferenca}` : diferenca}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog de conclusão */}
      <Dialog open={showConcluirDialog} onOpenChange={setShowConcluirDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Conferência</DialogTitle>
            <DialogDescription>
              Todos os {totalItens} itens foram conferidos. Deseja finalizar a conferência
              e atualizar o estoque?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Itens conferidos:</span>
                <span className="font-medium">{itensConferidosCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tempo total:</span>
                <span className="font-mono">{formatTempo(tempoTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Textarea
                placeholder="Adicione observações sobre a conferência..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConcluirDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConcluir} disabled={concluindo}>
              {concluindo ? "Concluindo..." : "Confirmar e Atualizar Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
