import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Circle, Package, UserCheck, Download, Clock, Archive, Printer, Tags, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrdemPDFData } from "@/hooks/useOrdemPDFData";
import { baixarOrdemProducaoPDF } from "@/utils/ordemProducaoPDFGenerator";
import { toast } from "sonner";
import { OrigemBadges } from "@/components/shared/OrigemBadges";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { useEtiquetasProducao } from "@/hooks/useEtiquetasProducao";
import { useRegrasEtiquetas } from "@/hooks/useRegrasEtiquetas";
import { gerarPDFEtiquetaProducao, gerarPDFEtiquetasProducaoMultiplas } from "@/utils/etiquetasPDFGenerator";
import { RetornarProducaoModal } from "./RetornarProducaoModal";
import { CoresPortasEnrolar } from "@/components/shared/CoresPortasEnrolar";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  concluida: boolean;
  produto_venda_id?: string;
  cor_nome?: string;
  tipo_pintura?: string;
  largura?: number;
  altura?: number;
  estoque_id?: string;
}

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  observacoes?: string;
  responsavel_id?: string;
  capturada_em?: string;
  tempo_conclusao_segundos?: number;
  linhas?: LinhaOrdem[];
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    venda_id?: string;
    produtos?: Array<{
      tipo_produto?: string;
      catalogo_cores?: { nome: string; codigo_hex: string } | null;
    }>;
  };
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface OrdemDetalhesSheetProps {
  ordem: Ordem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoOrdem: TipoOrdem;
  onMarcarLinha: (linhaId: string, concluida: boolean) => void;
  onConcluirOrdem: (ordemId: string) => void;
  onCapturarOrdem?: (ordemId: string) => void;
  isUpdating?: boolean;
  isCapturing?: boolean;
  onIniciarPintura?: () => void;
  onFinalizarPintura?: () => void;
  isIniciando?: boolean;
  isFinalizando?: boolean;
  onRetornarProducao?: () => void;
}

const TIPO_LABELS: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
};

const TIPO_ORDEM_ETIQUETA: Record<TipoOrdem, string> = {
  soldagem: 'Ordem de Soldagem',
  perfiladeira: 'Ordem de Perfiladeira',
  separacao: 'Ordem de Separação',
  qualidade: 'Ordem de Qualidade',
  pintura: 'Ordem de Pintura',
};

export function OrdemDetalhesSheet({
  ordem,
  open,
  onOpenChange,
  tipoOrdem,
  onMarcarLinha,
  onConcluirOrdem,
  onCapturarOrdem,
  isUpdating = false,
  isCapturing = false,
  onIniciarPintura,
  onFinalizarPintura,
  isIniciando = false,
  isFinalizando = false,
  onRetornarProducao,
}: OrdemDetalhesSheetProps) {
  const { user } = useAuth();
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [retornarModalOpen, setRetornarModalOpen] = useState(false);
  const { buscarDadosOrdem } = useOrdemPDFData();
  const { calcularEtiquetasLinha } = useEtiquetasProducao();
  const { encontrarRegraAplicavel, encontrarRegraPorNome } = useRegrasEtiquetas();
  
  const linhas = ordem?.linhas || [];
  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const todasConcluidas = linhas.length === 0 || linhas.every(l => l.concluida);
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;
  
  const { tempoDecorrido, deveAnimar } = useCronometroOrdem({
    capturada_em: ordem?.capturada_em,
    tempo_conclusao_segundos: ordem?.tempo_conclusao_segundos,
    todas_linhas_concluidas: todasConcluidas && ordem?.status === 'concluido',
    responsavel_id: ordem?.responsavel_id,
  });
  
  if (!ordem) return null;
  
  const isResponsavel = ordem.responsavel_id === user?.id;
  const temResponsavel = !!ordem.responsavel_id;
  const podeMarcarLinhas = temResponsavel && isResponsavel;

  const origemOrdemLabel = TIPO_ORDEM_ETIQUETA[tipoOrdem];

  const handleImprimirEtiqueta = (linha: LinhaOrdem) => {
    try {
      const calculo = calcularEtiquetasLinha(linha);
      
      // Gerar apenas 1 etiqueta individual
      const tag = {
        tagNumero: 1,
        totalTags: calculo.etiquetasNecessarias,
        nomeProduto: calculo.nomeProduto,
        numeroPedido: ordem?.pedido?.numero_pedido || ordem?.numero_ordem || '',
        quantidade: calculo.quantidade,
        largura: calculo.largura,
        altura: calculo.altura,
        clienteNome: ordem?.pedido?.cliente_nome,
        tamanho: linha.tamanho,
        corNome: linha.cor_nome,
        tipoPintura: linha.tipo_pintura,
        origemOrdem: origemOrdemLabel,
        responsavelNome: ordem?.admin_users?.nome,
      };
      
      const doc = gerarPDFEtiquetaProducao(tag);
      
      // Criar iframe oculto para impressão na aba atual
      const blobUrl = String(doc.output('bloburl'));
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
            
            window.addEventListener('focus', () => {
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              }, 100);
            }, { once: true });
            
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 10000);
          } catch (error) {
            console.error('Erro ao imprimir:', error);
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }
        }, 500);
      };
      
      iframe.src = blobUrl;
      
      toast.success('1 etiqueta pronta para impressão');
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      toast.error('Erro ao gerar etiqueta');
    }
  };

  // Função auxiliar para obter recomendação de etiquetas (só retorna valor se existir regra)
  const getEtiquetasRecomendadas = (linha: LinhaOrdem): number | null => {
    const dimensoes = { tamanho: linha.largura || 0 };
    
    // Primeiro tenta encontrar regra pelo estoque_id
    let regra = linha.estoque_id 
      ? encontrarRegraAplicavel(linha.estoque_id, dimensoes) 
      : null;
    
    // Se não encontrou por estoque_id, tenta pelo nome do produto
    if (!regra && linha.item) {
      regra = encontrarRegraPorNome(linha.item, dimensoes);
    }
    
    if (!regra) return null;
    
    try {
      const calculo = calcularEtiquetasLinha(linha);
      return calculo.etiquetasNecessarias;
    } catch {
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    if (!ordem) return;
    
    setIsDownloadingPDF(true);
    try {
      const dadosCompletos = await buscarDadosOrdem(ordem.id, tipoOrdem);
      baixarOrdemProducaoPDF(dadosCompletos);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF da ordem");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleImprimirTodasEtiquetas = () => {
    try {
      if (linhas.length === 0) {
        toast.error("Nenhum item para imprimir");
        return;
      }

      // Criar todas as tags de todas as linhas
      const todasTags: any[] = [];
      
      linhas.forEach((linha) => {
        const calculo = calcularEtiquetasLinha(linha);
        
        for (let i = 1; i <= calculo.etiquetasNecessarias; i++) {
          todasTags.push({
            tagNumero: i,
            totalTags: calculo.etiquetasNecessarias,
            nomeProduto: calculo.nomeProduto,
            numeroPedido: ordem?.pedido?.numero_pedido || ordem?.numero_ordem || '',
            quantidade: calculo.quantidade,
            largura: calculo.largura,
            altura: calculo.altura,
            clienteNome: ordem?.pedido?.cliente_nome,
            tamanho: linha.tamanho,
            corNome: linha.cor_nome,
            tipoPintura: linha.tipo_pintura,
            origemOrdem: origemOrdemLabel,
            responsavelNome: ordem?.admin_users?.nome,
          });
        }
      });

      if (todasTags.length === 0) {
        toast.error("Nenhuma etiqueta para gerar");
        return;
      }

      // Gerar PDF com todas as etiquetas
      const doc = gerarPDFEtiquetasProducaoMultiplas(todasTags);
      
      // Criar iframe oculto para impressão
      const blobUrl = String(doc.output('bloburl'));
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
            window.addEventListener('focus', () => {
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              }, 100);
            }, { once: true });
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 10000);
          } catch (error) {
            console.error('Erro ao imprimir:', error);
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }
        }, 500);
      };
      
      iframe.src = blobUrl;
      
      toast.success(`${todasTags.length} etiqueta(s) pronta(s) para impressão`);
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      toast.error('Erro ao gerar etiquetas');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] max-w-[700px] mx-auto rounded-t-xl overflow-y-auto flex flex-col p-0"
      >
        {/* Header fixo */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {temResponsavel && (
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={ordem.admin_users?.foto_perfil_url} alt={ordem.admin_users?.nome} />
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {ordem.admin_users?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{ordem.numero_ordem}</span>
                <span className="text-xs text-muted-foreground truncate">{ordem.pedido?.cliente_nome}</span>
              </div>
            </div>
            
            {/* Centro: Cores das Portas de Enrolar */}
            <div className="flex-1 flex justify-center">
              <CoresPortasEnrolar produtos={ordem.pedido?.produtos} />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground">Ped. {ordem.pedido?.numero_pedido}</span>
              {ordem.capturada_em && (
                <div className="flex items-center gap-1">
                  <Clock className={`h-3.5 w-3.5 text-orange-500 ${deveAnimar ? 'animate-pulse' : ''}`} />
                  <span className="text-xs font-mono text-orange-600 dark:text-orange-400">
                    {tempoDecorrido}
                  </span>
                </div>
              )}
              <Badge variant={
                ordem.status === 'concluido' || ordem.status === 'pronta' ? 'default' : 'secondary'
              } className="text-xs">
                {tipoOrdem === 'pintura' ? (
                  ordem.status === 'pendente' ? 'Para Pintar' :
                  ordem.status === 'pintando' ? 'Pintando' :
                  ordem.status === 'pronta' ? 'Pronta' : ordem.status
                ) : (
                  ordem.status === 'concluido' ? 'Concluído' : 'Pendente'
                )}
              </Badge>
            </div>
          </div>
          
          {/* Botão de concluir no header quando todos os itens estão marcados */}
          {todasConcluidas && linhas.length > 0 && podeMarcarLinhas && ordem.status !== 'concluido' && ordem.status !== 'pronta' && (
            <div className="mt-4">
              {tipoOrdem === 'pintura' ? (
                <Button
                  className="w-full"
                  disabled={isFinalizando}
                  onClick={onFinalizarPintura}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isFinalizando ? "Concluindo..." : "Concluir Pintura"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={isUpdating}
                  onClick={() => onConcluirOrdem(ordem.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isUpdating ? "Concluindo..." : "Concluir Ordem"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Responsável */}
          {!temResponsavel && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Responsável</span>
              <Badge variant="secondary">Não atribuído</Badge>
            </div>
          )}

          {/* Botão de capturar ordem */}
          {!temResponsavel && ordem.status !== 'concluido' && ordem.status !== 'pronta' && onCapturarOrdem && (
            <>
              <Separator />
              <Button
                className="w-full"
                variant="outline"
                disabled={isCapturing}
                onClick={() => onCapturarOrdem(ordem.id)}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {isCapturing ? "Capturando..." : "Capturar Ordem"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Capture esta ordem para começar a trabalhar nela
              </p>
            </>
          )}

          {/* Alerta quando não pode marcar */}
          {temResponsavel && !isResponsavel && ordem.status !== 'concluido' && ordem.status !== 'pronta' && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                <p className="text-xs text-muted-foreground text-center">
                  Esta ordem está sendo executada por <span className="font-medium">{ordem.admin_users?.nome}</span>. Apenas o responsável pode marcar as linhas.
                </p>
              </div>
            </>
          )}

          {ordem.observacoes && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Observações</span>
                <p className="text-sm text-muted-foreground">{ordem.observacoes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Lista de linhas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Itens de Produção</span>
                {linhas.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleImprimirTodasEtiquetas}
                    title="Imprimir todas as etiquetas"
                  >
                    <Tags className="h-3 w-3" />
                    Imprimir Todas
                  </Button>
                )}
              </div>
              {todasConcluidas && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Todas concluídas
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {tipoOrdem === 'pintura' ? (
                // Agrupamento por porta para pintura
                (() => {
                  // Agrupar linhas por produto_venda_id
                  const linhasPorPorta = linhas.reduce((grupos, linha) => {
                    const key = linha.produto_venda_id || 'sem_porta';
                    if (!grupos[key]) {
                      grupos[key] = [];
                    }
                    grupos[key].push(linha);
                    return grupos;
                  }, {} as Record<string, LinhaOrdem[]>);

                  return Object.entries(linhasPorPorta).map(([portaId, linhasPorta], index) => {
                    const primeiraLinha = linhasPorta[0];
                    const todasConcluidasPorta = linhasPorta.every(l => l.concluida);
                    
                    return (
                      <div key={portaId} className="space-y-2 p-3 rounded-lg border bg-card">
                        {/* Cabeçalho do grupo de porta */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-sm">
                                Porta {index + 1}
                              </span>
                              {todasConcluidasPorta && (
                                <Badge variant="outline" className="bg-green-50">
                                  <CheckCircle2 className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                            {primeiraLinha.cor_nome && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Pintura:</span> {primeiraLinha.cor_nome}
                                {primeiraLinha.tipo_pintura && ` (${primeiraLinha.tipo_pintura})`}
                              </div>
                            )}
                            {primeiraLinha.largura && primeiraLinha.altura && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Dimensões:</span> {primeiraLinha.largura} x {primeiraLinha.altura}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Itens da porta */}
                        <div className="space-y-2">
                          {linhasPorta.map((linha) => (
                            <Label
                              key={linha.id}
                              htmlFor={`checkbox-${linha.id}`}
                              className="flex items-start gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                            >
                              <Checkbox
                                id={`checkbox-${linha.id}`}
                                checked={linha.concluida}
                                onCheckedChange={(checked) => onMarcarLinha(linha.id, checked as boolean)}
                                disabled={ordem.status === 'concluido' || ordem.status === 'pronta' || isUpdating || !podeMarcarLinhas}
                                className="mt-1"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {linha.concluida ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className={`text-base font-medium ${linha.concluida ? 'line-through text-muted-foreground' : ''}`}>
                                    {linha.item}
                                  </span>
                                </div>
                                
                                <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>Qtd: {linha.quantidade}</span>
                                  {linha.tamanho && <span>{linha.tamanho}</span>}
                                  {getEtiquetasRecomendadas(linha) !== null && (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
                                      <Tags className="h-3 w-3 mr-1" />
                                      {getEtiquetasRecomendadas(linha)} etiq.
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 p-0 flex-shrink-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleImprimirEtiqueta(linha);
                                }}
                                title="Imprimir etiqueta"
                              >
                                <Printer className="h-5 w-5" />
                              </Button>
                            </Label>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                // Renderização normal para outras ordens
                linhas.map((linha) => (
                  <Label
                    key={linha.id}
                    htmlFor={`checkbox-${linha.id}`}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      id={`checkbox-${linha.id}`}
                      checked={linha.concluida}
                      onCheckedChange={(checked) => onMarcarLinha(linha.id, checked as boolean)}
                      disabled={ordem.status === 'concluido' || ordem.status === 'pronta' || isUpdating || !podeMarcarLinhas}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {linha.concluida ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={`text-base font-medium ${linha.concluida ? 'line-through text-muted-foreground' : ''}`}>
                          {linha.item}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Qtd: {linha.quantidade}</span>
                        {linha.tamanho && <span>Tamanho: {linha.tamanho}</span>}
                        {getEtiquetasRecomendadas(linha) !== null && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
                            <Tags className="h-3 w-3 mr-1" />
                            {getEtiquetasRecomendadas(linha)} etiq.
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.preventDefault();
                        handleImprimirEtiqueta(linha);
                      }}
                      title="Imprimir etiqueta"
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                  </Label>
                ))
              )}

              {linhas.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum item de produção cadastrado
                </div>
              )}
            </div>
          </div>

          {/* Botões específicos para pintura */}
          {tipoOrdem === 'pintura' && ordem.status !== 'pronta' && (
            <>
              <Separator />
              {podeMarcarLinhas && (
                <>
                  <Button
                    className="w-full"
                    disabled={!todasConcluidas || isFinalizando}
                    onClick={onFinalizarPintura}
                  >
                    {isFinalizando ? "Concluindo..." : "Concluir Pintura"}
                  </Button>
                  {!todasConcluidas && linhas.length > 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Marque todos os itens como concluídos para concluir a pintura
                    </p>
                  )}
                </>
              )}
              {!podeMarcarLinhas && (
                <p className="text-xs text-center text-muted-foreground text-orange-600">
                  Apenas o responsável pode gerenciar esta ordem
                </p>
              )}
            </>
          )}

          {/* Botão de concluir ordem (para outras ordens) */}
          {tipoOrdem !== 'pintura' && ordem.status !== 'concluido' && (
            <>
              <Separator />
              
              {/* Botão Retornar para Produção - apenas para qualidade */}
              {tipoOrdem === 'qualidade' && podeMarcarLinhas && (
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => setRetornarModalOpen(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retornar para Produção
                </Button>
              )}

              <Button
                className="w-full"
                disabled={!todasConcluidas || isUpdating || !podeMarcarLinhas}
                onClick={() => onConcluirOrdem(ordem.id)}
              >
                {isUpdating ? "Concluindo..." : "Concluir Ordem"}
              </Button>
              {!podeMarcarLinhas && (
                <p className="text-xs text-center text-muted-foreground text-orange-600">
                  Apenas o responsável pode concluir esta ordem
                </p>
              )}
              {!todasConcluidas && linhas.length > 0 && podeMarcarLinhas && (
                <p className="text-xs text-center text-muted-foreground">
                  Marque todos os itens como concluídos para finalizar a ordem
                </p>
              )}
            </>
          )}
        </div>

        {/* Modal de Retornar para Produção */}
        {tipoOrdem === 'qualidade' && ordem && (
          <RetornarProducaoModal
            open={retornarModalOpen}
            onOpenChange={setRetornarModalOpen}
            pedidoId={ordem.pedido_id}
            ordemQualidadeId={ordem.id}
            clienteNome={ordem.pedido?.cliente_nome}
            numeroPedido={ordem.pedido?.numero_pedido}
            onSuccess={() => {
              onOpenChange(false);
              onRetornarProducao?.();
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
