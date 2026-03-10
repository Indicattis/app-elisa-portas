import { useState } from 'react';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useVagas } from '@/hooks/useVagas';
import { SETOR_LABELS, SETOR_ROLES } from '@/utils/setorMapping';
import { ROLE_LABELS } from '@/types/permissions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Plus, UserMinus, Trash2, ArrowRightLeft, Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreateRoleModal } from '@/components/admin/CreateRoleModal';
import { EditRoleModal } from '@/components/admin/EditRoleModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/hooks/useAllUsers';

const SETOR_KEYS = Object.keys(SETOR_LABELS);

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function GestaoColaboradoresDirecao() {
  const [selectedSetor, setSelectedSetor] = useState(SETOR_KEYS[0]);
  const { data: allUsers, isLoading } = useAllUsers();
  const { vagas, createVaga } = useVagas();
  const queryClient = useQueryClient();

  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  const [vagaDialogRole, setVagaDialogRole] = useState<string | null>(null);
  const [vagaJustificativa, setVagaJustificativa] = useState('');
  const [creatingVaga, setCreatingVaga] = useState(false);

  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [changingRole, setChangingRole] = useState(false);

  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{
    id: string; key: string; label: string; setor: string | null;
    descricao: string | null; ativo: boolean; ordem: number;
  } | null>(null);

  const { data: systemRoles } = useQuery({
    queryKey: ['system-roles-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_roles')
        .select('id, key, label, setor, descricao, ativo, ordem')
        .eq('ativo', true)
        .order('label');
      return data || [];
    },
  });

  const rolesForSetor = SETOR_ROLES[selectedSetor] || [];
  const filteredUsers = (allUsers || []).filter(u => rolesForSetor.includes(u.role as any));

  const openVagasByRole = (role: string) =>
    (vagas || []).filter(v => v.cargo === role && (v.status === 'aberta' || v.status === 'em_analise')).length;

  // Show ALL roles — no filtering
  const grouped = rolesForSetor.map(role => ({
    role,
    label: ROLE_LABELS[role] || role,
    users: filteredUsers.filter(u => u.role === role),
    openVagas: openVagasByRole(role),
  }));

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    setDeactivating(true);
    const { error } = await supabase
      .from('admin_users')
      .update({ ativo: false })
      .eq('id', userToDeactivate.id);
    setDeactivating(false);
    setUserToDeactivate(null);
    if (error) {
      toast.error('Erro ao desativar colaborador');
    } else {
      toast.success('Colaborador desativado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeletingRole(true);
    const { error } = await supabase
      .from('system_roles')
      .update({ ativo: false })
      .eq('key', roleToDelete);
    setDeletingRole(false);
    setRoleToDelete(null);
    if (error) {
      toast.error('Erro ao excluir função');
    } else {
      toast.success('Função excluída com sucesso');
      queryClient.invalidateQueries({ queryKey: ['system-roles'] });
    }
  };

  const handleCreateVaga = async () => {
    if (!vagaDialogRole || !vagaJustificativa.trim()) return;
    setCreatingVaga(true);
    await createVaga({ cargo: vagaDialogRole as any, justificativa: vagaJustificativa.trim() });
    setCreatingVaga(false);
    setVagaDialogRole(null);
    setVagaJustificativa('');
  };

  const handleChangeRole = async () => {
    if (!userToChangeRole || !newRole || newRole === userToChangeRole.role) return;
    setChangingRole(true);
    const { error } = await supabase
      .from('admin_users')
      .update({ role: newRole })
      .eq('id', userToChangeRole.id);
    setChangingRole(false);
    setUserToChangeRole(null);
    if (error) {
      toast.error('Erro ao alterar função');
    } else {
      toast.success('Função alterada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    }
  };

  return (
    <MinimalistLayout
      title="Organograma RH"
      subtitle="Colaboradores por setor"
      backPath="/direcao"
      fullWidth
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'Organograma RH' },
      ]}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Mobile: horizontal chips */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {SETOR_KEYS.map(setor => (
            <button
              key={setor}
              onClick={() => setSelectedSetor(setor)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedSetor === setor
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
            >
              {SETOR_LABELS[setor]}
            </button>
          ))}
        </div>

        {/* Desktop: sidebar */}
        <div className="hidden md:flex flex-col w-56 shrink-0">
          <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex flex-col gap-1 p-2">
              {SETOR_KEYS.map(setor => (
                <button
                  key={setor}
                  onClick={() => setSelectedSetor(setor)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${selectedSetor === setor
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {SETOR_LABELS[setor]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <Users className="w-10 h-10 mb-3" />
              <p className="text-sm">Nenhum colaborador neste setor</p>
            </div>
          ) : (
             <div className="space-y-6">
              <div className="flex justify-end">
                <Button
                  onClick={() => setCreateRoleModalOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Nova Função
                </Button>
              </div>
              {grouped.map(group => {
                const total = group.users.length + group.openVagas;
                const isFull = group.openVagas === 0 && group.users.length > 0;
                const isEmpty = group.users.length === 0 && group.openVagas === 0;
                return (
                  <div key={group.role}>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h2 className="text-sm font-semibold text-white/80">{group.label}</h2>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isEmpty
                            ? 'border-white/10 text-white/30 bg-white/5'
                            : isFull
                              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {group.users.length}/{total || 0}
                      </Badge>
                      <button
                        onClick={() => {
                          const role = (systemRoles || []).find(r => r.key === group.role);
                          if (role) setEditingRole(role);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/70 transition-all"
                        title="Editar função"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {isEmpty && (
                        <button
                          onClick={() => setRoleToDelete(group.role)}
                          className="ml-auto flex items-center gap-1 text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                          title="Excluir função"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.users.map(user => (
                        <div
                          key={user.id}
                          className="group p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/[0.08] transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <Avatar className="h-10 w-10 border border-white/10">
                              {user.foto_perfil_url ? (
                                <AvatarImage src={user.foto_perfil_url} alt={user.nome} />
                              ) : null}
                              <AvatarFallback className="bg-blue-600/20 text-blue-300 text-xs font-medium">
                                {getInitials(user.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate">{user.nome}</p>
                              <p className="text-xs text-white/40 truncate">{user.email}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                              <button
                                onClick={() => { setUserToChangeRole(user); setNewRole(user.role); }}
                                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-white/30 hover:text-blue-400 transition-all"
                                title="Alterar função"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setUserToDeactivate(user)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                                title="Desativar colaborador"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Open vacancy placeholders */}
                      {Array.from({ length: group.openVagas }).map((_, i) => (
                        <div
                          key={`vaga-${i}`}
                          className="p-1.5 rounded-xl border border-dashed border-amber-500/20 bg-amber-500/5"
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className="h-10 w-10 rounded-full border border-dashed border-amber-500/30 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-amber-500/50" />
                            </div>
                            <p className="text-xs text-amber-400/70">Vaga aberta</p>
                          </div>
                        </div>
                      ))}
                      {/* Add vaga card */}
                      <button
                        onClick={() => { setVagaDialogRole(group.role); setVagaJustificativa(''); }}
                        className="p-1.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-blue-500/30 transition-all duration-200 cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <div className="h-10 w-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white/30" />
                          </div>
                          <p className="text-xs text-white/40">Adicionar vaga</p>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Deactivate user confirmation */}
      <AlertDialog open={!!userToDeactivate} onOpenChange={open => !open && setUserToDeactivate(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar colaborador</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja desativar <strong className="text-white">{userToDeactivate?.nome}</strong>? O acesso será bloqueado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deactivating ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete role confirmation */}
      <AlertDialog open={!!roleToDelete} onOpenChange={open => !open && setRoleToDelete(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir função</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir a função <strong className="text-white">{roleToDelete && (ROLE_LABELS[roleToDelete as keyof typeof ROLE_LABELS] || roleToDelete)}</strong>? Ela será desativada do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              disabled={deletingRole}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingRole ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create vaga dialog */}
      <Dialog open={!!vagaDialogRole} onOpenChange={open => !open && setVagaDialogRole(null)}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Solicitar vaga</DialogTitle>
            <DialogDescription className="text-white/60">
              {vagaDialogRole && (ROLE_LABELS[vagaDialogRole as keyof typeof ROLE_LABELS] || vagaDialogRole)}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Justificativa da vaga..."
            value={vagaJustificativa}
            onChange={e => setVagaJustificativa(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
          />
          <DialogFooter>
            <Button
              onClick={handleCreateVaga}
              disabled={creatingVaga || !vagaJustificativa.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingVaga ? 'Criando...' : 'Criar vaga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={!!userToChangeRole} onOpenChange={open => !open && setUserToChangeRole(null)}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Alterar função</DialogTitle>
            <DialogDescription className="text-white/60">
              Alterar a função de <strong className="text-white">{userToChangeRole?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              {(systemRoles || []).map(r => (
                <SelectItem key={r.key} value={r.key} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={handleChangeRole}
              disabled={changingRole || !newRole || newRole === userToChangeRole?.role}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {changingRole ? 'Alterando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MinimalistLayout>
  );
}