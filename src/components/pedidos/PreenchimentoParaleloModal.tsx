import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Ruler, Package, FileText, MessageSquare, RefreshCw, Save } from "lucide-react";
import { MedidasPortasSection } from "./MedidasPortasSection";
import { PedidoLinhasEditor } from "./PedidoLinhasEditor";
import { ObservacoesPortaForm } from "./ObservacoesPortaForm";
import { ObservacoesPortaSocialForm } from "./ObservacoesPortaSocialForm";
import { PortaFolderCard } from "./PortaFolderCard";
import { getLabelProdutoExpandido } from "@/utils/tipoProdutoLabels";
import type { PedidoLinha, PedidoLinhaNova, CategoriaLinha } from "@/hooks/usePedidoLinhas";
import { cn } from "@/lib/utils";

interface LinhaEditData {
  produto_venda_id?: string | null;
  indice_porta?: number;
  estoque_id?: string;
  nome_produto?: string;
  descricao_produto?: string;
  quantidade?: number;
  tamanho?: string;
  categoria_linha?: CategoriaLinha;
}

interface PreenchimentoParaleloModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Dados do pedido
  pedidoId: string;
  vendaId?: string;
  produtos: any[];
  linhas: PedidoLinha[];
  portasEnrolar: any[];
  portasSocial: any[];
  observacoesTexto: string;
  observacoesPedido: string | null;
  // Handlers
  onAdicionarLinha: (linha: PedidoLinhaNova) => Promise<any>;
  onRemoverLinha: (linhaId: string) => Promise<void>;
  onAtualizarLinha?: (linhaId: string, campo: 'quantidade' | 'tamanho', valor: number | string) => void;
  onAtualizarLinhaCompleta?: (linhaId: string, dados: LinhaEditData) => Promise<void>;
  onRefresh: () => void;
  // Observações visita técnica
  usuarios: Array<{ id: string; nome: string }>;
  autorizados: Array<{ id: string; nome: string }>;
  getObservacoesPorPorta: (produtoVendaId: string, indicePorta: number) => any;
  getObservacoesSocialPorPorta: (produtoVendaId: string, indicePorta: number) => any;
  salvarObservacao: (dados: any) => Promise<any>;
  salvarObservacaoSocial: (dados: any) => Promise<any>;
  // Observações do pedido
  onSalvarObservacoes: (texto: string) => Promise<void>;
}

interface EtapaConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export function PreenchimentoParaleloModal({
  open,
  onOpenChange,
  pedidoId,
  vendaId,
  produtos,
  linhas,
  portasEnrolar,
  portasSocial,
  observacoesTexto: observacoesIniciais,
  observacoesPedido,
  onAdicionarLinha,
  onRemoverLinha,
  onAtualizarLinha,
  onAtualizarLinhaCompleta,
  onRefresh,
  usuarios,
  autorizados,
  getObservacoesPorPorta,
  getObservacoesSocialPorPorta,
  salvarObservacao,
  salvarObservacaoSocial,
  onSalvarObservacoes,
}: PreenchimentoParaleloModalProps) {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [obsTexto, setObsTexto] = useState(observacoesIniciais || "");
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [pastaObsAberta, setPastaObsAberta] = useState<string | null>(null);
  const [pastaSocialAberta, setPastaSocialAberta] = useState<string | null>(null);

  const temPortasEnrolar = portasEnrolar.length > 0;
  const temPortasSocial = portasSocial.length > 0;
  const temPortas = temPortasEnrolar || temPortasSocial;

  // Build dynamic steps
  const etapas: EtapaConfig[] = [];
  if (temPortas) {
    etapas.push({ id: 'medidas', label: 'Medidas', icon: <Ruler className="w-4 h-4" /> });
  }
  etapas.push({ id: 'itens', label: 'Itens', icon: <Package className="w-4 h-4" /> });
  if (temPortasEnrolar || temPortasSocial) {
    etapas.push({ id: 'observacoes_visita', label: 'Visita Técnica', icon: <FileText className="w-4 h-4" /> });
  }
  etapas.push({ id: 'observacoes_pedido', label: 'Observações', icon: <MessageSquare className="w-4 h-4" /> });

  const etapaAtualConfig = etapas[etapaAtual];
  const isUltimaEtapa = etapaAtual === etapas.length - 1;
  const isPrimeiraEtapa = etapaAtual === 0;

  const handleConcluir = async () => {
    if (obsTexto.trim() !== (observacoesPedido || "")) {
      setSalvandoObs(true);
      try {
        await onSalvarObservacoes(obsTexto);
      } finally {
        setSalvandoObs(false);
      }
    }
    onOpenChange(false);
    onRefresh();
    // Reset state for next open
    setEtapaAtual(0);
    setPastaObsAberta(null);
    setPastaSocialAberta(null);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setEtapaAtual(0);
      setPastaObsAberta(null);
      setPastaSocialAberta(null);
    }
    onOpenChange(val);
  };

  const renderConteudo = () => {
    switch (etapaAtualConfig?.id) {
      case 'medidas':
        return (
          <MedidasPortasSection
            produtos={produtos}
            onRefresh={onRefresh}
          />
        );

      case 'itens':
        return (
          <PedidoLinhasEditor
            linhas={linhas}
            isReadOnly={false}
            vendaId={vendaId}
            temPortasEnrolar={temPortasEnrolar}
            onAdicionarLinha={onAdicionarLinha}
            onRemoverLinha={onRemoverLinha}
            onAtualizarLinha={onAtualizarLinha}
            onAtualizarLinhaCompleta={onAtualizarLinhaCompleta}
          />
        );

      case 'observacoes_visita':
        return (
          <div className="space-y-4">
            {/* Portas de Enrolar */}
            {temPortasEnrolar && (
              <div>
                <h4 className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
                  Portas de Enrolar ({portasEnrolar.length})
                </h4>
                {!pastaObsAberta ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {portasEnrolar.map((porta: any, idx: number) => {
                      const obs = getObservacoesPorPorta(porta._originalId, porta._indicePorta);
                      const preenchido = !!obs?.responsavel_medidas_id;
                      const dimensoes = porta.largura && porta.altura
                        ? `${porta.largura.toFixed(2)}m × ${porta.altura.toFixed(2)}m`
                        : porta.tamanho || undefined;
                      return (
                        <PortaFolderCard
                          key={porta._virtualKey}
                          label={getLabelProdutoExpandido(idx, porta.tipo_produto, null, null, porta._totalNoGrupo, porta._indicePorta)}
                          dimensoes={dimensoes}
                          statusBadge={preenchido ? 'Preenchido' : 'Pendente'}
                          statusVariant={preenchido ? 'default' : 'outline'}
                          isOpen={false}
                          onClick={() => setPastaObsAberta(porta._virtualKey)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-3 text-muted-foreground"
                      onClick={() => setPastaObsAberta(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar às pastas
                    </Button>
                    {portasEnrolar.map((porta: any, idx: number) =>
                      porta._virtualKey === pastaObsAberta ? (
                        <ObservacoesPortaForm
                          key={porta._virtualKey}
                          porta={porta}
                          portaIndex={idx}
                          usuarios={usuarios}
                          autorizados={autorizados}
                          valoresIniciais={getObservacoesPorPorta(porta._originalId, porta._indicePorta)}
                          onSalvar={salvarObservacao}
                          pedidoId={pedidoId}
                          defaultOpen={true}
                          isReadOnly={false}
                        />
                      ) : null
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Portas Sociais */}
            {temPortasSocial && (
              <div>
                <h4 className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
                  Portas Sociais ({portasSocial.length})
                </h4>
                {!pastaSocialAberta ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {portasSocial.map((porta: any, idx: number) => {
                      const obs = getObservacoesSocialPorPorta(porta._originalId, porta._indicePorta);
                      const preenchido = !!(obs?.lado_fechadura || obs?.lado_abertura || obs?.acabamento);
                      const dimensoes = porta.largura && porta.altura
                        ? `${porta.largura.toFixed(2)}m × ${porta.altura.toFixed(2)}m`
                        : porta.tamanho || undefined;
                      return (
                        <PortaFolderCard
                          key={porta._virtualKey}
                          label={getLabelProdutoExpandido(idx, porta.tipo_produto, null, null, porta._totalNoGrupo, porta._indicePorta)}
                          dimensoes={dimensoes}
                          statusBadge={preenchido ? 'Preenchido' : 'Pendente'}
                          statusVariant={preenchido ? 'default' : 'outline'}
                          isOpen={false}
                          onClick={() => setPastaSocialAberta(porta._virtualKey)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-3 text-muted-foreground"
                      onClick={() => setPastaSocialAberta(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar às pastas
                    </Button>
                    {portasSocial.map((porta: any, idx: number) =>
                      porta._virtualKey === pastaSocialAberta ? (
                        <ObservacoesPortaSocialForm
                          key={porta._virtualKey}
                          porta={porta}
                          portaIndex={idx}
                          valoresIniciais={getObservacoesSocialPorPorta(porta._originalId, porta._indicePorta)}
                          onSalvar={salvarObservacaoSocial}
                          pedidoId={pedidoId}
                          defaultOpen={true}
                          isReadOnly={false}
                        />
                      ) : null
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'observacoes_pedido':
        return (
          <div className="space-y-3">
            <p className="text-xs text-white/50">
              Adicione observações gerais sobre este pedido.
            </p>
            <Textarea
              placeholder="Adicione observações sobre este pedido..."
              value={obsTexto}
              onChange={(e) => setObsTexto(e.target.value)}
              className="min-h-[150px] bg-primary/5 border-primary/10 text-white placeholder:text-white/40 resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-background border-primary/20">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white flex items-center gap-2">
            {etapaAtualConfig?.icon}
            {etapaAtualConfig?.label}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preenchimento do pedido - Etapa {etapaAtual + 1} de {etapas.length}
          </DialogDescription>

          {/* Stepper */}
          <div className="flex items-center gap-1 pt-2">
            {etapas.map((etapa, idx) => (
              <div key={etapa.id} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setEtapaAtual(idx)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all w-full justify-center",
                    idx === etapaAtual
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : idx < etapaAtual
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-white/5 text-white/40 border border-white/10"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                    idx === etapaAtual
                      ? "bg-primary/30 text-primary"
                      : idx < etapaAtual
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/10 text-white/30"
                  )}>
                    {idx < etapaAtual ? <Check className="w-3 h-3" /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline truncate">{etapa.label}</span>
                </button>
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {renderConteudo()}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEtapaAtual(prev => prev - 1)}
            disabled={isPrimeiraEtapa}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          <span className="text-xs text-white/40">
            {etapaAtual + 1} de {etapas.length}
          </span>

          {isUltimaEtapa ? (
            <Button
              size="sm"
              onClick={handleConcluir}
              disabled={salvandoObs}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {salvandoObs ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Concluir
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setEtapaAtual(prev => prev + 1)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
