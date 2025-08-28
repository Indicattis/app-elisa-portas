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
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";

interface FormEquipeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CORES_EQUIPES = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"
];

export function FormEquipe({ open, onOpenChange }: FormEquipeProps) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_EQUIPES[0]);
  const [loading, setLoading] = useState(false);
  const { createEquipe } = useEquipesInstalacao();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    const success = await createEquipe({ nome: nome.trim(), cor });
    
    if (success) {
      setNome("");
      setCor(CORES_EQUIPES[0]);
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Equipe de Instalação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Equipe</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da equipe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cor da Equipe</Label>
            <div className="flex gap-2">
              {CORES_EQUIPES.map((corOption) => (
                <button
                  key={corOption}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    cor === corOption ? 'border-foreground' : 'border-muted'
                  }`}
                  style={{ backgroundColor: corOption }}
                  onClick={() => setCor(corOption)}
                />
              ))}
            </div>
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
              {loading ? "Criando..." : "Criar Equipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}