import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TarefaInput } from "@/hooks/useTarefas";
import { getRolesFromSetor } from "@/utils/setorMapping";

interface NovaTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tarefa: TarefaInput) => void;
  setor?: string;
}

export function NovaTarefaModal({ open, onOpenChange, onSubmit, setor }: NovaTarefaModalProps) {
  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [diaRecorrencia, setDiaRecorrencia] = useState<number>(1);

  // Buscar usuários ativos (filtrados por setor se fornecido)
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-ativos', setor],
    queryFn: async () => {
      let query = supabase
        .from('admin_users')
        .select('user_id, nome, email, role')
        .eq('ativo', true);

      // Filtrar por roles do setor se fornecido
      if (setor) {
        const roles = getRolesFromSetor(setor);
        if (roles.length > 0) {
          query = query.in('role', roles);
        }
      }

      const { data, error } = await query.order('nome');

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = () => {
    if (!descricao.trim() || !responsavelId) return;

    onSubmit({
      descricao,
      responsavel_id: responsavelId,
      recorrente,
      dia_recorrencia: recorrente ? diaRecorrencia : null,
      setor: setor || '',
    });

    // Limpar form
    setDescricao("");
    setResponsavelId("");
    setRecorrente(false);
    setDiaRecorrencia(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a tarefa..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.user_id} value={usuario.user_id}>
                    {usuario.nome} ({usuario.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recorrente"
              checked={recorrente}
              onCheckedChange={setRecorrente}
            />
            <Label htmlFor="recorrente">Tarefa recorrente</Label>
          </div>

          {recorrente && (
            <div className="space-y-2">
              <Label htmlFor="dia">Dia do mês para recorrência (1-31)</Label>
              <Select
                value={diaRecorrencia.toString()}
                onValueChange={(v) => setDiaRecorrencia(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                    <SelectItem key={dia} value={dia.toString()}>
                      Dia {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!descricao.trim() || !responsavelId}>
            Criar Tarefa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
