
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedRouteWithPermission } from "@/components/ProtectedRouteWithPermission";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Performance from "./pages/Performance";
import Leads from "./pages/Leads";
import LeadNovo from "./pages/LeadNovo";
import Users from "./pages/Users";
import LeadDetails from "./pages/LeadDetails";
import LeadEdit from "./pages/LeadEdit";
import LeadVenda from "./pages/LeadVenda";
import VendaNova from "./pages/VendaNova";
import VendaVinculacao from "./pages/VendaVinculacao";
import VendaEdit from "./pages/VendaEdit";
import Faturamento from "./pages/Faturamento";
import Orcamentos from "./pages/Orcamentos";
import NovoOrcamento from "./pages/NovoOrcamento";
import OrcamentoEdit from "./pages/OrcamentoEdit";
import NotFound from "./pages/NotFound";
import VendaDetails from "./pages/VendaDetails";
import Visitas from "./pages/Visitas";
import VisitaNova from "./pages/VisitaNova";
import Producao from "./pages/Producao";
import Instalacoes from "./pages/Instalacoes";
import PedidoEdit from "./pages/PedidoEdit";
import NovoPedido from "./pages/NovoPedido";
import Marketing from "./pages/Marketing";
import ContasReceber from "./pages/ContasReceber";
import Organograma from "./pages/Organograma";
import Calendario from "./pages/Calendario";
import Autorizados from "./pages/Autorizados";
import AutorizadoNovo from "./pages/AutorizadoNovo";
import Configuracoes from "./pages/Configuracoes";
import ContadorVendas from "./pages/ContadorVendas";
import Pedidos from "./pages/Pedidos";
import PermissoesUsuarios from "./pages/PermissoesUsuarios";
import PermissoesRoles from "./pages/PermissoesRoles";
import OrdemSoldaEdit from "./pages/OrdemSoldaEdit";
import OrdemPinturaEdit from "./pages/OrdemPinturaEdit";
import OrdemSeparacaoEdit from "./pages/OrdemSeparacaoEdit";
import OrdemPerfiladeiraEdit from "./pages/OrdemPerfiladeiraEdit";
import OrdemInstalacaoEdit from "./pages/OrdemInstalacaoEdit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Não retry em erros de autenticação
        if (error?.message?.includes('Invalid Refresh Token')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {/* Sidebar para desktop */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <SidebarInset className="flex-1 flex flex-col md:flex-1">
          {/* Header com botão de colapsar sidebar no desktop */}
          <div className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 w-screen">
            <div className="h-12 flex items-center justify-between px-4 w-full">
              <div className="flex items-center">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-border mx-3" />
              </div>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <HeaderUserInfo />
              </div>
            </div>
          </div>

          {/* Header mobile com botão de menu */}
          <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
            <div className="h-12 flex items-center justify-between px-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 sm:w-80">
                  <AppSidebar />
                </SheetContent>
              </Sheet>
              <span className="text-sm font-medium">Menu</span>
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function HeaderUserInfo() {
  const { user, userRole, isAdmin, signOut } = useAuth();
  const { hasPermission } = useUserPermissions();

  if (!user) return null;

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userRole?.foto_perfil_url} alt="Foto de perfil" />
          <AvatarFallback className="text-xs">
            {getUserInitials(user.email || '')}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-sm">
          <span className="font-medium leading-none">{user.email}</span>
          <span className="text-xs text-muted-foreground capitalize leading-none mt-1">
            {userRole?.role?.replace("_", " ")}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {(isAdmin || hasPermission('configuracoes')) && (
          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/dashboard/configuracoes">
              <Settings className="h-4 w-4" />
            </NavLink>
          </Button>
        )}
        
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/performance"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Performance />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/leads"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Leads />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/leads/novo"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <LeadNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/leads/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <LeadDetails />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/orcamentos"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Orcamentos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/orcamentos/novo"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <NovoOrcamento />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/orcamentos/editar/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrcamentoEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/users"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <Users />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/leads/:id/edit"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <LeadEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/leads/:id/venda"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <LeadVenda />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/faturamento"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Faturamento />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/nova"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VendaNova />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/vincular"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VendaVinculacao />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/:id/editar"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <VendaEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VendaDetails />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/visitas"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Visitas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/visitas/nova/:leadId"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VisitaNova />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/producao"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Producao />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Instalacoes />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/novo-pedido"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <NovoPedido />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/marketing"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Marketing />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/contas-receber"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <ContasReceber />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/organograma"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <Organograma />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/calendario"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Calendario />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/autorizados"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <Autorizados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/autorizados/novo"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <AutorizadoNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/configuracoes"
                  element={
                    <ProtectedRouteWithPermission permission="configuracoes">
                      <DashboardLayout>
                        <Configuracoes />
                      </DashboardLayout>
                    </ProtectedRouteWithPermission>
                  }
                />
                <Route
                  path="/dashboard/pedidos"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Pedidos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/pedidos/edit/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <PedidoEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/contador-vendas"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <ContadorVendas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/ordens/solda/:ordemId"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrdemSoldaEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/ordens/pintura/:ordemId"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrdemPinturaEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/ordens/separacao/:ordemId"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrdemSeparacaoEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/ordens/perfiladeira/:ordemId"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrdemPerfiladeiraEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/ordens/instalacao/:ordemId"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrdemInstalacaoEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/permissoes/usuarios"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <PermissoesUsuarios />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/permissoes/roles"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <PermissoesRoles />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
