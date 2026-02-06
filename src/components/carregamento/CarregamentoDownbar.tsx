import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PackageCheck, Loader2, Truck, Tags, Wrench, FileText, Camera, X, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePedidoLinhas } from "@/hooks/usePedidoLinhas";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrdemCarregamentoUnificada } from "@/hooks/useOrdensCarregamentoUnificadas";
import { useEtiquetasProducao } from "@/hooks/useEtiquetasProducao";
import { gerarPDFEtiquetasProducaoMultiplas, gerarPDFEtiquetaProducao } from "@/utils/etiquetasPDFGenerator";
import { CarregamentoLoadingModal } from "./CarregamentoLoadingModal";
import { CoresPortasEnrolar } from "@/components/shared/CoresPortasEnrolar";

interface CarregamentoDownbarProps {
  ordem: OrdemCarregamentoUnificada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluir: (params: { observacoes?: string; fotoFile?: File }) => Promise<any>;
  onSuccess: () => void;
}

export function CarregamentoDownbar({
  ordem,
  open,
  onOpenChange,
  onConcluir,
  onSuccess,
}: CarregamentoDownbarProps) {
  const { linhas, isLoading } = usePedidoLinhas(ordem?.pedido_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingSuccess, setLoadingSuccess] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { calcularEtiquetasLinha } = useEtiquetasProducao();

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoverFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImprimirEtiquetas = () => {
    try {
      if (!linhas || linhas.length === 0) {
        toast.error("Nenhum item para imprimir");
        return;
      }

      const todasTags: any[] = [];
      linhas.forEach((linha) => {
        const linhaParaCalculo = {
          id: linha.id,
          item: linha.nome_produto || linha.descricao_produto || 'Item',
          quantidade: linha.quantidade || 1,
          tamanho: linha.tamanho,
          largura: linha.largura,
          altura: linha.altura,
          estoque_id: linha.estoque_id || undefined,
        };
        const calculo = calcularEtiquetasLinha(linhaParaCalculo);
        for (let i = 1; i <= calculo.etiquetasNecessarias; i++) {
          todasTags.push({
            tagNumero: i,
            totalTags: calculo.etiquetasNecessarias,
            nomeProduto: calculo.nomeProduto,
            numeroPedido: ordem?.pedido?.numero_pedido || '',
            quantidade: calculo.quantidade,
            largura: calculo.largura,
            altura: calculo.altura,
            clienteNome: ordem?.nome_cliente,
            tamanho: linha.tamanho,
            origemOrdem: 'Carregamento',
            responsavelNome: ordem?.responsavel_carregamento_nome || undefined,
          });
        }
      });

      if (todasTags.length === 0) {
        toast.error("Nenhuma etiqueta para gerar");
        return;
      }

      const doc = todasTags.length > 1
        ? gerarPDFEtiquetasProducaoMultiplas(todasTags)
        : gerarPDFEtiquetaProducao(todasTags[0]);

      const blobUrl = String(doc.output('bloburl'));
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:none;opacity:0;pointer-events:none';
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
            window.addEventListener('focus', () => {
              setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 100);
            }, { once: true });
            setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 10000);
          } catch (error) {
            console.error('Erro ao imprimir:', error);
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
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

  const handleConcluir = async () => {
    if (!fotoFile) {
      toast.error("Tire uma foto do carregamento antes de concluir");
      return;
    }
    if (!ordem?.id) return;

    setIsSubmitting(true);
    setShowLoadingModal(true);
    setLoadingSuccess(false);

    try {
      await onConcluir({
        observacoes: "Carregamento concluído via interface de produção",
        fotoFile,
      });
      setLoadingSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowLoadingModal(false);
      setFotoFile(null);
      setFotoPreview(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[Carregamento] Erro:', error);
      toast.error(error.message || "Erro ao concluir carregamento");
      setShowLoadingModal(false);
      setIsSubmitting(false);
    }
  };

  if (!ordem) return null;

  const isInstalacao = ordem.fonte === 'instalacoes';
  const Icon = isInstalacao ? Wrench : ordem.tipo_carregamento === 'elisa' ? Truck : PackageCheck;
  const tipoLabel = isInstalacao
    ? (ordem.tipo_entrega === 'manutencao' ? 'Manutenção' : 'Instalação')
    : (ordem.tipo_carregamento === 'elisa' ? 'Elisa' : 'Autorizado');

  return (
    <Sheet open={open} onOpenChange={(o) => {
      if (!o) { setFotoFile(null); setFotoPreview(null); setIsSubmitting(false); }
      onOpenChange(o);
    }}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl max-w-[700px] mx-auto bg-zinc-900 border-t border-white/10 p-0">
        {/* Header gradiente */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm px-6 py-4 rounded-t-2xl border-b border-white/10">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <div className="p-1.5 rounded-lg bg-white/10">
                <Icon className="h-4 w-4 text-blue-300" />
              </div>
              Carregamento — {tipoLabel}
            </SheetTitle>
          </SheetHeader>
        </div>

        <ScrollArea className="h-[calc(85vh-80px)] px-6 py-4">
          <div className="space-y-4 pb-4">
            {/* Hero card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-base">{ordem.nome_cliente}</p>
                  <p className="text-white/50 text-xs">Pedido {ordem.pedido?.numero_pedido || "N/A"}</p>
                </div>
                {ordem.data_carregamento && (
                  <div className="text-right">
                    <p className="text-white/50 text-xs">Agendado</p>
                    <p className="text-white/80 text-sm font-medium">
                      {format(new Date(ordem.data_carregamento + 'T12:00:00'), "dd/MM/yy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <CoresPortasEnrolar produtos={ordem.venda?.produtos} />
              </div>
              {/* Localização */}
              {(ordem.venda?.cidade || ordem.venda?.bairro) && (
                <p className="text-white/40 text-xs">
                  {[ordem.venda?.bairro, ordem.venda?.cidade, ordem.venda?.estado].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Observações do Pedido */}
            {ordem.pedido?.observacoes && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Observações do Pedido
                  </span>
                  {ordem.pedido?.updated_at && (
                    <span className="text-xs text-amber-400/50">
                      {format(new Date(ordem.pedido.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-200/80 whitespace-pre-line">{ordem.pedido.observacoes}</p>
              </div>
            )}

            {/* Itens do Carregamento - somente leitura */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/70">Itens do Carregamento</h3>
                {linhas && linhas.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-white/50 hover:text-white hover:bg-white/10"
                    onClick={handleImprimirEtiquetas}
                  >
                    <Tags className="h-3 w-3" />
                    Etiquetas
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                </div>
              ) : linhas && linhas.length > 0 ? (
                <div className="space-y-1.5">
                  {linhas.map((linha, index) => (
                    <div key={linha.id} className="bg-white/5 rounded-lg border border-white/5 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm text-white/80">
                        {index + 1}. {linha.nome_produto || linha.descricao_produto || "Item"}
                      </span>
                      <div className="flex gap-3 text-xs text-white/40">
                        <span>{linha.quantidade || 1}x</span>
                        {linha.tamanho && <span>{linha.tamanho}</span>}
                        {(linha.largura || linha.altura) && (
                          <span>{linha.largura}x{linha.altura}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/30 text-center py-6">
                  Nenhum item encontrado
                </p>
              )}
            </div>

            {/* Foto do Carregamento */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/70">Foto do Carregamento</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoChange}
                className="hidden"
              />

              {fotoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={fotoPreview} alt="Foto do carregamento" className="w-full h-48 object-cover" />
                  <button
                    onClick={handleRemoverFoto}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2.5 py-1">
                    <ImageIcon className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-300">Foto capturada</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/30 bg-white/5 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="p-3 rounded-full bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                    <Camera className="h-6 w-6 text-white/30 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-sm text-white/30 group-hover:text-white/50 transition-colors">
                    Tirar foto do carregamento
                  </span>
                </button>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white/70 hover:bg-white/5 hover:text-white bg-transparent"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30"
                onClick={handleConcluir}
                disabled={!fotoFile || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Concluindo...
                  </>
                ) : (
                  <>
                    <Icon className="mr-2 h-4 w-4" />
                    Concluir Carregamento
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>

      <CarregamentoLoadingModal open={showLoadingModal} success={loadingSuccess} />
    </Sheet>
  );
}
