
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/AvatarUpload";
import { AddUserDialog } from "@/components/AddUserDialog";
import { Search, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  role: "administrador" | "atendente" | "gerente_comercial" | "gerente_fabril" | "diretor" | "gerente_marketing" | "gerente_financeiro" | "gerente_producao" | "gerente_instalacoes" | "instalador" | "aux_instalador" | "analista_marketing" | "assistente_marketing" | "coordenador_vendas" | "vendedor" | "assistente_administrativo" | "soldador" | "aux_geral" | "pintor" | "aux_pintura";
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
  const canViewUsers = useHasPermission('users');
  const { loading: permsLoading } = useUserPermissions();
  const { toast } = useToast();

  useEffect(() => {
    if (canViewUsers) {
      fetchUsers();
    }
  }, [canViewUsers]);

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

  if (permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!permsLoading && !canViewUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

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
                          onValueChange={(value) => setEditForm({ ...editForm, role: value as AdminUser['role'] })}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrador">Administrador</SelectItem>
                            <SelectItem value="diretor">Diretor</SelectItem>
                            <SelectItem value="gerente_comercial">Gerente Comercial</SelectItem>
                            <SelectItem value="gerente_marketing">Gerente de Marketing</SelectItem>
                            <SelectItem value="gerente_financeiro">Gerente Financeiro</SelectItem>
                            <SelectItem value="gerente_producao">Gerente de Produção</SelectItem>
                            <SelectItem value="gerente_fabril">Gerente Fabril</SelectItem>
                            <SelectItem value="gerente_instalacoes">Gerente de Instalações</SelectItem>
                            <SelectItem value="coordenador_vendas">Coordenador(a) de Vendas</SelectItem>
                            <SelectItem value="vendedor">Vendedor(a)</SelectItem>
                            <SelectItem value="analista_marketing">Analista de Marketing</SelectItem>
                            <SelectItem value="assistente_marketing">Assistente de Marketing</SelectItem>
                            <SelectItem value="assistente_administrativo">Assistente Administrativo</SelectItem>
                            <SelectItem value="atendente">Atendente</SelectItem>
                            <SelectItem value="instalador">Instalador</SelectItem>
                            <SelectItem value="aux_instalador">Aux. Instalador</SelectItem>
                            <SelectItem value="soldador">Soldador</SelectItem>
                            <SelectItem value="pintor">Pintor(a)</SelectItem>
                            <SelectItem value="aux_pintura">Aux. Pintura</SelectItem>
                            <SelectItem value="aux_geral">Aux. Geral</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={user.role === "administrador" ? "default" : "secondary"}>
                          {user.role === "administrador" ? "Administrador" :
                           user.role === "diretor" ? "Diretor" :
                           user.role === "gerente_comercial" ? "Gerente Comercial" :
                           user.role === "gerente_marketing" ? "Gerente de Marketing" :
                           user.role === "gerente_financeiro" ? "Gerente Financeiro" :
                           user.role === "gerente_producao" ? "Gerente de Produção" :
                           user.role === "gerente_fabril" ? "Gerente Fabril" :
                           user.role === "gerente_instalacoes" ? "Gerente de Instalações" :
                           user.role === "coordenador_vendas" ? "Coordenador(a) de Vendas" :
                           user.role === "vendedor" ? "Vendedor(a)" :
                           user.role === "analista_marketing" ? "Analista de Marketing" :
                           user.role === "assistente_marketing" ? "Assistente de Marketing" :
                           user.role === "assistente_administrativo" ? "Assistente Administrativo" :
                           user.role === "instalador" ? "Instalador" :
                           user.role === "aux_instalador" ? "Aux. Instalador" :
                           user.role === "soldador" ? "Soldador" :
                           user.role === "pintor" ? "Pintor(a)" :
                           user.role === "aux_pintura" ? "Aux. Pintura" :
                           user.role === "aux_geral" ? "Aux. Geral" : "Atendente"}
                        </Badge>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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
    </div>
  );
}
