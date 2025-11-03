import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle, Package, UserCheck, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrdemPDFData } from "@/hooks/useOrdemPDFData";
import { baixarOrdemProducaoPDF } from "@/utils/ordemProducaoPDFGenerator";
import { toast } from "sonner";
import { OrigemBadges } from "@/components/shared/OrigemBadges";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  concluida: boolean;
}

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  observacoes?: string;
  responsavel_id?: string;
  linhas?: LinhaOrdem[];
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    venda_id?: string;
  };
  admin_users?: {
    nome: string;
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
}

const TIPO_LABELS: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
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
}: OrdemDetalhesSheetProps) {
  const { user } = useAuth();
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const { buscarDadosOrdem } = useOrdemPDFData();
  
  if (!ordem) return null;

  const linhas = ordem.linhas || [];
  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const todasConcluidas = linhas.length > 0 && linhas.every(l => l.concluida);
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;
  
  const isResponsavel = ordem.responsavel_id === user?.id;
  const temResponsavel = !!ordem.responsavel_id;
  const podeMarcarLinhas = temResponsavel && isResponsavel;

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {ordem.numero_ordem}
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloadingPDF ? "Gerando..." : "PDF"}
            </Button>
          </div>
          <SheetDescription>
            Detalhes da ordem de {TIPO_LABELS[tipoOrdem].toLowerCase()}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações da ordem */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="text-sm font-medium">{ordem.pedido?.cliente_nome}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={
                ordem.status === 'concluido' || ordem.status === 'pronta' ? 'default' : 'secondary'
              }>
                {tipoOrdem === 'pintura' ? (
                  ordem.status === 'pendente' ? 'Para Pintar' :
                  ordem.status === 'pintando' ? 'Pintando' :
                  ordem.status === 'pronta' ? 'Pronta' : ordem.status
                ) : (
                  ordem.status === 'concluido' ? 'Concluído' : 'Pendente'
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {linhasConcluidas}/{linhas.length}
                </span>
                <Badge variant="outline">{progresso}%</Badge>
              </div>
            </div>

            {/* Responsável */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Responsável</span>
              {temResponsavel ? (
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {ordem.admin_users?.nome || 'Atribuído'}
                  </span>
                  {isResponsavel && (
                    <Badge variant="default" className="text-xs">Você</Badge>
                  )}
                </div>
              ) : (
                <Badge variant="secondary">Não atribuído</Badge>
              )}
            </div>
          </div>

          {/* Origem - Pedido e Venda */}
          {(ordem.pedido?.id || ordem.pedido?.venda_id) && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Documentos de Origem</span>
                <OrigemBadges
                  pedidoId={ordem.pedido?.id}
                  pedidoNumero={ordem.pedido?.numero_pedido}
                  vendaId={ordem.pedido?.venda_id}
                  size="default"
                  orientation="horizontal"
                />
              </div>
            </>
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
              <span className="text-sm font-medium">Itens de Produção</span>
              {todasConcluidas && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Todas concluídas
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {linhas.map((linha) => (
                <Label
                  key={linha.id}
                  htmlFor={`checkbox-${linha.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
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
                      <span className={`text-sm font-medium ${linha.concluida ? 'line-through text-muted-foreground' : ''}`}>
                        {linha.item}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Qtd: {linha.quantidade}</span>
                      {linha.tamanho && <span>Tamanho: {linha.tamanho}</span>}
                    </div>
                  </div>
                </Label>
              ))}

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
              {ordem.status === 'pendente' && podeMarcarLinhas && (
                <>
                  <Button
                    className="w-full"
                    disabled={isIniciando}
                    onClick={onIniciarPintura}
                  >
                    {isIniciando ? "Iniciando..." : "Iniciar Pintura"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Clique para mover a ordem para "Pintando"
                  </p>
                </>
              )}
              {ordem.status === 'pintando' && podeMarcarLinhas && (
                <>
                  <Button
                    className="w-full"
                    disabled={!todasConcluidas || isFinalizando}
                    onClick={onFinalizarPintura}
                  >
                    {isFinalizando ? "Finalizando..." : "Finalizar Pintura"}
                  </Button>
                  {!todasConcluidas && linhas.length > 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Marque todos os itens como concluídos para finalizar
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
      </SheetContent>
    </Sheet>
  );
}
