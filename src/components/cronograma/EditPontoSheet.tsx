import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { usePontosInstalacao } from "@/hooks/usePontosInstalacao";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PontoInstalacao {
  id: string;
  equipe_id: string;
  cidade: string;
  dia_semana: number;
  observacoes?: string;
}

interface EditPontoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ponto: PontoInstalacao | null;
  currentWeek: Date;
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

export function EditPontoSheet({ open, onOpenChange, ponto, currentWeek }: EditPontoSheetProps) {
  const [equipId, setEquipId] = useState("");
  const [cidade, setCidade] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { equipes } = useEquipesInstalacao();
  const { fetchPontos } = usePontosInstalacao(currentWeek);

  useEffect(() => {
    if (ponto) {
      setEquipId(ponto.equipe_id);
      setCidade(ponto.cidade);
      setDiaSemana(ponto.dia_semana.toString());
      setObservacoes(ponto.observacoes || "");
    } else {
      setEquipId("");
      setCidade("");
      setDiaSemana("");
      setObservacoes("");
    }
  }, [ponto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ponto || !equipId || !cidade.trim() || diaSemana === "") return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('pontos_instalacao')
        .update({
          equipe_id: equipId,
          cidade: cidade.trim(),
          dia_semana: parseInt(diaSemana),
          observacoes: observacoes.trim() || null
        })
        .eq('id', ponto.id);

      if (error) throw error;
      
      toast.success('Ponto atualizado com sucesso');
      fetchPontos();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar ponto:', error);
      toast.error('Erro ao atualizar ponto de instalação');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ponto) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('pontos_instalacao')
        .delete()
        .eq('id', ponto.id);

      if (error) throw error;
      
      toast.success('Ponto removido com sucesso');
      fetchPontos();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao deletar ponto:', error);
      toast.error('Erro ao remover ponto de instalação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar Ponto de Instalação</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Removendo..." : "Remover Ponto"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}