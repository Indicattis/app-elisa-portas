import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { supabase } from "@/integrations/supabase/client";

interface FormEquipeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipe?: {
    id: string;
    nome: string;
    cor: string;
    responsavel_id?: string;
  };
}

const CORES_EQUIPES = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"
];

export function FormEquipe({ open, onOpenChange, equipe }: FormEquipeProps) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_EQUIPES[0]);
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(false);
  const { createEquipe, updateEquipe } = useEquipesInstalacao();

  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (data) {
        setUsuarios(data);
      }
    };

    fetchUsuarios();
  }, []);

  useEffect(() => {
    if (equipe) {
      setNome(equipe.nome);
      setCor(equipe.cor);
      setResponsavelId(equipe.responsavel_id || "");
    } else {
      setNome("");
      setCor(CORES_EQUIPES[0]);
      setResponsavelId("");
    }
  }, [equipe, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    
    const dados = {
      nome: nome.trim(),
      cor,
      responsavel_id: responsavelId || undefined
    };

    const success = equipe 
      ? await updateEquipe(equipe.id, dados)
      : await createEquipe(dados);
    
    if (success) {
      setNome("");
      setCor(CORES_EQUIPES[0]);
      setResponsavelId("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {equipe ? 'Editar Equipe' : 'Nova Equipe de Instalação'}
          </DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="responsavel">Líder da Equipe (Opcional)</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o líder da equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum líder</SelectItem>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {loading ? (equipe ? "Salvando..." : "Criando...") : (equipe ? "Salvar" : "Criar Equipe")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}