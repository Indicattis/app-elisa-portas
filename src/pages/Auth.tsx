import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, ArrowRight } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import logoPortasEnrolar from "@/assets/logo-portas-enrolar.ico";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const { user, signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cpf, setCpf] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Get the intended destination: priority state > sessionStorage > /home
  const getRedirectPath = () => {
    if (location.state?.from?.pathname) {
      return location.state.from.pathname;
    }
    const savedPath = sessionStorage.getItem('redirectAfterLogin');
    if (savedPath && savedPath !== '/auth') {
      return savedPath;
    }
    return '/home';
  };

  const from = getRedirectPath();

  // Redirect if already authenticated
  if (user && !loading) {
    sessionStorage.removeItem('redirectAfterLogin');
    return <Navigate to={from} replace />;
  }

  // Formatar CPF com máscara ###.###.###-##
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      toast.error('Digite o CPF completo (11 dígitos)');
      return;
    }

    setIsLoading(true);

    try {
      // Chamar edge function para configurar autenticação via CPF
      const { data, error } = await supabase.functions.invoke('manage-producao-auth', {
        body: { cpf_completo: cpfLimpo }
      });

      if (error || !data?.success) {
        console.error('Erro na edge function:', error || data?.error);
        toast.error(data?.message || 'CPF não encontrado ou usuário inativo');
        setIsLoading(false);
        return;
      }

      // Fazer login com o email retornado e senha padrão
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        console.error('Erro no login:', signInError);
        toast.error('Erro ao autenticar. Tente novamente.');
        setIsLoading(false);
        return;
      }

      toast.success(`Bem-vindo, ${data.user.nome}!`);
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(from);
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        {/* Logo */}
        <div 
          className="mb-8 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="w-28 h-28 rounded-full bg-blue-500/20 flex items-center justify-center">
            <img 
              src={logoPortasEnrolar} 
              alt="Logo" 
              className="w-20 h-20 object-contain drop-shadow-2xl" 
            />
          </div>
        </div>

        {/* Auth Card - Glassmorphism style */}
        <Card 
          className="w-full max-w-sm bg-primary/5 border-primary/10 backdrop-blur-xl shadow-2xl animate-scale-in"
        >
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2 text-white">
              <LogIn className="h-5 w-5 text-primary" />
              Autenticação
            </CardTitle>
            <CardDescription className="text-white/60">
              Digite seu CPF para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* CPF field */}
              <div className="space-y-2">
                <Input 
                  type="password"
                  inputMode="numeric"
                  placeholder="•••.•••.•••-••"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="text-center text-lg tracking-wider bg-white/5 border-primary/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200" 
                disabled={isLoading}
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Autenticando...
                    </>
                  ) : (
                    <>
                      Acessar Sistema
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </div>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div 
          className="text-center mt-8 text-sm text-white/40 animate-fade-in" 
          style={{ animationDelay: '0.5s' }}
        >
          <p>Sistema de Gestão da Elisa Portas.</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span>Criado por @Indicatti_mkt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
