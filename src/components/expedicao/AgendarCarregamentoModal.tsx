import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrdemCarregamento, AgendarCarregamentoData } from "@/types/ordemCarregamento";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AgendarCarregamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordem: OrdemCarregamento | null;
  onConfirm: (data: AgendarCarregamentoData) => Promise<void>;
}

export function AgendarCarregamentoModal({
  open,
  onOpenChange,
  ordem,
  onConfirm
}: AgendarCarregamentoModalProps) {
  const [dataCarregamento, setDataCarregamento] = useState("");
  const [hora, setHora] = useState("08:00");
  const [responsavelTipo, setResponsavelTipo] = useState<"elisa" | "autorizado">("elisa");
  const [responsavelId, setResponsavelId] = useState("");
  const [equipes, setEquipes] = useState<any[]>([]);
  const [autorizados, setAutorizados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadResponsaveis();
      
      // Preencher com dados existentes se houver
      if (ordem?.data_carregamento) {
        setDataCarregamento(ordem.data_carregamento.split('T')[0]);
      }
      if (ordem?.hora) {
        setHora(ordem.hora);
      }
      if (ordem?.responsavel_tipo) {
        setResponsavelTipo(ordem.responsavel_tipo);
      }
      if (ordem?.responsavel_carregamento_id) {
        setResponsavelId(ordem.responsavel_carregamento_id);
      }
    }
  }, [open, ordem]);

  const loadResponsaveis = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!dataCarregamento || !hora || !responsavelId) {
      toast.error("Preencha todos os campos obrigatórios");
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

      await onConfirm({
        data_carregamento: dataCarregamento,
        hora: hora,
        responsavel_tipo: responsavelTipo,
        responsavel_carregamento_id: responsavelId,
        responsavel_carregamento_nome: responsavel.nome
      });

      onOpenChange(false);
      
      // Resetar form
      setDataCarregamento("");
      setHora("08:00");
      setResponsavelTipo("elisa");
      setResponsavelId("");
    } catch (error) {
      console.error("Erro ao agendar:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar Carregamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {ordem && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{ordem.nome_cliente}</p>
              <p className="text-sm text-muted-foreground">
                {ordem.tipo_carregamento === 'entrega' ? 'Entrega' : 'Instalação'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={dataCarregamento}
                onChange={(e) => setDataCarregamento(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Responsável *</Label>
            <RadioGroup
              value={responsavelTipo}
              onValueChange={(value) => {
                setResponsavelTipo(value as "elisa" | "autorizado");
                setResponsavelId(""); // Reset selection
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="elisa" id="elisa" />
                <Label htmlFor="elisa" className="font-normal cursor-pointer">
                  Instalação Elisa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="autorizado" id="autorizado" />
                <Label htmlFor="autorizado" className="font-normal cursor-pointer">
                  Autorizado
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>
              {responsavelTipo === "elisa" ? "Equipe" : "Autorizado"} *
            </Label>
            <Select
              value={responsavelId}
              onValueChange={setResponsavelId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione..."} />
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
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agendando...
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
