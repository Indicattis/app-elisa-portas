import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";

interface ResponsavelEntregaModalProps {
  entregaId: string;
  currentResponsavelId: string | null;
  currentResponsavelNome: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Usuario {
  id: string;
  user_id: string;
  nome: string;
  email: string;
}

export const ResponsavelEntregaModal = ({
  entregaId,
  currentResponsavelId,
  currentResponsavelNome,
  open,
  onOpenChange,
  onSuccess,
}: ResponsavelEntregaModalProps) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentResponsavelId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsuarios();
    }
  }, [open]);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, email, user_id')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      toast.error('Selecione um responsável');
      return;
    }

    try {
      setLoading(true);
      const selectedUser = usuarios.find(u => u.user_id === selectedUserId);
      
      const { error } = await supabase
        .from('entregas')
        .update({
          responsavel_entrega_id: selectedUserId,
          responsavel_entrega_nome: selectedUser?.nome || null,
        })
        .eq('id', entregaId);

      if (error) throw error;

      toast.success('Responsável atualizado com sucesso');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating responsavel:', error);
      toast.error('Erro ao atualizar responsável');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Definir Responsável pela Entrega
          </DialogTitle>
          <DialogDescription>
            Selecione o responsável pela entrega
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentResponsavelNome && (
            <div className="text-sm">
              <span className="text-muted-foreground">Responsável atual: </span>
              <span className="font-medium">{currentResponsavelNome}</span>
            </div>
          )}

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
              {usuarios.map((usuario) => (
                <SelectItem key={usuario.user_id} value={usuario.user_id}>
                  {usuario.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
