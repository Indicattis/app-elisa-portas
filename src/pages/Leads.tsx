
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadIndicators } from "@/components/LeadIndicators";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Play, MessageCircle, Plus } from "lucide-react";
import { format, isToday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  status_atendimento: number;
  data_envio: string;
  atendente_id: string | null;
  valor_orcamento: number | null;
  tipo_porta: string | null;
  data_inicio_atendimento: string | null;
  canal_aquisicao: string;
}

interface FilterValues {
  search: string;
  status: string;
  atendente: string;
  cidade: string;
  dataInicio: string;
  dataFim: string;
}

const LEADS_PER_PAGE = 22;

// Função para calcular o status atual do lead
const getLeadStatus = (lead: Lead) => {
  const dataEnvio = new Date(lead.data_envio);
  const isFromToday = isToday(dataEnvio);
  
  switch (lead.status_atendimento) {
    case 1:
      // Se é do dia atual, é "novo", senão é "aguardando"
      return isFromToday ? "novo" : "aguardando";
    case 2:
      return "em_andamento";
    case 3:
      return "pausado";
    case 5:
      return "vendido";
    case 6:
      return "cancelado";
    default:
      return "aguardando";
  }
};

const statusConfig = {
  novo: { label: "Novo", className: "bg-blue-500" },
  aguardando: { label: "Aguardando", className: "bg-gray-500" },
  em_andamento: { label: "Em Andamento", className: "bg-green-500" },
  pausado: { label: "Pausado", className: "bg-yellow-500" },
  vendido: { label: "Vendido", className: "bg-green-600" },
  cancelado: { label: "Cancelado", className: "bg-red-500" },
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [atendentes, setAtendentes] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    status: "",
    atendente: "",
    cidade: "",
    dataInicio: "",
    dataFim: "",
  });
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .order("data_envio", { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set(data?.filter(lead => lead.atendente_id).map(lead => lead.atendente_id))];
      if (atendenteIds.length > 0) {
        const { data: atendenteData, error: atendenteError } = await supabase
          .from("admin_users")
          .select("user_id, nome")
          .in("user_id", atendenteIds);

        if (!atendenteError && atendenteData) {
          const atendenteMap = new Map();
          atendenteData.forEach((atendente: any) => {
            atendenteMap.set(atendente.user_id, atendente.nome);
          });
          setAtendentes(atendenteMap);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar leads",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttendance = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({
          status_atendimento: 2,
          atendente_id: user?.id,
          data_inicio_atendimento: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("lead_atendimento_historico").insert({
        lead_id: leadId,
        atendente_id: user?.id,
        acao: "iniciou_atendimento",
        status_anterior: 1,
        status_novo: 2,
      });

      fetchLeads();
      toast({
        title: "Sucesso",
        description: "Atendimento iniciado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao iniciar atendimento",
      });
    }
  };

  const handleWhatsAppClick = (telefone: string, nome: string) => {
    const message = `Olá ${nome}, entramos em contato sobre seu interesse em portas. Como podemos ajudá-lo?`;
    const whatsappUrl = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRowDoubleClick = (leadId: string) => {
    navigate(`/dashboard/leads/${leadId}`);
  };

  // Aplicar filtros
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = !filters.search || (
      lead.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.telefone.includes(filters.search) ||
      lead.cidade?.toLowerCase().includes(filters.search.toLowerCase())
    );

    const leadStatus = getLeadStatus(lead);
    const matchesStatus = !filters.status || leadStatus === filters.status;

    const matchesAtendente = !filters.atendente || (
      filters.atendente === "sem_atendente" 
        ? !lead.atendente_id 
        : lead.atendente_id === filters.atendente
    );

    const matchesCidade = !filters.cidade || lead.cidade === filters.cidade;

    const leadDate = new Date(lead.data_envio);
    const matchesDataInicio = !filters.dataInicio || leadDate >= new Date(filters.dataInicio);
    const matchesDataFim = !filters.dataFim || leadDate <= new Date(filters.dataFim + "T23:59:59");

    // Por padrão, não exibir leads vendidos (status 5) e cancelados (status 6) a menos que seja filtrado especificamente
    const shouldHideVendidos = !filters.status && lead.status_atendimento === 5;
    const shouldHideCancelados = !filters.status && lead.status_atendimento === 6;

    return matchesSearch && matchesStatus && matchesAtendente && matchesCidade && matchesDataInicio && matchesDataFim && !shouldHideVendidos && !shouldHideCancelados;
  });

  const canManageLead = (lead: Lead) => {
    return isAdmin || lead.atendente_id === user?.id || lead.atendente_id === null;
  };

  const getTempoAtendimento = (dataInicio: string) => {
    const inicio = new Date(dataInicio);
    const agora = new Date();
    const diffMs = agora.getTime() - inicio.getTime();
    
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);
    const diffSemanas = Math.floor(diffDias / 7);

    if (diffSemanas > 0) {
      const diasRestantes = diffDias % 7;
      return diasRestantes > 0 ? `${diffSemanas}sem ${diasRestantes}d` : `${diffSemanas}sem`;
    }
    
    if (diffDias > 0) {
      const horasRestantes = diffHoras % 24;
      return horasRestantes > 0 ? `${diffDias}d ${horasRestantes}h` : `${diffDias}d`;
    }
    
    if (diffHoras > 0) {
      const minutosRestantes = diffMinutos % 60;
      return minutosRestantes > 0 ? `${diffHoras}h ${minutosRestantes}m` : `${diffHoras}h`;
    }
    
    return `${diffMinutos}m`;
  };

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Obter cidades únicas para o filtro
  const uniqueCidades = [...new Set(leads.map(lead => lead.cidade).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Gerencie todos os leads do sistema</p>
        </div>
        <Button onClick={() => navigate("/dashboard/vendas/nova")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      <LeadIndicators />

      <LeadFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        atendentes={atendentes}
        cidades={uniqueCidades}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            {filteredLeads.length} leads encontrados | Página {currentPage} de {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => {
                  const status = getLeadStatus(lead);
                  const statusInfo = statusConfig[status as keyof typeof statusConfig];
                  
                  return (
                    <TableRow 
                      key={lead.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onDoubleClick={() => handleRowDoubleClick(lead.id)}
                    >
                       <TableCell>
                         <div 
                           className={`w-3 h-3 rounded-full ${statusInfo.className}`}
                           title={statusInfo.label}
                         />
                       </TableCell>
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{lead.email}</div>
                          <div className="text-sm text-muted-foreground">{lead.telefone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lead.cidade}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.canal_aquisicao}</Badge>
                      </TableCell>
                      <TableCell>
                        {lead.atendente_id ? atendentes.get(lead.atendente_id) || "-" : "-"}
                      </TableCell>
                      <TableCell>
                        {lead.status_atendimento === 2 && lead.data_inicio_atendimento
                          ? getTempoAtendimento(lead.data_inicio_atendimento)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(lead.data_envio), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {lead.valor_orcamento
                          ? `R$ ${lead.valor_orcamento.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsAppClick(lead.telefone, lead.nome);
                            }}
                            title="Iniciar conversa no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/vendas/nova?lead=${lead.id}`);
                            }}
                            title="Adicionar venda"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          
                          {canManageLead(lead) && lead.status_atendimento === 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartAttendance(lead.id);
                              }}
                              title="Iniciar atendimento"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
