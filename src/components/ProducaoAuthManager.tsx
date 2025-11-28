import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";

interface AdminUser {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: string;
  setor: string | null;
  cpf: string | null;
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
        .in("setor", ["fabrica", "administrativo"])
        .eq("ativo", true)
        .order("nome");

      if (error) {
        console.error("Erro ao buscar usuários:", error);
        throw error;
      }

      return (data || []) as AdminUser[];
    },
  });

  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const formatCpfUltimosDigitos = (cpf: string | null) => {
    if (!cpf) return null;
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length < 4) return null;
    return cpfLimpo.slice(-4);
  };

  if (users.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum usuário do setor fábrica ou administrativo encontrado. Configure usuários com setor "Fábrica" ou "Administrativo" na aba de Usuários.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso à Interface de Produção</CardTitle>
        <CardDescription>
          Usuários com CPF cadastrado podem acessar a interface de produção usando os últimos 4 dígitos do CPF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => {
          const cpfUltimosDigitos = formatCpfUltimosDigitos(user.cpf);
          const temCpf = !!cpfUltimosDigitos;

          return (
            <Card key={user.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{user.nome}</h4>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {user.role}
                      </Badge>
                      {user.setor && (
                        <Badge variant="secondary" className="text-xs">
                          {user.setor}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {temCpf ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">CPF OK</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Sem CPF</span>
                      </div>
                    )}
                  </div>
                </div>

                {temCpf ? (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Login de Produção</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded font-mono text-sm">
                          CPF: ***.***.***-{cpfUltimosDigitos}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O usuário pode fazer login na interface de produção usando os 4 últimos dígitos do CPF
                      </p>
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
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Cadastre o CPF deste usuário na aba de Usuários para habilitar o acesso à interface de produção.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
