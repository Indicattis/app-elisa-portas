import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Save, Key, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";

interface AdminUser {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: string;
  setor: string | null;
  codigo_usuario: string | null;
  ativo: boolean;
}

export function ProducaoAuthManager() {
  const { toast } = useToast();
  
  const { data: users = [], refetch } = useQuery({
    queryKey: ["fabrica-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("setor", "fabrica")
        .eq("ativo", true)
        .order("nome");

      if (error) {
        console.error("Erro ao buscar usuários:", error);
        throw error;
      }

      return (data || []) as AdminUser[];
    },
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ codigo_usuario: string }>({ codigo_usuario: "" });
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleSaveCode = async (userId: string) => {
    try {
      if (!editForm.codigo_usuario.trim()) {
        toast({
          title: "Erro",
          description: "Código de usuário não pode estar vazio",
          variant: "destructive",
        });
        return;
      }

      // Verificar se código já existe para outro usuário
      const existingUser = users.find(
        u => u.id !== userId && u.codigo_usuario === editForm.codigo_usuario.trim()
      );

      if (existingUser) {
        toast({
          title: "Erro",
          description: "Este código já está em uso por outro usuário",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("admin_users")
        .update({ codigo_usuario: editForm.codigo_usuario.trim() })
        .eq("id", userId);

      if (error) throw error;

      setEditingUserId(null);
      setEditForm({ codigo_usuario: "" });
      refetch();

      toast({
        title: "Sucesso",
        description: "Código de produção atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar código:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o código",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (userEmail: string, userName: string) => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      // Chamar edge function para atualizar senha
      const { error } = await supabase.functions.invoke('manage-producao-auth', {
        body: { 
          email: userEmail,
          new_password: newPassword,
          action: 'update_password'
        }
      });

      if (error) throw error;

      setChangingPassword(null);
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Sucesso",
        description: `Senha de produção atualizada para ${userName}`,
      });
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a senha",
        variant: "destructive",
      });
    }
  };

  const handleToggleAccess = async (userId: string, currentCode: string | null) => {
    try {
      if (currentCode) {
        // Desabilitar acesso (remover código)
        const { error } = await supabase
          .from("admin_users")
          .update({ codigo_usuario: null })
          .eq("id", userId);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Acesso à interface de produção desabilitado",
        });
      } else {
        // Habilitar acesso (gerar código)
        const generatedCode = `PROD${Math.floor(1000 + Math.random() * 9000)}`;
        
        const { error } = await supabase
          .from("admin_users")
          .update({ codigo_usuario: generatedCode })
          .eq("id", userId);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `Acesso habilitado com código: ${generatedCode}`,
        });
      }

      refetch();
    } catch (error) {
      console.error("Erro ao alternar acesso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o acesso",
        variant: "destructive",
      });
    }
  };

  if (users.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum usuário do setor fábrica encontrado. Configure usuários com setor "Fábrica" na aba de Usuários.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso à Interface de Produção</CardTitle>
        <CardDescription>
          Configure códigos e senhas para operadores da fábrica acessarem a interface de produção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{user.nome}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {user.role}
                  </Badge>
                </div>
                <Switch
                  checked={!!user.codigo_usuario}
                  onCheckedChange={() => handleToggleAccess(user.id, user.codigo_usuario)}
                />
              </div>

              {user.codigo_usuario && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <Label>Código de Produção</Label>
                    {editingUserId === user.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editForm.codigo_usuario}
                          onChange={(e) => setEditForm({ codigo_usuario: e.target.value })}
                          placeholder="Digite o código"
                          className="font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveCode(user.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUserId(null);
                            setEditForm({ codigo_usuario: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded font-mono text-sm">
                          {visibleCodes.has(user.id) ? user.codigo_usuario : "••••••••"}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCodeVisibility(user.id)}
                        >
                          {visibleCodes.has(user.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditForm({ codigo_usuario: user.codigo_usuario || "" });
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {changingPassword === user.id ? (
                      <div className="space-y-2">
                        <Label>Nova Senha</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha"
                        />
                        <Label>Confirmar Senha</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirme a nova senha"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleChangePassword(user.email, user.nome)}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Salvar Senha
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setChangingPassword(null);
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setChangingPassword(user.id)}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Alterar Senha de Produção
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
