import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditarOrdemCarregamentoDrawerProps {
  ordem: OrdemCarregamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    data_carregamento: string;
    hora_carregamento: string;
    tipo_carregamento: 'elisa' | 'autorizados';
    responsavel_carregamento_id: string;
    responsavel_carregamento_nome: string;
  }) => Promise<void>;
}

export const EditarOrdemCarregamentoDrawer = ({
  ordem,
  open,
  onOpenChange,
  onSave,
}: EditarOrdemCarregamentoDrawerProps) => {
  const [dataCarregamento, setDataCarregamento] = useState<Date | undefined>();
  const [hora, setHora] = useState("08:00");
  const [responsavelTipo, setResponsavelTipo] = useState<"elisa" | "autorizados">("elisa");
  const [responsavelId, setResponsavelId] = useState("");
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form quando o drawer abre/fecha ou ordem muda
  useEffect(() => {
    if (open && ordem) {
      if (ordem.data_carregamento) {
        setDataCarregamento(new Date(ordem.data_carregamento));
      }
      if (ordem.hora || ordem.hora_carregamento) {
        setHora(ordem.hora || ordem.hora_carregamento || "08:00");
      }
      if (ordem.tipo_carregamento) {
        setResponsavelTipo(ordem.tipo_carregamento as "elisa" | "autorizados");
      }
      if (ordem.responsavel_carregamento_id) {
        setResponsavelId(ordem.responsavel_carregamento_id);
      }
    } else {
      // Reset
      setDataCarregamento(undefined);
      setHora("08:00");
      setResponsavelTipo("elisa");
      setResponsavelId("");
    }
  }, [open, ordem]);

  // Carregar responsáveis quando o tipo muda
  useEffect(() => {
    if (open) {
      loadResponsaveis();
    }
  }, [responsavelTipo, open]);

  const loadResponsaveis = async () => {
    setLoading(true);
    try {
      if (responsavelTipo === "elisa") {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome");

        if (error) throw error;
        setResponsaveis(data || []);
      } else {
        const { data, error } = await supabase
          .from("autorizados")
          .select("id, nome, cidade, estado")
          .eq("ativo", true)
          .order("nome");

        if (error) throw error;
        setResponsaveis(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar responsáveis:", error);
      toast.error("Erro ao carregar responsáveis");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!dataCarregamento) {
      toast.error("Selecione uma data");
      return;
    }

    if (!hora) {
      toast.error("Informe a hora");
      return;
    }

    if (!responsavelId) {
      toast.error("Selecione um responsável");
      return;
    }

    const responsavel = responsaveis.find(r => r.id === responsavelId);
    if (!responsavel) {
      toast.error("Responsável não encontrado");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        data_carregamento: format(dataCarregamento, "yyyy-MM-dd"),
        hora_carregamento: hora,
        tipo_carregamento: responsavelTipo,
        responsavel_carregamento_id: responsavelId,
        responsavel_carregamento_nome: responsavel.nome,
      });

      toast.success("Ordem atualizada com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Carregamento</SheetTitle>
          <SheetDescription>
            Altere os dados de agendamento do carregamento
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Informações da ordem (read-only) */}
          {ordem && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {ordem.venda?.cliente_nome || ordem.nome_cliente}
                </span>
              </div>
              {ordem.pedido && (
                <div className="text-xs text-muted-foreground">
                  Pedido: {ordem.pedido.numero_pedido}
                </div>
              )}
              {ordem.venda?.cidade && ordem.venda?.estado && (
                <div className="text-xs text-muted-foreground">
                  {ordem.venda.cidade} - {ordem.venda.estado}
                </div>
              )}
            </div>
          )}

          {/* Data */}
          <div className="space-y-2">
            <Label>Data do Carregamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataCarregamento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataCarregamento ? (
                    format(dataCarregamento, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataCarregamento}
                  onSelect={setDataCarregamento}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <Label htmlFor="hora">Hora</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tipo de Responsável */}
          <div className="space-y-2">
            <Label>Tipo de Carregamento</Label>
            <Select
              value={responsavelTipo}
              onValueChange={(value: "elisa" | "autorizados") => {
                setResponsavelTipo(value);
                setResponsavelId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elisa">Elisa Portas</SelectItem>
                <SelectItem value="autorizados">Autorizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select
              value={responsavelId}
              onValueChange={setResponsavelId}
              disabled={loading || responsaveis.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione"}>
                  {responsavelId && responsaveis.find(r => r.id === responsavelId)?.nome}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((resp) => (
                  <SelectItem key={resp.id} value={resp.id}>
                    {resp.nome}
                    {responsavelTipo === "autorizados" && resp.cidade && (
                      <span className="text-xs text-muted-foreground ml-2">
                        - {resp.cidade}/{resp.estado}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
