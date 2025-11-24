import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { usePontosInstalacao } from "@/hooks/usePontosInstalacao";
import { startOfWeek } from "date-fns";

interface FormPontoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DIAS_SEMANA = [
  { label: "Segunda-feira", value: 1 },
  { label: "Terça-feira", value: 2 },
  { label: "Quarta-feira", value: 3 },
  { label: "Quinta-feira", value: 4 },
  { label: "Sexta-feira", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

export function FormPonto({ open, onOpenChange }: FormPontoProps) {
  const [equipId, setEquipId] = useState("");
  const [cidade, setCidade] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { equipes } = useEquipesInstalacao();
  const { createPonto } = usePontosInstalacao(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipId || !cidade.trim() || diaSemana === "") return;

    setLoading(true);
    const success = await createPonto({
      equipe_id: equipId,
      cidade: cidade.trim(),
      dia_semana: parseInt(diaSemana),
      observacoes: observacoes.trim() || undefined
    });
    
    if (success) {
      setEquipId("");
      setCidade("");
      setDiaSemana("");
      setObservacoes("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Ponto de Instalação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipe">Equipe</Label>
            <Select value={equipId} onValueChange={setEquipId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma equipe" />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: equipe.cor }}
                      />
                      {equipe.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Digite a cidade da instalação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dia">Dia da Semana</Label>
            <Select value={diaSemana} onValueChange={setDiaSemana}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                {DIAS_SEMANA.map((dia) => (
                  <SelectItem key={dia.value} value={dia.value.toString()}>
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a instalação"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Ponto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}