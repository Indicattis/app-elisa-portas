import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Play, Pause, X, Search } from "lucide-react";
import { format } from "date-fns";
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
}

interface Atendente {
  user_id: string;
  nome: string;
}

const statusLabels = {
  1: { label: "Aguardando", color: "bg-orange-100 text-orange-800" },
  2: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
  3: { label: "Pausado", color: "bg-yellow-100 text-yellow-800" },
  4: { label: "Concluído", color: "bg-green-100 text-green-800" },
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [atendentes, setAtendentes] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

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

  const handlePauseAttendance = async (leadId: string) => {
    try {
      const { data, error } = await supabase.rpc("pause_lead_attendance", {
        lead_uuid: leadId,
      });

      if (error) throw error;

      if (data) {
        fetchLeads();
        toast({
          title: "Sucesso",
          description: "Atendimento pausado com sucesso",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível pausar o atendimento",
        });
      }
    } catch (error) {
      console.error("Erro ao pausar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao pausar atendimento",
      });
    }
  };

  const handleCancelAttendance = async (leadId: string) => {
    try {
      const { data, error } = await supabase.rpc("cancel_lead_attendance", {
        lead_uuid: leadId,
      });

      if (error) throw error;

      if (data) {
        fetchLeads();
        toast({
          title: "Sucesso",
          description: "Atendimento cancelado com sucesso",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível cancelar o atendimento",
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cancelar atendimento",
      });
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm) ||
      lead.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageLead = (lead: Lead) => {
    return isAdmin || lead.atendente_id === user?.id || lead.atendente_id === null;
  };

  const getTempoAtendimento = (dataInicio: string) => {
    const inicio = new Date(dataInicio);
    const agora = new Date();
    const diffMs = agora.getTime() - inicio.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMinutos / 60);
    const minutosRestantes = diffMinutos % 60;

    if (diffHoras > 0) {
      return `${diffHoras}h ${minutosRestantes}m`;
    }
    return `${diffMinutos}m`;
  };

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            {filteredLeads.length} leads encontrados
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{lead.email}</div>
                        <div className="text-sm text-muted-foreground">{lead.telefone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.cidade}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusLabels[lead.status_atendimento as keyof typeof statusLabels]?.color}
                      >
                        {statusLabels[lead.status_atendimento as keyof typeof statusLabels]?.label}
                      </Badge>
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
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/dashboard/leads/${lead.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        
                        {canManageLead(lead) && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/dashboard/leads/${lead.id}/edit`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                            
                            {lead.status_atendimento === 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartAttendance(lead.id)}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {lead.status_atendimento === 2 && lead.atendente_id === user?.id && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePauseAttendance(lead.id)}
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelAttendance(lead.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}