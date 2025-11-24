import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Package, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SelecionarOrdemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSelecionada: Date;
  onConfirm: (ordemId: string, hora: string, responsavelTipo: 'elisa' | 'autorizados', responsavelId: string, responsavelNome: string) => Promise<void>;
}

export function SelecionarOrdemModal({
  open,
  onOpenChange,
  dataSelecionada,
  onConfirm
}: SelecionarOrdemModalProps) {
  const [ordens, setOrdens] = useState<OrdemCarregamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState("");
  const [hora, setHora] = useState("08:00");
  const [responsavelTipo, setResponsavelTipo] = useState<"elisa" | "autorizados">("elisa");
  const [responsavelId, setResponsavelId] = useState("");
  const [equipes, setEquipes] = useState<any[]>([]);
  const [autorizados, setAutorizados] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadOrdens();
      loadResponsaveis();
      // Reset form
      setOrdemSelecionadaId("");
      setHora("08:00");
      setResponsavelTipo("elisa");
      setResponsavelId("");
      setSearchTerm("");
    }
  }, [open]);

  const loadOrdens = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ordens_carregamento")
        .select(`
          *,
          venda:vendas(
            id,
            cliente_nome,
            cidade,
            estado
          ),
          pedido:pedidos_producao(
            id,
            numero_pedido
          )
        `)
        .is("data_carregamento", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrdens((data || []) as OrdemCarregamento[]);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
      toast.error("Erro ao carregar ordens disponíveis");
    } finally {
      setLoading(false);
    }
  };

  const loadResponsaveis = async () => {
    try {
      // Carregar equipes
      const { data: equipesData, error: equipesError } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true)
        .order("nome");

      if (equipesError) throw equipesError;
      setEquipes(equipesData || []);

      // Carregar autorizados
      const { data: autorizadosData, error: autorizadosError } = await supabase
        .from("autorizados")
        .select("id, nome, cidade, estado")
        .eq("ativo", true)
        .eq("tipo_parceiro", "autorizado")
        .order("nome");

      if (autorizadosError) throw autorizadosError;
      setAutorizados(autorizadosData || []);
    } catch (error) {
      console.error("Erro ao carregar responsáveis:", error);
      toast.error("Erro ao carregar opções de responsáveis");
    }
  };

  const ordensFiltradas = ordens.filter((ordem) => {
    const termo = searchTerm.toLowerCase();
    return (
      ordem.nome_cliente.toLowerCase().includes(termo) ||
      ordem.pedido?.numero_pedido.toLowerCase().includes(termo) ||
      ordem.venda?.cidade?.toLowerCase().includes(termo)
    );
  });

  const handleConfirm = async () => {
    if (!ordemSelecionadaId) {
      toast.error("Selecione uma ordem");
      return;
    }

    if (!hora) {
      toast.error("Informe a hora do carregamento");
      return;
    }

    if (!responsavelId) {
      toast.error("Selecione o responsável");
      return;
    }

    setSubmitting(true);
    try {
      const responsaveis = responsavelTipo === "elisa" ? equipes : autorizados;
      const responsavel = responsaveis.find((r) => r.id === responsavelId);

      if (!responsavel) {
        toast.error("Responsável não encontrado");
        return;
      }

      await onConfirm(ordemSelecionadaId, hora, responsavelTipo, responsavelId, responsavel.nome);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao confirmar:", error);
      toast.error("Erro ao adicionar ordem ao calendário");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Adicionar Ordem ao Dia {format(dataSelecionada, "dd/MM/yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label>Selecione a ordem de carregamento</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, pedido, localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de Ordens */}
          <ScrollArea className="h-[200px] rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : ordensFiltradas.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchTerm ? "Nenhuma ordem encontrada" : "Nenhuma ordem disponível"}
              </div>
            ) : (
              <RadioGroup value={ordemSelecionadaId} onValueChange={setOrdemSelecionadaId}>
                <div className="space-y-1 p-2">
                  {ordensFiltradas.map((ordem) => (
                    <label
                      key={ordem.id}
                      htmlFor={`ordem-${ordem.id}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                        ordemSelecionadaId === ordem.id ? "bg-accent border-primary" : ""
                      }`}
                    >
                      <RadioGroupItem value={ordem.id} id={`ordem-${ordem.id}`} className="mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{ordem.nome_cliente}</p>
                          <Badge
                            variant={ordem.tipo_carregamento === 'elisa' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Autorizado'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{ordem.pedido?.numero_pedido || 'N/A'}</span>
                          </div>
                          {ordem.venda && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {ordem.venda.cidade}/{ordem.venda.estado}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            )}
          </ScrollArea>

          {/* Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora">Hora do carregamento *</Label>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          {/* Tipo de Responsável */}
          <div className="space-y-2">
            <Label>Tipo de Responsável *</Label>
            <RadioGroup
              value={responsavelTipo}
              onValueChange={(value) => {
                setResponsavelTipo(value as "elisa" | "autorizados");
                setResponsavelId("");
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="elisa" id="tipo-elisa" />
                <Label htmlFor="tipo-elisa" className="font-normal cursor-pointer">
                  Instalação Elisa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="autorizados" id="tipo-autorizados" />
                <Label htmlFor="tipo-autorizados" className="font-normal cursor-pointer">
                  Autorizado
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label>
              {responsavelTipo === "elisa" ? "Equipe" : "Autorizado"} *
            </Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {responsavelTipo === "elisa" ? (
                  equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      <div className="flex items-center gap-2">
                        {equipe.cor && (
                          <span
                            className="h-3 w-3 rounded-full"
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
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || !ordemSelecionadaId}>
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
