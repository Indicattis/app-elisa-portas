import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Menu, Settings, LogOut, Tv, Map, Network, BookOpen, Calendar as CalendarIcon, Calculator, CheckSquare } from "lucide-react";
import { MinhasTarefasSheet } from "@/components/todo/MinhasTarefasSheet";
import { useTarefasCount } from "@/hooks/useTarefasCount";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Performance from "./pages/Performance";
import Users from "./pages/Users";
import VendaNova from "./pages/VendaNova";
import VendaVinculacao from "./pages/VendaVinculacao";
import VendaEdit from "./pages/VendaEdit";
import Orcamentos from "./pages/Orcamentos";
import Faturamento from "./pages/Faturamento";
import FaturamentoEdit from "./pages/FaturamentoEdit";
import NovoOrcamento from "./pages/NovoOrcamento";
import OrcamentoEdit from "./pages/OrcamentoEdit";
import NotFound from "./pages/NotFound";
import VendaDetails from "./pages/VendaDetails";
import Visitas from "./pages/Visitas";
import VisitaNova from "./pages/VisitaNova";
import ProducaoSolda from "./pages/ProducaoSolda";
import ProducaoPerfiladeira from "./pages/ProducaoPerfiladeira";
import ProducaoSeparacao from "./pages/ProducaoSeparacao";
import ProducaoQualidade from "./pages/ProducaoQualidade";
import ProducaoPintura from "./pages/ProducaoPintura";
import Instalacoes from "./pages/Instalacoes";
import PedidoEdit from "./pages/PedidoEdit";
import NovoPedido from "./pages/NovoPedido";
import Marketing from "./pages/Marketing";
import CanaisAquisicao from "./pages/CanaisAquisicao";
import VendasHome from "./pages/VendasHome";
import FabricaHome from "./pages/FabricaHome";
import InstalacoesHome from "./pages/InstalacoesHome";
import AdministrativoHome from "./pages/AdministrativoHome";
import Investimentos from "./pages/Investimentos";
import Calendario from "./pages/Calendario";
import Autorizados from "./pages/Autorizados";
import ParceiroNovo from "./pages/ParceiroNovo";
import ParceiroEdit from "./pages/ParceiroEdit";
import MapaAutorizados from "./pages/MapaAutorizados";
import Configuracoes from "./pages/Configuracoes";
import ContadorVendas from "./pages/ContadorVendas";
import Forbidden from "./pages/Forbidden";
import Pedidos from "./pages/Pedidos";
import PedidoPreparacao from "./pages/PedidoPreparacao";
import TvDashboard from "./pages/TvDashboard";
import OrdemSoldaEdit from "./pages/OrdemSoldaEdit";
import OrdemPinturaEdit from "./pages/OrdemPinturaEdit";
import OrdemSeparacaoEdit from "./pages/OrdemSeparacaoEdit";
import OrdemPerfiladeiraEdit from "./pages/OrdemPerfiladeiraEdit";
import OrdemInstalacaoEdit from "./pages/OrdemInstalacaoEdit";
import Documentos from "./pages/Documentos";
import DocumentoNovo from "./pages/DocumentoNovo";
import Vendas from "./pages/Vendas";
import VendasNova from "./pages/VendasNova";
import Compras from "./pages/Compras";
import Fornecedores from "./pages/Fornecedores";
import RequisicoesCompra from "./pages/RequisicoesCompra";
import Estoque from "./pages/Estoque";
import EstoqueEdit from "./pages/EstoqueEdit";
import VendasCatalogo from "./pages/VendasCatalogo";
import RHAdmin from "./pages/RHAdmin";
import Representantes from "./pages/Representantes";
import Franqueados from "./pages/Franqueados";
import CronogramaInstalacoes from "./pages/CronogramaInstalacoes";
import ForcaVendas from "./pages/ForcaVendas";
import DiarioBordo from "./pages/DiarioBordo";
import Frota from "./pages/Frota";
import FrotaNovo from "./pages/FrotaNovo";
import FrotaEdit from "./pages/FrotaEdit";
import FrotaConferencia from "./pages/FrotaConferencia";
import FrotaConferenciasHistorico from "./pages/FrotaConferenciasHistorico";
import TabelaPrecos from "./pages/TabelaPrecos";
import Todo from "./pages/Todo";
import LogisticaHome from "./pages/LogisticaHome";
import Entregas from "./pages/Entregas";
import VendaView from "./pages/VendaView";
import PedidoView from "./pages/PedidoView";
import DRE from "./pages/DRE";
import Despesas from "./pages/Despesas";
import Vagas from "./pages/Vagas";
import Etiquetas from "./pages/Etiquetas";
import ProducaoLogin from "./pages/producao/ProducaoLogin";
import { ProducaoAuthProvider } from "@/hooks/useProducaoAuth";
import { ProducaoLayout } from "@/components/ProducaoLayout";
import { ProtectedProducaoRoute } from "@/components/ProtectedProducaoRoute";

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
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <SidebarInset className="flex-1 flex flex-col">
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
            <div className="h-12 flex items-center justify-between px-4 w-full">
              <div className="flex items-center">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-border mx-3" />
              </div>
              
              <div className="flex items-center gap-2 md:gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="hidden sm:flex">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                    <DropdownMenuItem asChild>
                      <NavLink to="/tv-dashboard" className="flex items-center gap-2 cursor-pointer">
                        <Tv className="h-4 w-4" />
                        <span>Modo TV</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <NavLink to="/dashboard/mapa-autorizados" className="flex items-center gap-2 cursor-pointer">
                        <Map className="h-4 w-4" />
                        <span>Mapa</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <NavLink to="/dashboard/diario-bordo" className="flex items-center gap-2 cursor-pointer">
                        <BookOpen className="h-4 w-4" />
                        <span>Diário de Bordo</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <NavLink to="/dashboard/calendario" className="flex items-center gap-2 cursor-pointer">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Calendário</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <NavLink to="/dashboard/contador-vendas" className="flex items-center gap-2 cursor-pointer">
                        <Calculator className="h-4 w-4" />
                        <span>Contador de Vendas</span>
                      </NavLink>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <HeaderUserInfo />
              </div>
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
  const { data: tarefasCount = 0 } = useTarefasCount();
  const [tarefasOpen, setTarefasOpen] = useState(false);

  if (!user) return null;

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userRole?.foto_perfil_url} alt="Foto de perfil" />
            <AvatarFallback className="text-xs">
              {getUserInitials(user.email || '')}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-sm">
            <span className="font-medium leading-none">{user.email}</span>
            <span className="text-xs text-muted-foreground capitalize leading-none mt-1">
              {userRole?.role?.replace("_", " ")}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={() => setTarefasOpen(true)}
          >
            <CheckSquare className="h-4 w-4" />
            {tarefasCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
              >
                {tarefasCount}
              </Badge>
            )}
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/dashboard/configuracoes">
              <Settings className="h-4 w-4" />
            </NavLink>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MinhasTarefasSheet open={tarefasOpen} onOpenChange={setTarefasOpen} />
    </>
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
                <Route path="/forbidden" element={<Forbidden />} />

                {/* Rotas de Produção */}
                <Route path="/producao/login" element={<ProducaoLogin />} />
                <Route
                  path="/producao/*"
                  element={
                    <ProducaoAuthProvider>
                      <Routes>
                        <Route
                          path="/solda"
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoSolda />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          }
                        />
                        <Route
                          path="/perfiladeira"
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoPerfiladeira />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          }
                        />
                        <Route
                          path="/separacao"
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoSeparacao />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          }
                        />
                        <Route
                          path="/pintura"
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoPintura />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          }
                        />
                        <Route
                          path="/qualidade"
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoQualidade />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          }
                        />
                        <Route path="/" element={<Navigate to="/producao/solda" replace />} />
                      </Routes>
                    </ProducaoAuthProvider>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requirePermission="dashboard">
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/performance"
                  element={
                    <ProtectedRoute requirePermission="performance">
                      <DashboardLayout>
                        <Performance />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/orcamentos"
                  element={
                    <ProtectedRoute requirePermission="orcamentos">
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
                    <ProtectedRoute requirePermission="users">
                      <DashboardLayout>
                        <Users />
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
                  path="/dashboard/vendas"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Vendas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/forca-vendas"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <ForcaVendas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/tabela-precos"
                  element={
                    <ProtectedRoute requirePermission="tabela_precos">
                      <DashboardLayout>
                        <TabelaPrecos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/nova"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VendasNova />
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
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VendaEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/faturamento/:id/editar"
                  element={
                    <ProtectedRoute requirePermission="faturamento">
                      <DashboardLayout>
                        <FaturamentoEdit />
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
                  path="/dashboard/logistica/home"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <LogisticaHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/entregas"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <Entregas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logistica/entregas"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <Entregas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <Instalacoes />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes/frota"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <Frota />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes/frota/novo"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <FrotaNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes/frota/:id/editar"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <FrotaEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes/frota/conferencia"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <FrotaConferencia />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes/frota/:id/conferencias"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <FrotaConferenciasHistorico />
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
                    <ProtectedRoute requirePermission="marketing">
                      <DashboardLayout>
                        <Marketing />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/home"
                  element={
                    <ProtectedRoute requirePermission="vendas">
                      <DashboardLayout>
                        <VendasHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/home"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <FabricaHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/etiquetas"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <Etiquetas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes/home"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <InstalacoesHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/home"
                  element={
                    <ProtectedRoute requirePermission="configuracoes">
                      <DashboardLayout>
                        <AdministrativoHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/canais-aquisicao"
                  element={
                    <ProtectedRoute requirePermission="marketing">
                      <DashboardLayout>
                        <CanaisAquisicao />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/investimentos"
                  element={
                    <ProtectedRoute requirePermission="marketing">
                      <DashboardLayout>
                        <Investimentos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/calendario"
                  element={
                    <ProtectedRoute requirePermission="calendario">
                      <DashboardLayout>
                        <Calendario />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/autorizados"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <Autorizados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parceiros"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <Autorizados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/representantes"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <Representantes />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/licenciados"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                      <Franqueados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/autorizados/novo"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <ParceiroNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parceiros/novo/:tipoParceiro"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <ParceiroNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/autorizados/:id/edit"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <ParceiroEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parceiros/:id/edit/:tipoParceiro"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <ParceiroEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/mapa-autorizados"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <MapaAutorizados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/configuracoes"
                  element={
                    <ProtectedRoute requirePermission="configuracoes">
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
                  path="/dashboard/producao/solda"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <ProducaoSolda />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/producao/perfiladeira"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <ProducaoPerfiladeira />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/producao/separacao"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <ProducaoSeparacao />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/producao/qualidade"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <ProducaoQualidade />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/producao/pintura"
                  element={
                    <ProtectedRoute requirePermission="producao">
                      <DashboardLayout>
                        <ProducaoPintura />
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
                  path="/dashboard/pedidos/:id/preparacao"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <PedidoPreparacao />
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
                  path="/dashboard/documentos"
                  element={
                    <ProtectedRoute requirePermission="documentos">
                      <DashboardLayout>
                        <Documentos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/documentos/novo"
                  element={
                    <ProtectedRoute requirePermission="documentos">
                      <DashboardLayout>
                        <DocumentoNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/compras"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Compras />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/compras/fornecedores"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Fornecedores />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/compras/requisicoes"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <RequisicoesCompra />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/estoque"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Estoque />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/estoque/editar/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <EstoqueEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas-catalogo"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VendasCatalogo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/rh-admin"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <RHAdmin />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parceiros/representantes"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <Representantes />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parceiros/franqueados"
                  element={
                    <ProtectedRoute requirePermission="autorizados">
                      <DashboardLayout>
                        <Franqueados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/instalacoes/cronograma"
                  element={
                    <ProtectedRoute requirePermission="instalacoes">
                      <DashboardLayout>
                        <CronogramaInstalacoes />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tv-dashboard"
                  element={
                    <ProtectedRoute requirePermission="tv_dashboard">
                      <DashboardLayout>
                        <TvDashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/diario-bordo"
                  element={
                    <ProtectedRoute requirePermission="diario_bordo">
                      <DashboardLayout>
                        <DiarioBordo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/direcao/dre"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <DRE />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/direcao/despesas"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Despesas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dp-rh/vagas"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Vagas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/:id/view"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <VendaView />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/pedido/:id/view"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <PedidoView />
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