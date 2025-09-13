import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Eye, EyeOff, Shield, Monitor, Lock, UserPlus, LogIn, ArrowRight, Zap } from "lucide-react";

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const location = useLocation();

  // Get the intended destination from state, default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const nome = formData.get("nome") as string;

    try {
      await signUp(email, password, { nome });
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-background/80">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.03'%3E%3Cpath d='m0 40h40v-40h-40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-primary/10 p-4 rounded-full border border-primary/20">
                  <Shield className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
              Central de Controle
            </h1>
            <p className="text-muted-foreground text-lg">
              Acesso seguro ao sistema integrado
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Monitor className="h-4 w-4" />
              <span>Monitoramento</span>
              <span className="text-primary">•</span>
              <Zap className="h-4 w-4" />
              <span>Automação</span>
              <span className="text-primary">•</span>
              <Lock className="h-4 w-4" />
              <span>Segurança</span>
            </div>
          </div>

          {/* Auth Card */}
          <Card className="backdrop-blur-md bg-card/90 border-primary/20 shadow-2xl animate-scale-in">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2">
                {isSignUp ? (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" />
                    Criar Acesso
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 text-primary" />
                    Autenticação
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isSignUp 
                  ? "Configure sua conta para acessar o sistema"
                  : "Insira suas credenciais para continuar"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {/* Nome field - only for signup */}
                <div className={`space-y-2 transition-all duration-300 ${
                  isSignUp ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
                }`}>
                  <Label htmlFor="nome" className="text-sm font-medium">Nome Completo</Label>
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                    required={isSignUp}
                  />
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isSignUp ? "Crie uma senha segura" : "Sua senha"}
                      className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
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
                        {isSignUp ? "Criando conta..." : "Autenticando..."}
                      </>
                    ) : (
                      <>
                        {isSignUp ? "Criar Conta" : "Acessar Sistema"}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </Button>
              </form>

              {/* Toggle auth mode */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  {isSignUp ? "Já possui acesso?" : "Primeiro acesso?"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleAuthMode}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {isSignUp ? "Fazer Login" : "Criar Conta"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground animate-fade-in" style={{animationDelay: '0.5s'}}>
            <p>Sistema protegido por autenticação multifatorial</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Lock className="h-3 w-3" />
              <span>Conexão segura SSL/TLS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}