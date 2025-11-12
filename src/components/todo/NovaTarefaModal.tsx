import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAllUsers } from "@/hooks/useAllUsers";

interface NovaTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tarefa: {
    descricao: string;
    responsavel_id: string;
    setor?: string;
  }) => void;
  setor?: string;
}

export function NovaTarefaModal({ open, onOpenChange, onSubmit, setor }: NovaTarefaModalProps) {
  const { user, userRole } = useAuth();
  const { data: allUsers = [] } = useAllUsers();
  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>(user?.id || "");

  const isDiretor = userRole?.role === 'diretor';
  const podeEscolherResponsavel = userRole?.role === 'administrador' || isDiretor;

  const handleSubmit = () => {
    if (!descricao.trim() || !responsavelId) return;

    onSubmit({
      descricao,
      responsavel_id: responsavelId,
      setor,
    });

    setDescricao("");
    setResponsavelId(user?.id || "");
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

          {podeEscolherResponsavel && (
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={usuario.foto_perfil_url} />
                          <AvatarFallback className="text-[10px]">
                            {usuario.nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{usuario.nome}</span>
                      </div>
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
