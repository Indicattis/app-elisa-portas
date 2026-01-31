import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Check, Package, Timer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useConferenciaAlmoxarifado, ItemConferenciaAlmox, ProdutoAlmoxarifado } from "@/hooks/useConferenciaAlmoxarifado";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useQueryClient } from "@tanstack/react-query";

function formatTempo(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(horas)}:${pad(minutos)}:${pad(segs)}`;
}

interface ConferenciaExecucaoAlmoxProps {
  returnPath?: string;
}

export default function ConferenciaExecucaoAlmox({ 
  returnPath = "/producao/conferencia-almox" 
}: ConferenciaExecucaoAlmoxProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    conferenciasEmAndamento,
    produtos,
    loadingConferencias,
    loadingProdutos,
    buscarItensConferencia,
    pausarConferencia,
    retomarConferencia,
    salvarItemConferencia,
    concluirConferencia,
    pausando,
    salvando,
    concluindo,
  } = useConferenciaAlmoxarifado();

  const [itens, setItens] = useState<ItemConferenciaAlmox[]>([]);
  const [loadingItens, setLoadingItens] = useState(true);
  const [tempo, setTempo] = useState(0);
  const [tempoSessao, setTempoSessao] = useState(0);
  const [itemAtual, setItemAtual] = useState<ItemConferenciaAlmox | null>(null);
  const [quantidadeInput, setQuantidadeInput] = useState("");
  const [showConcluirDialog, setShowConcluirDialog] = useState(false);
  const [showPausarDialog, setShowPausarDialog] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tempoSessaoRef = useRef(0);

  const conferenciaAtual = conferenciasEmAndamento.find(c => c.id === id);

  // Carregar itens ao montar
  useEffect(() => {
    const carregarItens = async () => {
      if (!id) return;
      setLoadingItens(true);
      try {
        const itensData = await buscarItensConferencia(id);
        setItens(itensData);
      } catch (error) {
        console.error("Erro ao carregar itens:", error);
      } finally {
        setLoadingItens(false);
      }
    };
    
    carregarItens();
  }, [id, buscarItensConferencia]);

  // Inicializar tempo e cronômetro
  useEffect(() => {
    if (conferenciaAtual) {
      setTempo(conferenciaAtual.tempo_acumulado_segundos);

      if (!conferenciaAtual.pausada) {
        timerRef.current = setInterval(() => {
          setTempo((t) => t + 1);
          setTempoSessao((t) => {
            tempoSessaoRef.current = t + 1;
            return t + 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [conferenciaAtual?.id, conferenciaAtual?.pausada]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const getProdutoInfo = useCallback((produtoId: string): ProdutoAlmoxarifado | undefined => {
    return produtos.find((p) => p.id === produtoId);
  }, [produtos]);

  const handlePausar = async () => {
    if (!id) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    await pausarConferencia({ conferenciaId: id, tempoSessao: tempoSessaoRef.current });
    navigate(returnPath);
  };

  const handleRetomar = async () => {
    if (!id) return;
    await retomarConferencia(id);
  };

  const handleSalvarItem = async () => {
    if (!itemAtual || !id || quantidadeInput === "") return;
    
    const quantidade = parseInt(quantidadeInput, 10);
    
    if (isNaN(quantidade) || quantidade < 0) {
      return;
    }

    await salvarItemConferencia({
      conferenciaId: id,
      produtoId: itemAtual.produto_id,
      quantidade,
    });

    // Atualizar lista local
    setItens(prev => prev.map(item => 
      item.id === itemAtual.id 
        ? { ...item, quantidade_conferida: quantidade }
        : item
    ));
    
    setItemAtual(null);
    setQuantidadeInput("");
  };

  const handleConcluir = async () => {
    if (!id) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    await concluirConferencia({ conferenciaId: id, tempoSessao: tempoSessaoRef.current });
    navigate("/direcao/estoque/auditoria/almoxarifado");
  };

  const itensNaoConferidos = itens.filter((item) => item.quantidade_conferida === null);
  const itensConferidosList = itens.filter((item) => item.quantidade_conferida !== null);
  const progresso = conferenciaAtual && conferenciaAtual.total_itens > 0
    ? (itensConferidosList.length / conferenciaAtual.total_itens) * 100
    : 0;

  const todosConferidos = itensNaoConferidos.length === 0 && itens.length > 0;

  // Loading guard
  if (loadingConferencias || loadingItens || loadingProdutos || !conferenciaAtual) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando conferência...</p>
        </div>
      </div>
    );
  }

  // Fallback se produtos estiver vazio após carregamento
  if (produtos.length === 0 && !loadingProdutos) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum produto encontrado no almoxarifado.</p>
          <Button variant="outline" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["almoxarifado-produtos"] });
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPausarDialog(true)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Conferência do Almoxarifado</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span className="font-mono">{formatTempo(tempo)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {conferenciaAtual?.pausada ? (
                <Button onClick={handleRetomar} size="sm">
                  Retomar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPausarDialog(true)}
                  disabled={pausando}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </Button>
              )}
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {itensConferidosList.length} de {conferenciaAtual?.total_itens || 0} itens
              </span>
              <span className="font-medium">{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Botão de concluir quando todos conferidos */}
        {todosConferidos && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Todos os itens foram conferidos!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Clique em concluir para finalizar a conferência
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowConcluirDialog(true)} disabled={concluindo}>
                  {concluindo ? "Concluindo..." : "Concluir"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de itens não conferidos */}
        {itensNaoConferidos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Pendentes ({itensNaoConferidos.length})
            </h2>
            {itensNaoConferidos.map((item) => {
              const produto = getProdutoInfo(item.produto_id);
              return (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setItemAtual(item);
                    setQuantidadeInput(item.quantidade_anterior.toString());
                  }}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{produto?.nome || "Produto"}</p>
                        <p className="text-sm text-muted-foreground">
                          Sistema: {item.quantidade_anterior} {produto?.unidade || "un"}
                        </p>
                      </div>
                      <Badge variant="outline">Pendente</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Lista de itens conferidos */}
        {itensConferidosList.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Conferidos ({itensConferidosList.length})
            </h2>
            {itensConferidosList.map((item) => {
              const produto = getProdutoInfo(item.produto_id);
              const diferenca = (item.quantidade_conferida || 0) - item.quantidade_anterior;
              const temDiferenca = diferenca !== 0;

              return (
                <Card
                  key={item.id}
                  className={`${temDiferenca ? "border-yellow-500/50" : "border-green-500/50"}`}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{produto?.nome || "Produto"}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Sistema: {item.quantidade_anterior}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className={temDiferenca ? "text-yellow-600 font-medium" : "text-green-600"}>
                            Conferido: {item.quantidade_conferida}
                          </span>
                          {temDiferenca && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                              {diferenca > 0 ? `+${diferenca}` : diferenca}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Check className={`h-5 w-5 ${temDiferenca ? "text-yellow-500" : "text-green-500"}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de conferir item */}
      <Dialog open={!!itemAtual} onOpenChange={(open) => !open && setItemAtual(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferir Item</DialogTitle>
            <DialogDescription>
              {itemAtual && getProdutoInfo(itemAtual.produto_id)?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade Conferida</label>
              <Input
                type="number"
                min="0"
                value={quantidadeInput}
                onChange={(e) => setQuantidadeInput(e.target.value)}
                placeholder="Digite a quantidade"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Quantidade no sistema: {itemAtual?.quantidade_anterior || 0}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemAtual(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarItem} disabled={salvando || quantidadeInput === ""}>
              {salvando ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de pausar */}
      <AlertDialog open={showPausarDialog} onOpenChange={setShowPausarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pausar conferência?</AlertDialogTitle>
            <AlertDialogDescription>
              A conferência será pausada e você poderá retomá-la depois.
              O tempo será salvo automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar conferindo</AlertDialogCancel>
            <AlertDialogAction onClick={handlePausar} disabled={pausando}>
              {pausando ? "Pausando..." : "Pausar e sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de concluir */}
      <AlertDialog open={showConcluirDialog} onOpenChange={setShowConcluirDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir conferência?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao concluir, as quantidades do almoxarifado serão atualizadas
              com os valores conferidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConcluir} disabled={concluindo}>
              {concluindo ? "Concluindo..." : "Concluir conferência"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
