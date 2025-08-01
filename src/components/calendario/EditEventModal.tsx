import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";

interface EventoCalendario {
  id: string;
  nome_evento: string;
  horario_evento: string;
  data_evento: string;
  categoria: 'data_comemorativa' | 'reuniao' | 'evento' | 'campanha';
  descricao_evento?: string;
  created_by: string;
  membros?: { user_id: string; nome: string; email: string; foto_perfil_url?: string }[];
}

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  foto_perfil_url?: string;
}

interface EditEventModalProps {
  evento: EventoCalendario | null;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  usuarios: AdminUser[];
}

const categoriaLabels = {
  data_comemorativa: { label: "Data Comemorativa", color: "bg-purple-500" },
  reuniao: { label: "Reunião", color: "bg-blue-500" },
  evento: { label: "Evento", color: "bg-green-500" },
  campanha: { label: "Campanha", color: "bg-orange-500" }
};

export function EditEventModal({ evento, isOpen, onClose, onEventUpdated, usuarios }: EditEventModalProps) {
  const [editForm, setEditForm] = useState({
    nome_evento: "",
    horario_evento: "",
    categoria: "",
    descricao_evento: "",
    membros: [] as string[]
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (evento) {
      setEditForm({
        nome_evento: evento.nome_evento,
        horario_evento: evento.horario_evento,
        categoria: evento.categoria,
        descricao_evento: evento.descricao_evento || "",
        membros: evento.membros?.map(m => m.user_id) || []
      });
    }
  }, [evento]);

  const handleUpdate = async () => {
    if (!evento || !editForm.nome_evento || !editForm.horario_evento || !editForm.categoria) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsUpdating(true);
    try {
      // Atualizar evento
      const { error: eventoError } = await supabase
        .from('eventos_calendario')
        .update({
          nome_evento: editForm.nome_evento,
          horario_evento: editForm.horario_evento,
          categoria: editForm.categoria,
          descricao_evento: editForm.descricao_evento,
        })
        .eq('id', evento.id);

      if (eventoError) throw eventoError;

      // Remover membros existentes
      const { error: deleteError } = await supabase
        .from('eventos_membros')
        .delete()
        .eq('evento_id', evento.id);

      if (deleteError) throw deleteError;

      // Adicionar novos membros
      if (editForm.membros.length > 0) {
        const membrosData = editForm.membros.map(userId => ({
          evento_id: evento.id,
          user_id: userId
        }));

        const { error: membrosError } = await supabase
          .from('eventos_membros')
          .insert(membrosData);

        if (membrosError) throw membrosError;
      }

      toast.success('Evento atualizado com sucesso!');
      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast.error('Erro ao atualizar evento');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!evento) return;

    setIsDeleting(true);
    try {
      // Remover membros primeiro
      const { error: membrosError } = await supabase
        .from('eventos_membros')
        .delete()
        .eq('evento_id', evento.id);

      if (membrosError) throw membrosError;

      // Remover evento
      const { error: eventoError } = await supabase
        .from('eventos_calendario')
        .delete()
        .eq('id', evento.id);

      if (eventoError) throw eventoError;

      toast.success('Evento excluído com sucesso!');
      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!evento) return null;

  // Verificar se o usuário pode editar (criador ou admin)
  const canEdit = user?.id === evento.created_by || user?.id; // Para simplificar, qualquer usuário logado pode editar

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Evento
          </DialogTitle>
          <DialogDescription>
            Modifique as informações do evento ou exclua-o
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-nome">Nome do Evento *</Label>
            <Input
              id="edit-nome"
              value={editForm.nome_evento}
              onChange={(e) => setEditForm({ ...editForm, nome_evento: e.target.value })}
              placeholder="Digite o nome do evento"
              disabled={!canEdit}
            />
          </div>

          <div>
            <Label htmlFor="edit-horario">Horário *</Label>
            <Input
              id="edit-horario"
              type="time"
              value={editForm.horario_evento}
              onChange={(e) => setEditForm({ ...editForm, horario_evento: e.target.value })}
              disabled={!canEdit}
            />
          </div>

          <div>
            <Label htmlFor="edit-categoria">Categoria *</Label>
            <Select
              value={editForm.categoria}
              onValueChange={(value) => setEditForm({ ...editForm, categoria: value })}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoriaLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-membros">Membros</Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (!editForm.membros.includes(value)) {
                  setEditForm({
                    ...editForm,
                    membros: [...editForm.membros, value]
                  });
                }
              }}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Adicionar membro" />
              </SelectTrigger>
              <SelectContent>
                {usuarios
                  .filter(user => !editForm.membros.includes(user.id))
                  .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {editForm.membros.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {editForm.membros.map((membroId) => {
                  const usuario = usuarios.find(u => u.id === membroId);
                  return (
                    <Badge key={membroId} variant="secondary" className="flex items-center gap-1">
                      {usuario?.nome}
                      {canEdit && (
                        <button
                          onClick={() => setEditForm({
                            ...editForm,
                            membros: editForm.membros.filter(id => id !== membroId)
                          })}
                          className="ml-1 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Textarea
              id="edit-descricao"
              value={editForm.descricao_evento}
              onChange={(e) => setEditForm({ ...editForm, descricao_evento: e.target.value })}
              placeholder="Descreva o evento..."
              rows={3}
              disabled={!canEdit}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {canEdit && (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isUpdating}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating || isDeleting}
              >
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>
            {canEdit ? 'Cancelar' : 'Fechar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}