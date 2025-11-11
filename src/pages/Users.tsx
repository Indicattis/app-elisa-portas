import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/AvatarUpload";
import { AddUserDialog } from "@/components/AddUserDialog";
import { ResetPasswordModal } from "@/components/ResetPasswordModal";
import { Search, Edit, Save, X, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  role: string; // TEXT in database, validated via FK against system_roles.key
  setor: "vendas" | "marketing" | "instalacoes" | "fabrica" | "administrativo" | null;
  codigo_usuario: string | null;
  ativo: boolean;
  foto_perfil_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminUser>>({});
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  // Buscar cargos ativos do sistema
  const { data: systemRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['system-roles-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_roles')
        .select('key, label')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as { key: string; label: string }[];
    },
  });

  // Criar mapa de key -> label para exibição
  const roleLabelsMap = systemRoles.reduce((acc, role) => {
    acc[role.key] = role.label;
    return acc;
  }, {} as Record<string, string>);

  const toggleCodeVisibility = (userId: string) => {
    setVisibleCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Buscando usuários...');
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log('Usuários carregados:', data);
      console.log('URLs de foto dos usuários:', data?.map(u => ({ nome: u.nome, foto_url: u.foto_perfil_url })));
      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar usuários",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user.id);
    setEditForm({
      nome: user.nome,
      role: user.role,
      setor: user.setor,
      codigo_usuario: user.codigo_usuario,
      ativo: user.ativo,
    });
  };

  const handleSave = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({
          nome: editForm.nome,
          role: editForm.role,
          setor: editForm.setor,
          codigo_usuario: editForm.codigo_usuario,
          ativo: editForm.ativo,
        })
        .eq("id", userId);

      if (error) throw error;

      setEditingUser(null);
      setEditForm({});
      fetchUsers();
      
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar usuário",
      });
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleAvatarUpdate = (userId: string, newAvatarUrl: string | null) => {
    console.log('Atualizando avatar no estado local:', { userId, newAvatarUrl });
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => 
        user.user_id === userId 
          ? { ...user, foto_perfil_url: newAvatarUrl }
          : user
      );
      console.log('Estado atualizado:', updatedUsers.find(u => u.user_id === userId));
      return updatedUsers;
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
        </div>
        <AddUserDialog onUserAdded={fetchUsers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuários encontrados
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <AvatarUpload
                        userId={user.user_id}
                        currentAvatarUrl={user.foto_perfil_url}
                        userName={user.nome}
                        onAvatarUpdate={(url) => handleAvatarUpdate(user.user_id, url)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {editingUser === user.id ? (
                        <Input
                          value={editForm.nome || ""}
                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                          className="max-w-xs"
                        />
                      ) : (
                        user.nome
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Select
                          value={editForm.role}
                          onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                          disabled={loadingRoles}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingRoles ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : systemRoles.length === 0 ? (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                Nenhum cargo ativo disponível
                              </div>
                            ) : (
                              systemRoles.map((role) => (
                                <SelectItem key={role.key} value={role.key}>
                                  {role.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={user.role === "administrador" ? "default" : "secondary"}>
                          {roleLabelsMap[user.role] || user.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Select
                          value={editForm.setor || ""}
                          onValueChange={(value) => setEditForm({ ...editForm, setor: value as AdminUser['setor'] })}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vendas">Vendas</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="instalacoes">Instalações</SelectItem>
                            <SelectItem value="fabrica">Fábrica</SelectItem>
                            <SelectItem value="administrativo">Administrativo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">
                          {user.setor === "vendas" ? "Vendas" :
                           user.setor === "marketing" ? "Marketing" :
                           user.setor === "instalacoes" ? "Instalações" :
                           user.setor === "fabrica" ? "Fábrica" :
                           user.setor === "administrativo" ? "Administrativo" : "Não definido"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Input
                          value={editForm.codigo_usuario || ""}
                          onChange={(e) => setEditForm({ ...editForm, codigo_usuario: e.target.value })}
                          placeholder="Digite o código"
                          className="max-w-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {user.codigo_usuario ? (
                              visibleCodes.has(user.id) ? user.codigo_usuario : "••••••"
                            ) : (
                              <span className="text-muted-foreground">Não definido</span>
                            )}
                          </span>
                          {user.codigo_usuario && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCodeVisibility(user.id)}
                              className="h-6 w-6 p-0"
                            >
                              {visibleCodes.has(user.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Select
                          value={editForm.ativo ? "true" : "false"}
                          onValueChange={(value) => setEditForm({ ...editForm, ativo: value === "true" })}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Ativo</SelectItem>
                            <SelectItem value="false">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={user.ativo ? "default" : "destructive"}>
                          {user.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {editingUser === user.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSave(user.id)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancel}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                         ) : (
                           <>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleEdit(user)}
                             >
                               <Edit className="w-4 h-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setResetPasswordUser(user)}
                               title="Redefinir senha"
                             >
                               <KeyRound className="w-4 h-4" />
                             </Button>
                           </>
                         )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ResetPasswordModal
        open={!!resetPasswordUser}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
        userId={resetPasswordUser?.user_id || ""}
        userName={resetPasswordUser?.nome || ""}
        userEmail={resetPasswordUser?.email || ""}
      />
    </div>
  );
}