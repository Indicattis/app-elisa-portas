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
import ProducaoSolda from "./pages/ProducaoSolda";
import ProducaoPerfiladeira from "./pages/ProducaoPerfiladeira";
import ProducaoSeparacao from "./pages/ProducaoSeparacao";
import ProducaoQualidade from "./pages/ProducaoQualidade";
import ProducaoPintura from "./pages/ProducaoPintura";
import PedidoEdit from "./pages/PedidoEdit";
import NovoPedido from "./pages/NovoPedido";
import Marketing from "./pages/Marketing";
import CanaisAquisicao from "./pages/CanaisAquisicao";
import VendasHome from "./pages/VendasHome";
import FabricaHome from "./pages/FabricaHome";
import AdministrativoHome from "./pages/AdministrativoHome";
import Investimentos from "./pages/Investimentos";
import Calendario from "./pages/Calendario";
import Autorizados from "./pages/Autorizados";
import ParceiroNovo from "./pages/ParceiroNovo";
import ParceiroEdit from "./pages/ParceiroEdit";
import MapaAutorizados from "./pages/MapaAutorizados";
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
import ContratoVendas from "./pages/ContratoVendas";
import ContratoTemplates from "./pages/ContratoTemplates";
import Suporte from "./pages/Suporte";
import Fornecedores from "./pages/Fornecedores";
import RequisicoesCompra from "./pages/RequisicoesCompra";
import Estoque from "./pages/Estoque";
import EstoqueEdit from "./pages/EstoqueEdit";
import EstoqueGerenciamento from "./pages/EstoqueGerenciamento";
import VendasCatalogo from "./pages/VendasCatalogo";
import Representantes from "./pages/Representantes";
import Franqueados from "./pages/Franqueados";
import EquipesInstalacao from "./pages/EquipesInstalacao";

import DiarioBordo from "./pages/DiarioBordo";
import Frota from "./pages/Frota";
import FrotaNovo from "./pages/FrotaNovo";
import FrotaEdit from "./pages/FrotaEdit";
import FrotaConferencia from "./pages/FrotaConferencia";
import FrotaConferenciasHistorico from "./pages/FrotaConferenciasHistorico";
import TabelaPrecos from "./pages/TabelaPrecos";
import Todo from "./pages/Todo";
import Expedicao from "./pages/Expedicao";
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
import { AdminLayout } from "@/components/AdminLayout";
import { PaineisLayout } from "@/components/PaineisLayout";
import { ProtectedProducaoRoute } from "@/components/ProtectedProducaoRoute";
import HistoricoProducao from "./pages/HistoricoProducao";
import ProducaoCarregamento from "./pages/ProducaoCarregamento";
import ProducaoHome from "./pages/ProducaoHome";
import ProducaoControle from "./pages/ProducaoControle";
import Ordens from "./pages/Ordens";
import AdminHome from "./pages/admin/AdminHome";
import AdminPermissions from "./pages/admin/AdminPermissions";
import AdminRoles from "./pages/admin/AdminRoles";
import CompanySettings from "./pages/admin/CompanySettings";
import ParceiroHome from "./pages/ParceiroHome";
import ComprasHome from "./pages/ComprasHome";
import FinanceiroHome from "./pages/FinanceiroHome";
import RHHome from "./pages/RHHome";
import PaineisHome from "./pages/PaineisHome";
import DirecaoHome from "./pages/DirecaoHome";
import DirecaoChecklist from "./pages/DirecaoChecklist";
import Caixa from "./pages/Caixa";

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
        <AppSidebar />

        <SidebarInset className="flex-1 flex flex-col">
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
            <div className="h-12 flex items-center justify-between px-4 w-full">
              <div className="flex items-center">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-border mx-3" />
              </div>
              
              <div className="flex items-center gap-2 md:gap-3">
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
            <NavLink to="/admin">
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
                        <Route
                          path="/carregamento"
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoCarregamento />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          }
                        />
                        <Route
                          path="/controle"
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoControle />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          }
                        />
                        <Route 
                          path="/" 
                          element={
                            <ProtectedProducaoRoute>
                              <ProducaoLayout>
                                <ProducaoHome />
                              </ProducaoLayout>
                            </ProtectedProducaoRoute>
                          } 
                        />
                      </Routes>
                    </ProducaoAuthProvider>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute routeKey="dashboard">
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/direcao"
                  element={
                    <ProtectedRoute routeKey="direcao">
                      <DashboardLayout>
                        <DirecaoHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/direcao/checklist"
                  element={
                    <ProtectedRoute routeKey="direcao_checklist">
                      <DashboardLayout>
                        <DirecaoChecklist />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/marketing/performance"
                  element={
                    <ProtectedRoute routeKey="performance">
                      <DashboardLayout>
                        <Performance />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/orcamentos"
                  element={
                    <ProtectedRoute routeKey="orcamentos">
                      <DashboardLayout>
                        <Orcamentos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/orcamentos/novo"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <NovoOrcamento />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/orcamentos/editar/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrcamentoEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute routeKey="users">
                      <AdminLayout>
                        <Users />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/financeiro/faturamento"
                  element={
                    <ProtectedRoute routeKey="faturamento">
                      <DashboardLayout>
                        <Faturamento />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas"
                  element={
                    <ProtectedRoute routeKey="vendas_home">
                      <DashboardLayout>
                        <VendasHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/listagem"
                  element={
                    <ProtectedRoute routeKey="vendas_listagem">
                      <DashboardLayout>
                        <Vendas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/tabela-precos"
                  element={
                    <ProtectedRoute routeKey="tabela_precos">
                      <DashboardLayout>
                        <TabelaPrecos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/contratos"
                  element={
                    <ProtectedRoute routeKey="vendas">
                      <DashboardLayout>
                        <ContratoVendas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/contratos/templates"
                  element={
                    <ProtectedRoute routeKey="vendas">
                      <DashboardLayout>
                        <ContratoTemplates />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/suporte"
                  element={
                    <ProtectedRoute routeKey="vendas">
                      <DashboardLayout>
                        <Suporte />
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
                  path="/dashboard/administrativo/financeiro/faturamento/:id/editar"
                  element={
                    <ProtectedRoute routeKey="faturamento">
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
                  path="/dashboard/logistica"
                  element={
                    <ProtectedRoute routeKey="logistica_home">
                      <DashboardLayout>
                        <Expedicao />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/entregas"
                  element={
                    <ProtectedRoute routeKey="entregas">
                      <DashboardLayout>
                        <Entregas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logistica/entregas"
                  element={
                    <ProtectedRoute routeKey="entregas">
                      <DashboardLayout>
                        <Entregas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logistica/frota"
                  element={
                    <ProtectedRoute routeKey="frota">
                      <DashboardLayout>
                        <Frota />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logistica/frota/novo"
                  element={
                    <ProtectedRoute routeKey="frota">
                      <DashboardLayout>
                        <FrotaNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logistica/frota/:id/editar"
                  element={
                    <ProtectedRoute routeKey="frota">
                      <DashboardLayout>
                        <FrotaEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logistica/frota/conferencia"
                  element={
                    <ProtectedRoute routeKey="frota">
                      <DashboardLayout>
                        <FrotaConferencia />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logistica/frota/:id/conferencias"
                  element={
                    <ProtectedRoute routeKey="frota">
                      <DashboardLayout>
                        <FrotaConferenciasHistorico />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expedicao"
                  element={
                    <ProtectedRoute routeKey="expedicao">
                      <Expedicao />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instalacoes"
                  element={
                    <ProtectedRoute routeKey="instalacoes_nova">
                      <Expedicao />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instalacoes/equipes"
                  element={
                    <ProtectedRoute routeKey="instalacoes_equipes">
                      <EquipesInstalacao />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/novo-pedido"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <NovoPedido />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/historico-producao"
                  element={
                    <ProtectedRoute routeKey="historico_producao">
                      <DashboardLayout>
                        <HistoricoProducao />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/ordens"
                  element={
                    <ProtectedRoute routeKey="ordens">
                      <DashboardLayout>
                        <Ordens />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/pedidos"
                  element={
                    <ProtectedRoute routeKey="pedidos">
                      <DashboardLayout>
                        <Pedidos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/etiquetas"
                  element={
                    <ProtectedRoute routeKey="etiquetas">
                      <DashboardLayout>
                        <Etiquetas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/marketing"
                  element={
                    <ProtectedRoute routeKey="marketing">
                      <DashboardLayout>
                        <Marketing />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica"
                  element={
                    <ProtectedRoute routeKey="fabrica_home">
                      <DashboardLayout>
                        <FabricaHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/fabrica/etiquetas"
                  element={
                    <ProtectedRoute routeKey="etiquetas">
                      <DashboardLayout>
                        <Etiquetas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo"
                  element={
                    <ProtectedRoute routeKey="administrativo_home">
                      <DashboardLayout>
                        <AdministrativoHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/marketing/canais-aquisicao"
                  element={
                    <ProtectedRoute routeKey="canais_aquisicao">
                      <DashboardLayout>
                        <CanaisAquisicao />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/marketing/investimentos"
                  element={
                    <ProtectedRoute routeKey="investimentos">
                      <DashboardLayout>
                        <Investimentos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/paineis"
                  element={
                    <ProtectedRoute>
                      <PaineisLayout>
                        <PaineisHome />
                      </PaineisLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/paineis/calendario"
                  element={
                    <ProtectedRoute routeKey="calendario">
                      <PaineisLayout>
                        <Calendario />
                      </PaineisLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/parceiros"
                  element={
                    <ProtectedRoute routeKey="parceiros_home">
                      <DashboardLayout>
                        <ParceiroHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/parceiros/autorizados"
                  element={
                    <ProtectedRoute routeKey="autorizados">
                      <DashboardLayout>
                        <Autorizados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/parceiros/representantes"
                  element={
                    <ProtectedRoute routeKey="representantes">
                      <DashboardLayout>
                        <Representantes />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/parceiros/franqueados"
                  element={
                    <ProtectedRoute routeKey="franqueados">
                      <DashboardLayout>
                      <Franqueados />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/autorizados/novo"
                  element={
                    <ProtectedRoute routeKey="autorizados">
                      <DashboardLayout>
                        <ParceiroNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parceiros/novo/:tipoParceiro"
                  element={
                    <ProtectedRoute routeKey="autorizados">
                      <DashboardLayout>
                        <ParceiroNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/autorizados/:id/edit"
                  element={
                    <ProtectedRoute routeKey="autorizados">
                      <DashboardLayout>
                        <ParceiroEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parceiros/:id/edit/:tipoParceiro"
                  element={
                    <ProtectedRoute routeKey="autorizados">
                      <DashboardLayout>
                        <ParceiroEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/paineis/mapa"
                  element={
                    <ProtectedRoute routeKey="mapa_autorizados">
                      <PaineisLayout>
                        <MapaAutorizados />
                      </PaineisLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Redirecionamentos para as novas rotas de produção */}
                <Route path="/dashboard/producao/solda" element={<Navigate to="/producao/solda" replace />} />
                <Route path="/dashboard/producao/perfiladeira" element={<Navigate to="/producao/perfiladeira" replace />} />
                <Route path="/dashboard/producao/separacao" element={<Navigate to="/producao/separacao" replace />} />
                <Route path="/dashboard/producao/qualidade" element={<Navigate to="/producao/qualidade" replace />} />
                <Route path="/dashboard/producao/pintura" element={<Navigate to="/producao/pintura" replace />} />
                <Route path="/dashboard/producao/carregamento" element={<Navigate to="/producao/carregamento" replace />} />
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
                  path="/paineis/contador-vendas"
                  element={
                    <ProtectedRoute routeKey="contador_vendas">
                      <PaineisLayout>
                        <ContadorVendas />
                      </PaineisLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Redirect antiga rota de preparação para view unificada */}
                <Route
                  path="/dashboard/pedidos/:id/preparacao"
                  element={<Navigate to="/dashboard/pedido/:id/view" replace />}
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
                  path="/dashboard/administrativo/documentos"
                  element={
                    <ProtectedRoute routeKey="documentos">
                      <DashboardLayout>
                        <Documentos />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/documentos/novo"
                  element={
                    <ProtectedRoute routeKey="documentos">
                      <DashboardLayout>
                        <DocumentoNovo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/compras"
                  element={
                    <ProtectedRoute routeKey="compras_home">
                      <DashboardLayout>
                        <ComprasHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/compras/fornecedores"
                  element={
                    <ProtectedRoute routeKey="fornecedores">
                      <DashboardLayout>
                        <Fornecedores />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/compras/requisicoes-compra"
                  element={
                    <ProtectedRoute routeKey="requisicoes_compra">
                      <DashboardLayout>
                        <RequisicoesCompra />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/compras/estoque"
                  element={
                    <ProtectedRoute routeKey="estoque">
                      <DashboardLayout>
                        <Estoque />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/compras/estoque/gerenciamento"
                  element={
                    <ProtectedRoute routeKey="estoque_gerenciamento">
                      <DashboardLayout>
                        <EstoqueGerenciamento />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/compras/estoque/editar/:id"
                  element={
                    <ProtectedRoute routeKey="estoque_editar">
                      <DashboardLayout>
                        <EstoqueEdit />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/vendas/vendas-catalogo"
                  element={
                    <ProtectedRoute routeKey="vendas_catalogo">
                      <DashboardLayout>
                        <VendasCatalogo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/paineis/tv-dashboard"
                  element={
                    <ProtectedRoute routeKey="tv_dashboard">
                      <PaineisLayout>
                        <TvDashboard />
                      </PaineisLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/paineis/diario-bordo"
                  element={
                    <ProtectedRoute routeKey="diario_bordo">
                      <PaineisLayout>
                        <DiarioBordo />
                      </PaineisLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/financeiro"
                  element={
                    <ProtectedRoute routeKey="financeiro_home">
                      <DashboardLayout>
                        <FinanceiroHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/financeiro/dre"
                  element={
                    <ProtectedRoute routeKey="dre">
                      <DashboardLayout>
                        <DRE />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/financeiro/despesas"
                  element={
                    <ProtectedRoute routeKey="despesas">
                      <DashboardLayout>
                        <Despesas />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/financeiro/caixa"
                  element={
                    <ProtectedRoute routeKey="financeiro_caixa">
                      <DashboardLayout>
                        <Caixa />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/rh"
                  element={
                    <ProtectedRoute routeKey="rh_home">
                      <DashboardLayout>
                        <RHHome />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/administrativo/rh/vagas"
                  element={
                    <ProtectedRoute routeKey="vagas">
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

                <Route
                  path="/todo"
                  element={
                    <ProtectedRoute routeKey="todo">
                      <DashboardLayout>
                        <Todo />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Rotas Admin */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute routeKey="admin">
                      <AdminLayout>
                        <AdminHome />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/permissions"
                  element={
                    <ProtectedRoute routeKey="admin_permissions">
                      <AdminLayout>
                        <AdminPermissions />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/roles"
                  element={
                    <ProtectedRoute routeKey="admin_roles">
                      <AdminLayout>
                        <AdminRoles />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/company"
                  element={
                    <ProtectedRoute routeKey="admin">
                      <AdminLayout>
                        <CompanySettings />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Redirects para novas URLs */}
                <Route path="/tv-dashboard" element={<Navigate to="/paineis/tv-dashboard" replace />} />
                <Route path="/dashboard/paineis/calendario" element={<Navigate to="/paineis/calendario" replace />} />
                <Route path="/dashboard/paineis/diario-bordo" element={<Navigate to="/paineis/diario-bordo" replace />} />
                <Route path="/dashboard/paineis/mapa" element={<Navigate to="/paineis/mapa" replace />} />
                <Route path="/dashboard/performance" element={<Navigate to="/dashboard/marketing/performance" replace />} />
                
                {/* Redirects Marketing */}
                <Route path="/dashboard/marketing/home" element={<Navigate to="/dashboard/marketing" replace />} />
                
                {/* Redirects Vendas */}
                <Route path="/dashboard/vendas/home" element={<Navigate to="/dashboard/vendas" replace />} />
                <Route path="/dashboard/orcamentos" element={<Navigate to="/dashboard/vendas/orcamentos" replace />} />
                <Route path="/dashboard/orcamentos/novo" element={<Navigate to="/dashboard/vendas/orcamentos/novo" replace />} />
                <Route path="/dashboard/orcamentos/editar/:id" element={<Navigate to="/dashboard/vendas/orcamentos/editar/:id" replace />} />
                <Route path="/dashboard/vendas-catalogo" element={<Navigate to="/dashboard/vendas/vendas-catalogo" replace />} />
                <Route path="/dashboard/autorizados" element={<Navigate to="/dashboard/vendas/parceiros/autorizados" replace />} />
                <Route path="/dashboard/parceiros" element={<Navigate to="/dashboard/vendas/parceiros" replace />} />
                <Route path="/dashboard/representantes" element={<Navigate to="/dashboard/vendas/parceiros/representantes" replace />} />
                <Route path="/dashboard/franqueados" element={<Navigate to="/dashboard/vendas/parceiros/franqueados" replace />} />
                
                {/* Redirects Fábrica */}
                <Route path="/dashboard/pedidos" element={<Navigate to="/dashboard/fabrica/pedidos" replace />} />
                <Route path="/dashboard/ordens" element={<Navigate to="/dashboard/fabrica/ordens" replace />} />
                <Route path="/dashboard/etiquetas" element={<Navigate to="/dashboard/fabrica/etiquetas" replace />} />
                <Route path="/dashboard/historico-producao" element={<Navigate to="/dashboard/fabrica/historico-producao" replace />} />
                <Route path="/dashboard/novo-pedido" element={<Navigate to="/dashboard/fabrica/novo-pedido" replace />} />
                
                {/* Redirects Logística */}
                <Route path="/dashboard/entregas" element={<Navigate to="/dashboard/logistica/entregas" replace />} />
                <Route path="/dashboard/frota" element={<Navigate to="/dashboard/logistica/frota" replace />} />
                <Route path="/dashboard/instalacoes/frota" element={<Navigate to="/dashboard/logistica/frota" replace />} />
                <Route path="/dashboard/instalacoes/frota/novo" element={<Navigate to="/dashboard/logistica/frota/novo" replace />} />
                <Route path="/dashboard/instalacoes/frota/:id/editar" element={<Navigate to="/dashboard/logistica/frota/:id/editar" replace />} />
                <Route path="/dashboard/instalacoes/frota/conferencia" element={<Navigate to="/dashboard/logistica/frota/conferencia" replace />} />
                <Route path="/dashboard/instalacoes/frota/:id/conferencias" element={<Navigate to="/dashboard/logistica/frota/:id/conferencias" replace />} />
                
                {/* Redirects Instalações */}
                <Route path="/dashboard/instalacoes/cronograma" element={<Navigate to="/dashboard/instalacoes/cronograma-instalacoes" replace />} />
                
                {/* Redirects Administrativo - Compras */}
                <Route path="/dashboard/compras/fornecedores" element={<Navigate to="/dashboard/administrativo/compras/fornecedores" replace />} />
                <Route path="/dashboard/compras/requisicoes-compra" element={<Navigate to="/dashboard/administrativo/compras/requisicoes-compra" replace />} />
                <Route path="/dashboard/compras/estoque" element={<Navigate to="/dashboard/administrativo/compras/estoque" replace />} />
                <Route path="/dashboard/compras/estoque/editar/:id" element={<Navigate to="/dashboard/administrativo/compras/estoque/editar/:id" replace />} />
                <Route path="/dashboard/estoque" element={<Navigate to="/dashboard/administrativo/compras/estoque" replace />} />
                <Route path="/dashboard/estoque/editar/:id" element={<Navigate to="/dashboard/administrativo/compras/estoque/editar/:id" replace />} />
                <Route path="/dashboard/fornecedores" element={<Navigate to="/dashboard/administrativo/compras/fornecedores" replace />} />
                
                {/* Redirects Administrativo - Financeiro */}
                <Route path="/dashboard/faturamento" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento" replace />} />
                <Route path="/dashboard/faturamento/:id/editar" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento/:id/editar" replace />} />
                <Route path="/dashboard/financeiro/faturamento" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento" replace />} />
                <Route path="/dashboard/financeiro/faturamento/:id/editar" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento/:id/editar" replace />} />
                <Route path="/dashboard/financeiro/dre" element={<Navigate to="/dashboard/administrativo/financeiro/dre" replace />} />
                <Route path="/dashboard/financeiro/despesas" element={<Navigate to="/dashboard/administrativo/financeiro/despesas" replace />} />
                <Route path="/dashboard/dre" element={<Navigate to="/dashboard/administrativo/financeiro/dre" replace />} />
                <Route path="/dashboard/despesas" element={<Navigate to="/dashboard/administrativo/financeiro/despesas" replace />} />
                <Route path="/dashboard/financeiro/investimentos" element={<Navigate to="/dashboard/marketing/investimentos" replace />} />
                <Route path="/dashboard/investimentos" element={<Navigate to="/dashboard/marketing/investimentos" replace />} />

                {/* Redirects para novas URLs */}
                <Route path="/tv-dashboard" element={<Navigate to="/paineis/tv-dashboard" replace />} />
                <Route path="/dashboard/paineis/calendario" element={<Navigate to="/paineis/calendario" replace />} />
                <Route path="/dashboard/paineis/diario-bordo" element={<Navigate to="/paineis/diario-bordo" replace />} />
                <Route path="/dashboard/paineis/mapa" element={<Navigate to="/paineis/mapa" replace />} />
                <Route path="/dashboard/performance" element={<Navigate to="/dashboard/marketing/performance" replace />} />
                
                {/* Redirects Marketing */}
                <Route path="/dashboard/marketing/home" element={<Navigate to="/dashboard/marketing" replace />} />
                
                {/* Redirects Vendas */}
                <Route path="/dashboard/vendas/home" element={<Navigate to="/dashboard/vendas" replace />} />
                <Route path="/dashboard/orcamentos" element={<Navigate to="/dashboard/vendas/orcamentos" replace />} />
                <Route path="/dashboard/orcamentos/novo" element={<Navigate to="/dashboard/vendas/orcamentos/novo" replace />} />
                <Route path="/dashboard/orcamentos/editar/:id" element={<Navigate to="/dashboard/vendas/orcamentos/editar/:id" replace />} />
                <Route path="/dashboard/vendas-catalogo" element={<Navigate to="/dashboard/vendas/vendas-catalogo" replace />} />
                <Route path="/dashboard/autorizados" element={<Navigate to="/dashboard/vendas/parceiros/autorizados" replace />} />
                <Route path="/dashboard/parceiros" element={<Navigate to="/dashboard/vendas/parceiros" replace />} />
                <Route path="/dashboard/representantes" element={<Navigate to="/dashboard/vendas/parceiros/representantes" replace />} />
                <Route path="/dashboard/franqueados" element={<Navigate to="/dashboard/vendas/parceiros/franqueados" replace />} />
                
                {/* Redirects Fábrica */}
                <Route path="/dashboard/pedidos" element={<Navigate to="/dashboard/fabrica/pedidos" replace />} />
                <Route path="/dashboard/ordens" element={<Navigate to="/dashboard/fabrica/ordens" replace />} />
                <Route path="/dashboard/etiquetas" element={<Navigate to="/dashboard/fabrica/etiquetas" replace />} />
                <Route path="/dashboard/historico-producao" element={<Navigate to="/dashboard/fabrica/historico-producao" replace />} />
                <Route path="/dashboard/novo-pedido" element={<Navigate to="/dashboard/fabrica/novo-pedido" replace />} />
                
                {/* Redirects Logística */}
                <Route path="/dashboard/entregas" element={<Navigate to="/dashboard/logistica/entregas" replace />} />
                <Route path="/dashboard/frota" element={<Navigate to="/dashboard/logistica/frota" replace />} />
                <Route path="/dashboard/instalacoes/frota" element={<Navigate to="/dashboard/logistica/frota" replace />} />
                <Route path="/dashboard/instalacoes/frota/novo" element={<Navigate to="/dashboard/logistica/frota/novo" replace />} />
                <Route path="/dashboard/instalacoes/frota/:id/editar" element={<Navigate to="/dashboard/logistica/frota/:id/editar" replace />} />
                <Route path="/dashboard/instalacoes/frota/conferencia" element={<Navigate to="/dashboard/logistica/frota/conferencia" replace />} />
                <Route path="/dashboard/instalacoes/frota/:id/conferencias" element={<Navigate to="/dashboard/logistica/frota/:id/conferencias" replace />} />
                
                {/* Redirects Instalações */}
                <Route path="/dashboard/instalacoes/cronograma" element={<Navigate to="/dashboard/instalacoes/cronograma-instalacoes" replace />} />
                
                {/* Redirects Administrativo - Compras */}
                <Route path="/dashboard/compras/fornecedores" element={<Navigate to="/dashboard/administrativo/compras/fornecedores" replace />} />
                <Route path="/dashboard/compras/requisicoes-compra" element={<Navigate to="/dashboard/administrativo/compras/requisicoes-compra" replace />} />
                <Route path="/dashboard/compras/estoque" element={<Navigate to="/dashboard/administrativo/compras/estoque" replace />} />
                <Route path="/dashboard/compras/estoque/editar/:id" element={<Navigate to="/dashboard/administrativo/compras/estoque/editar/:id" replace />} />
                <Route path="/dashboard/estoque" element={<Navigate to="/dashboard/administrativo/compras/estoque" replace />} />
                <Route path="/dashboard/estoque/editar/:id" element={<Navigate to="/dashboard/administrativo/compras/estoque/editar/:id" replace />} />
                <Route path="/dashboard/fornecedores" element={<Navigate to="/dashboard/administrativo/compras/fornecedores" replace />} />
                
                {/* Redirects Administrativo - Financeiro */}
                <Route path="/dashboard/faturamento" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento" replace />} />
                <Route path="/dashboard/faturamento/:id/editar" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento/:id/editar" replace />} />
                <Route path="/dashboard/financeiro/faturamento" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento" replace />} />
                <Route path="/dashboard/financeiro/faturamento/:id/editar" element={<Navigate to="/dashboard/administrativo/financeiro/faturamento/:id/editar" replace />} />
                <Route path="/dashboard/financeiro/dre" element={<Navigate to="/dashboard/administrativo/financeiro/dre" replace />} />
                <Route path="/dashboard/financeiro/despesas" element={<Navigate to="/dashboard/administrativo/financeiro/despesas" replace />} />
                <Route path="/dashboard/dre" element={<Navigate to="/dashboard/administrativo/financeiro/dre" replace />} />
                <Route path="/dashboard/despesas" element={<Navigate to="/dashboard/administrativo/financeiro/despesas" replace />} />
                <Route path="/dashboard/financeiro/investimentos" element={<Navigate to="/dashboard/marketing/investimentos" replace />} />
                <Route path="/dashboard/investimentos" element={<Navigate to="/dashboard/marketing/investimentos" replace />} />

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