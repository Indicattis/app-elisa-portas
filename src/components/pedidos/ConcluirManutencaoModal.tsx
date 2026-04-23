import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

interface ConcluirManutencaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  pedidoNumero?: string;
  onConcluido: () => void;
}

interface Equipe {
  id: string;
  nome: string;
}

interface Autorizado {
  id: string;
  nome: string;
}

export function ConcluirManutencaoModal({
  open,
  onOpenChange,
  pedidoId,
  pedidoNumero,
  onConcluido,
}: ConcluirManutencaoModalProps) {
  const [tipo, setTipo] = useState<"elisa" | "autorizado">("elisa");
  const [responsavelId, setResponsavelId] = useState("");
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResponsavelId("");
    setLoadingData(true);
    (async () => {
      try {
        const [eqRes, autRes] = await Promise.all([
          supabase
            .from("equipes_instalacao")
            .select("id, nome")
            .eq("ativa", true)
            .order("nome"),
          supabase
            .from("autorizados")
            .select("id, nome")
            .eq("ativo", true)
            .order("nome"),
        ]);
        if (eqRes.error) throw eqRes.error;
        if (autRes.error) throw autRes.error;
        setEquipes(eqRes.data || []);
        setAutorizados(autRes.data || []);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar equipes e autorizados");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [open]);

  useEffect(() => {
    setResponsavelId("");
  }, [tipo]);

  const handleConcluir = async () => {
    if (!responsavelId) {
      toast.error("Selecione o responsável");
      return;
    }
    setSalvando(true);
    try {
      const responsavelNome =
        tipo === "elisa"
          ? equipes.find((e) => e.id === responsavelId)?.nome || ""
          : autorizados.find((a) => a.id === responsavelId)?.nome || "";

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Buscar instalação existente desse pedido
      const { data: instExist } = await supabase
        .from("instalacoes")
        .select("id")
        .eq("pedido_id", pedidoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const payload = {
        tipo_instalacao: tipo,
        responsavel_instalacao_id: responsavelId,
        responsavel_instalacao_nome: responsavelNome,
        instalacao_concluida: true,
        instalacao_concluida_em: new Date().toISOString(),
        instalacao_concluida_por: user?.id || null,
        carregamento_concluido: true,
        carregamento_concluido_em: new Date().toISOString(),
        carregamento_concluido_por: user?.id || null,
      };

      if (instExist?.id) {
        const { error } = await supabase
          .from("instalacoes")
          .update(payload)
          .eq("id", instExist.id);
        if (error) throw error;
      } else {
        throw new Error("Registro de instalação não encontrado para este pedido.");
      }

      toast.success("Manutenção concluída");
      onOpenChange(false);
      onConcluido();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao concluir manutenção");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Concluir Manutenção
          </DialogTitle>
          <DialogDescription>
            {pedidoNumero ? `Pedido ${pedidoNumero} — ` : ""}
            Selecione quem executou o serviço para finalizar o pedido.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <RadioGroup
                value={tipo}
                onValueChange={(v) => setTipo(v as "elisa" | "autorizado")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="elisa" id="tipo-elisa" />
                  <Label htmlFor="tipo-elisa" className="cursor-pointer font-normal">
                    Equipe Elisa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="autorizado" id="tipo-autorizado" />
                  <Label htmlFor="tipo-autorizado" className="cursor-pointer font-normal">
                    Autorizado
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>{tipo === "elisa" ? "Equipe" : "Autorizado"} *</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      tipo === "elisa" ? "Selecione a equipe" : "Selecione o autorizado"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(tipo === "elisa" ? equipes : autorizados).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConcluir}
            disabled={!responsavelId || salvando || loadingData}
          >
            {salvando ? "Concluindo..." : "Concluir e Finalizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
