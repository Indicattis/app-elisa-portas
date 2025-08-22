
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
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
          <div className="hidden md:flex sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
            <div className="h-12 flex items-center px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border mx-3" />
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
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout>
                        <Configuracoes />
                      </DashboardLayout>
                    </ProtectedRoute>
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
