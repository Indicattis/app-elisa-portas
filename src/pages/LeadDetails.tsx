import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Play, Pause, X, DollarSign } from "lucide-react";
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
  altura_porta: string | null;
  largura_porta: string | null;
  cor_porta: string | null;
  mensagem: string | null;
  observacoes: string | null;
  data_inicio_atendimento: string | null;
  data_conclusao_atendimento: string | null;
  data_prevista_entrega: string | null;
  funcao_lead: string | null;
}

interface Atendente {
  nome: string;
}

const statusLabels = {
  1: { label: "Aguardando", color: "bg-orange-100 text-orange-800" },
  2: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
  3: { label: "Pausado", color: "bg-yellow-100 text-yellow-800" },
  4: { label: "Concluído", color: "bg-green-100 text-green-800" },
  5: { label: "Vendido", color: "bg-purple-100 text-purple-800" },
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [atendente, setAtendente] = useState<Atendente | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data: leadData, error: leadError } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .eq("id", id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // Buscar dados do atendente se houver
      if (leadData.atendente_id) {
        const { data: atendenteData, error: atendenteError } = await supabase
          .from("admin_users")
          .select("nome")
          .eq("user_id", leadData.atendente_id)
          .single();

        if (!atendenteError && atendenteData) {
          setAtendente(atendenteData);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar detalhes do lead",
      });
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => {
    if (!lead) return false;
    return isAdmin || lead.atendente_id === user?.id || lead.atendente_id === null;
  };

  const handleIniciarAtendimento = async () => {
    if (!id || actionLoading) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('iniciar_atendimento', { 
        lead_uuid: id 
      });

      if (error) throw error;
      if (!data) {
        throw new Error("Não foi possível iniciar o atendimento");
      }

      toast({
        title: "Sucesso",
        description: "Atendimento iniciado com sucesso",
      });
      
      fetchLead(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao iniciar atendimento",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePausarAtendimento = async () => {
    if (!id || actionLoading) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('pause_lead_attendance', { 
        lead_uuid: id 
      });

      if (error) throw error;
      if (!data) {
        throw new Error("Não foi possível pausar o atendimento");
      }

      toast({
        title: "Sucesso",
        description: "Atendimento pausado com sucesso",
      });
      
      fetchLead(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao pausar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao pausar atendimento",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelarAtendimento = async () => {
    if (!id || actionLoading) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_lead_attendance', { 
        lead_uuid: id 
      });

      if (error) throw error;
      if (!data) {
        throw new Error("Não foi possível cancelar o atendimento");
      }

      toast({
        title: "Sucesso",
        description: "Atendimento cancelado com sucesso",
      });
      
      fetchLead(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao cancelar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cancelar atendimento",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVendido = () => {
    navigate(`/dashboard/leads/${id}/venda`);
  };

  const renderActionButtons = () => {
    if (!lead || actionLoading) return null;

    const isAtendente = lead.atendente_id === user?.id;
    
    // Lead aguardando atendimento (status 1)
    if (lead.status_atendimento === 1) {
      return (
        <Button onClick={handleIniciarAtendimento} disabled={actionLoading}>
          <Play className="w-4 h-4 mr-2" />
          Iniciar Atendimento
        </Button>
      );
    }

    // Lead em andamento (status 2) - só o atendente responsável pode ações
    if (lead.status_atendimento === 2 && (isAdmin || isAtendente)) {
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePausarAtendimento} disabled={actionLoading}>
            <Pause className="w-4 h-4 mr-2" />
            Pausar
          </Button>
          <Button variant="outline" onClick={handleCancelarAtendimento} disabled={actionLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleVendido} disabled={actionLoading}>
            <DollarSign className="w-4 h-4 mr-2" />
            Vendido
          </Button>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/leads">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Lead não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/leads">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalhes do Lead</h1>
            <p className="text-muted-foreground">{lead.nome}</p>
          </div>
        </div>
        {canEdit() && (
          <Button asChild>
            <Link to={`/dashboard/leads/${lead.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      {/* Seção de Ações */}
      {renderActionButtons() && (
        <Card>
          <CardHeader>
            <CardTitle>Ações do Lead</CardTitle>
            <CardDescription>
              Ações disponíveis para este lead
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderActionButtons()}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="text-sm">{lead.nome}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{lead.email || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
              <p className="text-sm">{lead.telefone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cidade</label>
              <p className="text-sm">{lead.cidade || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Função</label>
              <p className="text-sm">{lead.funcao_lead || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge
                  variant="secondary"
                  className={statusLabels[lead.status_atendimento as keyof typeof statusLabels]?.color}
                >
                  {statusLabels[lead.status_atendimento as keyof typeof statusLabels]?.label}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Atendente Responsável</label>
              <p className="text-sm">{atendente?.nome || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Envio</label>
              <p className="text-sm">
                {format(new Date(lead.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            {lead.data_inicio_atendimento && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Início do Atendimento</label>
                <p className="text-sm">
                  {format(new Date(lead.data_inicio_atendimento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
            {lead.data_conclusao_atendimento && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Conclusão do Atendimento</label>
                <p className="text-sm">
                  {format(new Date(lead.data_conclusao_atendimento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Porta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo de Porta</label>
              <p className="text-sm">{lead.tipo_porta || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Altura</label>
              <p className="text-sm">{lead.altura_porta || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Largura</label>
              <p className="text-sm">{lead.largura_porta || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cor</label>
              <p className="text-sm">{lead.cor_porta || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor do Orçamento</label>
              <p className="text-sm">
                {lead.valor_orcamento
                  ? `R$ ${lead.valor_orcamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "-"}
              </p>
            </div>
            {lead.data_prevista_entrega && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Prevista de Entrega</label>
                <p className="text-sm">
                  {format(new Date(lead.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mensagem Inicial</label>
              <p className="text-sm whitespace-pre-wrap">{lead.mensagem || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Observações do Atendimento</label>
              <p className="text-sm whitespace-pre-wrap">{lead.observacoes || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}