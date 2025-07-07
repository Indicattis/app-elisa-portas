import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  role: "administrador" | "atendente";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminUser>>({});
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
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

  const filteredUsers = users.filter(
    (user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta página requer permissões de administrador.
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
          <p className="text-muted-foreground">Gerencie todos os usuários do sistema</p>
        </div>
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
                          onValueChange={(value) => setEditForm({ ...editForm, role: value as "administrador" | "atendente" })}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrador">Administrador</SelectItem>
                            <SelectItem value="atendente">Atendente</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={user.role === "administrador" ? "default" : "secondary"}>
                          {user.role === "administrador" ? "Administrador" : "Atendente"}
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