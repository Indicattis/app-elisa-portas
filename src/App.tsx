import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
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
import NotFound from "./pages/NotFound";
import VendaDetails from "./pages/VendaDetails";
import Visitas from "./pages/Visitas";
import VisitaNova from "./pages/VisitaNova";
import Producao from "./pages/Producao";

const queryClient = new QueryClient();

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

const App = () => (
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
