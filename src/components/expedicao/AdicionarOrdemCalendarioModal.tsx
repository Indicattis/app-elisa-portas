import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { OrdemCarregamentoUnificada } from "@/types/ordemCarregamentoUnificada";
import { useOrdensCarregamentoUnificadas } from "@/hooks/useOrdensCarregamentoUnificadas";
import { useVeiculos } from "@/hooks/useVeiculos";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Package, MapPin, Check, Ruler, Truck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AdicionarOrdemCalendarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSelecionada: Date;
  onConfirm: (params: {
    ordemId: string;
    fonte: 'ordens_carregamento' | 'instalacoes';
    data_carregamento: string;
    hora: string;
    tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro';
    responsavel_carregamento_id: string | null;
    responsavel_carregamento_nome: string;
  }) => Promise<void>;
  ordemPreSelecionada?: OrdemCarregamentoUnificada | null;
}

interface Responsavel {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  cor?: string;
}

export function AdicionarOrdemCalendarioModal({
  open,
  onOpenChange,
  dataSelecionada,
  onConfirm,
  ordemPreSelecionada
}: AdicionarOrdemCalendarioModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemCarregamentoUnificada | null>(null);
  const [dataSelecionadaCalendario, setDataSelecionadaCalendario] = useState<Date | undefined>(undefined);
  const [responsavelTipo, setResponsavelTipo] = useState<"elisa" | "autorizados" | "terceiro">("elisa");
  const [responsavelId, setResponsavelId] = useState("");
  const [responsavelNomeTerceiro, setResponsavelNomeTerceiro] = useState("");
  const [equipes, setEquipes] = useState<Responsavel[]>([]);
  const [autorizados, setAutorizados] = useState<Responsavel[]>([]);
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Usar hook unificado que busca de ambas as fontes (ordens_carregamento e instalacoes)
  const { ordens: todasOrdens, isLoading: loadingOrdens } = useOrdensCarregamentoUnificadas();
  const { veiculos, isLoading: loadingVeiculos } = useVeiculos();
  
  // Filtrar apenas ordens SEM data de carregamento (disponíveis para agendamento)
  const ordens = todasOrdens.filter(o => !o.data_carregamento);

  const isEntrega = ordemSelecionada?.tipo_entrega === 'entrega';

  useEffect(() => {
    if (open) {
      loadResponsaveis();
      
      // Se tem ordem pré-selecionada, usa ela
      if (ordemPreSelecionada) {
        setOrdemSelecionada(ordemPreSelecionada);
      } else {
        setOrdemSelecionada(null);
      }
      
      setSearchTerm("");
      setDataSelecionadaCalendario(dataSelecionada);
      setResponsavelTipo("elisa");
      setResponsavelId("");
      setResponsavelNomeTerceiro("");
    }
  }, [open, ordemPreSelecionada, dataSelecionada]);

  const loadResponsaveis = async () => {
    setLoadingResponsaveis(true);
    try {
      const [equipesRes, autorizadosRes] = await Promise.all([
        supabase
          .from("equipes_instalacao")
          .select("id, nome, cor")
          .eq("ativa", true)
          .order("nome"),
        supabase
          .from("autorizados")
          .select("id, nome, cidade, estado")
          .eq("ativo", true)
          .eq("tipo_parceiro", "autorizado")
          .order("nome")
      ]);

      if (equipesRes.error) throw equipesRes.error;
      if (autorizadosRes.error) throw autorizadosRes.error;

      setEquipes(equipesRes.data || []);
      setAutorizados(autorizadosRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar responsáveis:", error);
      toast.error("Erro ao carregar opções de responsáveis");
    } finally {
      setLoadingResponsaveis(false);
    }
  };

  // Formatar tamanhos das portas de enrolar
  const formatarTamanhosPortas = (ordem: OrdemCarregamentoUnificada): string | null => {
    const produtos = ordem.venda?.produtos;
    if (!produtos || produtos.length === 0) return null;

    const portasEnrolar = produtos.filter(p => 
      p.tipo_produto?.toLowerCase().includes('porta') && 
      (p.largura || p.altura || p.tamanho)
    );

    if (portasEnrolar.length === 0) return null;

    return portasEnrolar.map(p => {
      if (p.tamanho) return p.tamanho;
      if (p.largura && p.altura) return `${p.largura}m × ${p.altura}m`;
      return null;
    }).filter(Boolean).join(', ');
  };

  // Filtrar ordens por termo de busca
  const ordensFiltradas = ordens.filter((ordem) => {
    const termo = searchTerm.toLowerCase();
    return (
      ordem.nome_cliente.toLowerCase().includes(termo) ||
      ordem.pedido?.numero_pedido?.toLowerCase().includes(termo) ||
      ordem.venda?.cidade?.toLowerCase().includes(termo) ||
      ordem.venda?.estado?.toLowerCase().includes(termo)
    );
  });

  const handleSelectOrdem = (ordem: OrdemCarregamentoUnificada) => {
    setOrdemSelecionada(ordem);
    setResponsavelTipo("elisa");
    setResponsavelId("");
    setResponsavelNomeTerceiro("");
  };

  const handleConfirm = async () => {
    if (!ordemSelecionada) {
      toast.error("Selecione uma ordem");
      return;
    }

    if (!dataSelecionadaCalendario) {
      toast.error("Selecione uma data");
      return;
    }

    // Validações específicas por tipo
    if (isEntrega) {
      if (responsavelTipo === 'elisa' && !responsavelId) {
        toast.error("Selecione um veículo");
        return;
      }
      if (responsavelTipo === 'terceiro' && !responsavelNomeTerceiro.trim()) {
        toast.error("Informe o nome do terceiro");
        return;
      }
    } else {
      if (responsavelTipo === 'elisa' && !responsavelId) {
        toast.error("Selecione uma equipe");
        return;
      }
      if (responsavelTipo === 'autorizados' && !responsavelId) {
        toast.error("Selecione um autorizado");
        return;
      }
    }

    setSubmitting(true);
    try {
      let responsavelNome = '';
      let finalResponsavelId: string | null = responsavelId || null;

      if (isEntrega) {
        if (responsavelTipo === 'elisa') {
          const veiculo = veiculos.find(v => v.id === responsavelId);
          responsavelNome = veiculo?.nome || '';
        } else {
          responsavelNome = responsavelNomeTerceiro.trim();
          finalResponsavelId = null;
        }
      } else {
        const lista = responsavelTipo === "elisa" ? equipes : autorizados;
        const responsavel = lista.find((r) => r.id === responsavelId);
        responsavelNome = responsavel?.nome || '';
      }

      // Hora padrão "08:00" para todos (removido campo de hora)
      const horaFinal = "08:00";

      await onConfirm({
        ordemId: ordemSelecionada.id,
        fonte: ordemSelecionada.fonte,
        data_carregamento: format(dataSelecionadaCalendario, "yyyy-MM-dd"),
        hora: horaFinal,
        tipo_carregamento: responsavelTipo,
        responsavel_carregamento_id: finalResponsavelId,
        responsavel_carregamento_nome: responsavelNome
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adicionar ordem:", error);
      toast.error("Erro ao adicionar ordem ao calendário");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Adicionar ao Calendário
          </DialogTitle>
          <DialogDescription className="sr-only">
            Selecione uma ordem e configure o agendamento
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-4">
          {/* Busca e Lista de Ordens */}
          {!ordemPreSelecionada && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, pedido, localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[200px] border rounded-lg">
                {loadingOrdens ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : ordensFiltradas.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-4 text-muted-foreground text-sm">
                    Nenhuma ordem disponível
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {ordensFiltradas.map((ordem) => (
                      <button
                        key={ordem.id}
                        type="button"
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          ordemSelecionada?.id === ordem.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        }`}
                        onClick={() => handleSelectOrdem(ordem)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{ordem.nome_cliente}</div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {ordem.pedido?.numero_pedido || 'N/A'}
                              </span>
                              {ordem.venda?.cidade && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {ordem.venda.cidade}/{ordem.venda.estado}
                                </span>
                              )}
                              {formatarTamanhosPortas(ordem) && (
                                <span className="flex items-center gap-1">
                                  <Ruler className="h-3 w-3" />
                                  {formatarTamanhosPortas(ordem)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={ordem.tipo_entrega === 'entrega' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs shrink-0",
                                ordem.tipo_entrega === 'instalacao' && "bg-orange-500/20 text-orange-600 border-orange-500/30",
                                ordem.tipo_entrega === 'manutencao' && "bg-purple-500/20 text-purple-600 border-purple-500/30"
                              )}
                            >
                              {ordem.tipo_entrega === 'entrega' && <Truck className="h-3 w-3 mr-1" />}
                              {ordem.tipo_entrega !== 'entrega' && <Wrench className="h-3 w-3 mr-1" />}
                              {ordem.tipo_entrega === 'entrega' ? 'Entrega' : 
                               ordem.tipo_entrega === 'manutencao' ? 'Manutenção' : 'Instalação'}
                            </Badge>
                            {ordemSelecionada?.id === ordem.id && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}

          {/* Ordem pré-selecionada */}
          {ordemPreSelecionada && ordemSelecionada && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ordemSelecionada.nome_cliente}</p>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {ordemSelecionada.pedido?.numero_pedido || 'N/A'}
                    </span>
                    {ordemSelecionada.venda?.cidade && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ordemSelecionada.venda.cidade}/{ordemSelecionada.venda.estado}
                      </span>
                    )}
                    {formatarTamanhosPortas(ordemSelecionada) && (
                      <span className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        {formatarTamanhosPortas(ordemSelecionada)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={isEntrega ? 'default' : 'secondary'}>
                  {isEntrega ? 'Entrega' : 'Instalação'}
                </Badge>
              </div>
            </div>
          )}

          {/* Configuração - só aparece quando ordem está selecionada */}
          {ordemSelecionada && (
            <div className="space-y-4 pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground">
                Configurar {isEntrega ? 'Entrega' : 'Instalação'}
              </div>

              {/* Calendário compacto para selecionar data */}
              <div className="space-y-2">
                <Label>Data do Carregamento *</Label>
                <div className="border rounded-lg flex justify-center py-2">
                  <Calendar
                    mode="single"
                    selected={dataSelecionadaCalendario}
                    onSelect={setDataSelecionadaCalendario}
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    className={cn(
                      "p-0 pointer-events-auto",
                      "[&_table]:text-xs",
                      "[&_th]:p-1 [&_th]:text-xs [&_th]:font-medium",
                      "[&_td]:p-0",
                      "[&_.rdp-button]:h-8 [&_.rdp-button]:w-8 [&_.rdp-button]:text-xs",
                      "[&_.rdp-head_button]:h-7 [&_.rdp-head_button]:w-7",
                      "[&_.rdp-caption]:text-sm [&_.rdp-caption]:py-1"
                    )}
                  />
                </div>
                {dataSelecionadaCalendario && (
                  <p className="text-sm text-muted-foreground text-center">
                    {format(dataSelecionadaCalendario, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                )}
              </div>

              {/* Tipo de Responsável */}
              <div className="space-y-3">
                <Label>
                  {isEntrega ? 'Tipo de Carregamento' : 'Responsável pela Instalação'} *
                </Label>
                <RadioGroup
                  value={responsavelTipo}
                  onValueChange={(value) => {
                    setResponsavelTipo(value as "elisa" | "autorizados" | "terceiro");
                    setResponsavelId("");
                    setResponsavelNomeTerceiro("");
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="elisa" id="elisa" />
                    <Label htmlFor="elisa" className="font-normal cursor-pointer">
                      {isEntrega ? 'Elisa' : 'Equipe Elisa'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={isEntrega ? "terceiro" : "autorizados"} id="outros" />
                    <Label htmlFor="outros" className="font-normal cursor-pointer">
                      {isEntrega ? 'Terceiro' : 'Autorizado'}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Select do responsável */}
              {isEntrega && responsavelTipo === 'terceiro' ? (
                <div className="space-y-2">
                  <Label htmlFor="nome-terceiro">Nome do Terceiro *</Label>
                  <Input
                    id="nome-terceiro"
                    type="text"
                    placeholder="Digite o nome do responsável"
                    value={responsavelNomeTerceiro}
                    onChange={(e) => setResponsavelNomeTerceiro(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>
                    {isEntrega 
                      ? 'Veículo *'
                      : (responsavelTipo === 'elisa' ? 'Equipe *' : 'Autorizado *')
                    }
                  </Label>
                  <Select
                    value={responsavelId}
                    onValueChange={setResponsavelId}
                    disabled={loadingResponsaveis || (isEntrega && loadingVeiculos)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingResponsaveis || (isEntrega && loadingVeiculos)
                          ? "Carregando..."
                          : "Selecione..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isEntrega && responsavelTipo === 'elisa' ? (
                        veiculos.filter(v => v.ativo).map((veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.id}>
                            {veiculo.nome}
                          </SelectItem>
                        ))
                      ) : responsavelTipo === "elisa" ? (
                        equipes.map((equipe) => (
                          <SelectItem key={equipe.id} value={equipe.id}>
                            <div className="flex items-center gap-2">
                              {equipe.cor && (
                                <span
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: equipe.cor }}
                                />
                              )}
                              {equipe.nome}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        autorizados.map((autorizado) => (
                          <SelectItem key={autorizado.id} value={autorizado.id}>
                            {autorizado.nome} - {autorizado.cidade}/{autorizado.estado}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4 shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={submitting || !ordemSelecionada}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
