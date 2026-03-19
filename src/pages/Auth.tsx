import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, ArrowRight } from "lucide-react";
import logoPortasEnrolar from "@/assets/logo-portas-enrolar.ico";
import { toast } from "sonner";

export default function Auth() {
  const { user, signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

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

  if (user && !loading) {
    sessionStorage.removeItem('redirectAfterLogin');
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(from);
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="w-28 h-28 rounded-full bg-blue-500/20 flex items-center justify-center">
            <img 
              src={logoPortasEnrolar} 
              alt="Logo" 
              className="w-20 h-20 object-contain drop-shadow-2xl" 
            />
          </div>
        </div>

        <Card className="w-full max-w-sm bg-primary/5 border-primary/10 backdrop-blur-xl shadow-2xl animate-scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2 text-white">
              <LogIn className="h-5 w-5 text-primary" />
              Autenticação
            </CardTitle>
            <CardDescription className="text-white/60">
              Digite seu email e senha para acessar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-primary/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <Input 
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-primary/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

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

        <div className="text-center mt-8 text-sm text-white/40 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p>Sistema de Gestão da Elisa Portas.</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span>Criado por @Indicatti_mkt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
