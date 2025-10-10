import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users } from 'lucide-react';
import { formatDuration } from '@/utils/timeFormat';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminUser {
  user_id: string;
  nome: string;
  email: string;
  foto_perfil_url: string | null;
  role: string;
  ativo: boolean;
}

interface SelecionarParticipantesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (participantes: string[]) => void;
  onVoltar: () => void;
  duracao: number;
}

export function SelecionarParticipantesModal({
  open,
  onOpenChange,
  onConfirm,
  onVoltar,
  duracao,
}: SelecionarParticipantesModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, foto_perfil_url, role, ativo')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as AdminUser[];
    },
    enabled: open,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (selectedUsers.size === 0) return;
    onConfirm(Array.from(selectedUsers));
    setSelectedUsers(new Set());
    setSearchTerm('');
  };

  const handleVoltar = () => {
    setSelectedUsers(new Set());
    setSearchTerm('');
    onVoltar();
  };

  const getUserInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Participantes
          </DialogTitle>
          <DialogDescription>
            Duração da reunião: <span className="font-semibold text-primary">{formatDuration(duracao)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {selectedUsers.size > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedUsers.size} {selectedUsers.size === 1 ? 'participante selecionado' : 'participantes selecionados'}
            </div>
          )}

          <ScrollArea className="flex-1 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.has(user.user_id);
                  return (
                    <div
                      key={user.user_id}
                      onClick={() => toggleUser(user.user_id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }
                      `}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleUser(user.user_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.nome}</p>
                        <p className="text-xs text-muted-foreground capitalize truncate">
                          {user.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleVoltar}>
            Voltar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedUsers.size === 0}>
            Confirmar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
