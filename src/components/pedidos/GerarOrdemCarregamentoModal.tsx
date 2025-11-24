import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useAutorizadosAptos } from "@/hooks/useAutorizadosAptos";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GerarOrdemCarregamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onSuccess: () => void;
}

export function GerarOrdemCarregamentoModal({
  open,
  onOpenChange,
  pedido,
  onSuccess,
}: GerarOrdemCarregamentoModalProps) {
  const [dataCarregamento, setDataCarregamento] = useState<Date>();
  const [horaCarregamento, setHoraCarregamento] = useState("08:00");
  const [tipoCarregamento, setTipoCarregamento] = useState<"elisa" | "autorizados">("elisa");
  const [responsavelId, setResponsavelId] = useState("");
  const [loading, setLoading] = useState(false);

  const { equipes, loading: loadingEquipes } = useEquipesInstalacao();
  const { autorizados, loading: loadingAutorizados } = useAutorizadosAptos();

  const venda = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;

  const handleSubmit = async () => {
    if (!dataCarregamento || !horaCarregamento || !responsavelId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Buscar nome do responsável
      let responsavelNome = "";
      if (tipoCarregamento === "elisa") {
        const equipe = equipes.find(e => e.id === responsavelId);
        responsavelNome = equipe?.nome || "";
      } else {
        const autorizado = autorizados.find(a => a.id === responsavelId);
        responsavelNome = autorizado?.nome || "";
      }

      // Criar ordem de carregamento
      const { error } = await supabase.from("ordens_carregamento").insert({
        pedido_id: pedido.id,
        venda_id: pedido.venda_id,
        nome_cliente: venda?.cliente_nome || "",
        data_carregamento: format(dataCarregamento, "yyyy-MM-dd"),
        hora_carregamento: horaCarregamento,
        hora: horaCarregamento, // Manter compatibilidade
        tipo_carregamento: tipoCarregamento,
        responsavel_carregamento_id: responsavelId,
        responsavel_carregamento_nome: responsavelNome,
        status: 'pronta_fabrica',
      });

      if (error) throw error;

      toast.success("Ordem de carregamento criada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar ordem:", error);
      toast.error(error.message || "Erro ao criar ordem de carregamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Ordem de Carregamento</DialogTitle>
          <DialogDescription>
            Defina os detalhes para a ordem de carregamento do pedido #{pedido.numero_pedido}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Data de Carregamento */}
          <div className="space-y-2">
            <Label>Data de Carregamento *</Label>
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
                    format(dataCarregamento, "PPP", { locale: ptBR })
                  ) : (
                    "Selecione a data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataCarregamento}
                  onSelect={setDataCarregamento}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hora de Carregamento */}
          <div className="space-y-2">
            <Label htmlFor="hora">Hora de Carregamento *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="hora"
                type="time"
                value={horaCarregamento}
                onChange={(e) => setHoraCarregamento(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tipo de Responsável */}
          <div className="space-y-2">
            <Label>Tipo de Responsável *</Label>
            <RadioGroup
              value={tipoCarregamento}
              onValueChange={(v) => {
                setTipoCarregamento(v as "elisa" | "autorizados");
                setResponsavelId(""); // Reset responsável ao trocar tipo
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="elisa" id="elisa" />
                <Label htmlFor="elisa" className="font-normal cursor-pointer">
                  Instalação Elisa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="autorizados" id="autorizados" />
                <Label htmlFor="autorizados" className="font-normal cursor-pointer">
                  Autorizado
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de Responsável */}
          <div className="space-y-2">
            <Label>
              {tipoCarregamento === "elisa" ? "Equipe" : "Autorizado"} *
            </Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${tipoCarregamento === "elisa" ? "a equipe" : "o autorizado"}`} />
              </SelectTrigger>
              <SelectContent>
                {tipoCarregamento === "elisa" ? (
                  loadingEquipes ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : equipes.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhuma equipe disponível</SelectItem>
                  ) : (
                    equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </SelectItem>
                    ))
                  )
                ) : (
                  loadingAutorizados ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : autorizados.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhum autorizado disponível</SelectItem>
                  ) : (
                    autorizados.map((autorizado) => (
                      <SelectItem key={autorizado.id} value={autorizado.id}>
                        {autorizado.nome} - {autorizado.cidade}/{autorizado.estado}
                      </SelectItem>
                    ))
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Ordem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
