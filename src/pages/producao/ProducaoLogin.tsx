import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2 } from "lucide-react";
import logoDark from "@/assets/logo-dark.png";

export default function ProducaoLogin() {
  const [cpfDigitos, setCpfDigitos] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Sanitize: never redirect back to login itself
  const rawFrom = (location.state as any)?.from?.pathname || "/producao";
  const from = rawFrom === "/producao/login" ? "/producao" : rawFrom;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cpfDigitos.trim()) {
      toast({
        title: "CPF necessário",
        description: "Por favor, informe os últimos 4 dígitos do seu CPF",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{4}$/.test(cpfDigitos.trim())) {
      toast({
        title: "CPF inválido",
        description: "Digite exatamente 4 dígitos numéricos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: setupData, error: setupError } = await supabase.functions.invoke('manage-producao-auth', {
        body: { cpf_ultimos_4: cpfDigitos.trim() }
      });

      if (setupError || !setupData?.success) {
        console.error("Erro ao configurar credenciais:", setupError || setupData);
        
        const errorMessage = setupData?.message || setupData?.error || setupError?.message;
        
        toast({
          title: "Erro de autenticação",
          description: errorMessage === 'Usuário não encontrado' 
            ? "CPF não encontrado ou usuário inativo"
            : "Não foi possível configurar credenciais. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const email = setupData.email;
      const password = setupData.password;
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.session) {
        console.error("Erro na autenticação Supabase:", signInError);
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível autenticar. Contate o administrador.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${setupData.user.nome}!`,
      });

      // Small delay to let auth state propagate before navigating
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={logoDark} alt="Logo" className="h-16" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Hub da Fábrica</CardTitle>
            <CardDescription className="text-base mt-2">
              Informe os últimos 4 dígitos do seu CPF para acessar
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Digite os 4 últimos dígitos do CPF"
                  value={cpfDigitos}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '');
                    if (valor.length <= 4) {
                      setCpfDigitos(valor);
                    }
                  }}
                  className="pl-10 h-12 text-lg"
                  disabled={loading}
                  autoFocus
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
