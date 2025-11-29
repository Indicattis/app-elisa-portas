import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useTarefas } from "@/hooks/useTarefas";
import { format } from "date-fns";

interface AdicionarTarefaPopoverProps {
  date: Date;
}

export const AdicionarTarefaPopover = ({ date }: AdicionarTarefaPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState("");

  const { data: usuarios = [] } = useAllUsers();
  const { criarTarefa } = useTarefas();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!descricao.trim() || !responsavelId) {
      return;
    }

    await criarTarefa.mutateAsync({
      descricao: descricao.trim(),
      responsavel_id: responsavelId,
      data_referencia: format(date, "yyyy-MM-dd"),
    });

    // Limpar e fechar
    setDescricao("");
    setResponsavelId("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Adicionar Tarefa</h4>
            <p className="text-xs text-muted-foreground">
              {format(date, "dd/MM/yyyy")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="O que precisa ser feito?"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger id="responsavel">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.user_id} value={usuario.user_id}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!descricao.trim() || !responsavelId || criarTarefa.isPending}
            >
              {criarTarefa.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
