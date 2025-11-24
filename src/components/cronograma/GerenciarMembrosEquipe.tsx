import { useState, useEffect } from "react";
import { Plus, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEquipesMembros } from "@/hooks/useEquipesMembros";
import { EquipeMembrosList } from "./EquipeMembrosList";
import { supabase } from "@/integrations/supabase/client";

interface Usuario {
  user_id: string;
  nome: string;
  email: string;
}

interface GerenciarMembrosEquipeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipeId: string;
  equipeNome: string;
  liderId?: string;
}

export function GerenciarMembrosEquipe({
  open,
  onOpenChange,
  equipeId,
  equipeNome,
  liderId
}: GerenciarMembrosEquipeProps) {
  const { membros, loading, adicionarMembro, removerMembro } = useEquipesMembros(equipeId);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('user_id, nome, email')
        .eq('ativo', true)
        .order('nome');

      if (data) {
        setUsuarios(data as Usuario[]);
      }
    };

    if (open) {
      fetchUsuarios();
    }
  }, [open]);

  const handleAdicionarMembro = async () => {
    if (!selectedUserId) return;

    const sucesso = await adicionarMembro(equipeId, selectedUserId);
    if (sucesso) {
      setSelectedUserId("");
    }
  };

  const usuariosDisponiveis = usuarios.filter(
    u => !membros.some(m => m.user_id === u.user_id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Membros da Equipe: {equipeNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nota sobre o Líder */}
          {liderId && (
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> O líder da equipe é definido nas configurações da equipe. 
                Clique no botão "Editar" na lista de equipes para alterar o líder.
              </p>
            </div>
          )}

          {/* Adicionar Membro */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar Membro (Subordinado)</label>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosDisponiveis.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id}>
                      {usuario.nome} ({usuario.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAdicionarMembro}
                disabled={!selectedUserId}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de Membros */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Membros Atuais ({membros.length})
            </label>
            {loading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : membros.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum membro nesta equipe
              </div>
            ) : (
              <div className="space-y-2">
                {membros.map((membro) => {
                  const isLider = membro.user_id === liderId;
                  return (
                    <div
                      key={membro.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {isLider && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {membro.user?.nome || 'Usuário'}
                            {isLider && <span className="text-xs text-yellow-600 ml-2">(Líder)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {membro.user?.email}
                          </p>
                        </div>
                      </div>
                      {!isLider && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerMembro(membro.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
