import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, MessageCircle, Pause, Play, X, DollarSign } from "lucide-react";
import { format, isToday } from "date-fns";
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
  data_inicio_atendimento: string | null;
  data_prevista_entrega: string | null;
  mensagem: string | null;
  observacoes: string | null;
}

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

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error) {
      console.error("Erro ao buscar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lead",
      });
      navigate("/dashboard/leads");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttendance = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase.rpc("iniciar_atendimento", {
        lead_uuid: lead.id,
      });

      if (error) throw error;

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Atendimento iniciado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao iniciar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao iniciar atendimento",
      });
    }
  };

  const handlePauseAttendance = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase.rpc("pause_lead_attendance", {
        lead_uuid: lead.id,
      });

      if (error) throw error;

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Atendimento pausado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao pausar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao pausar atendimento",
      });
    }
  };

  const handleCancelAttendance = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase.rpc("cancel_lead_attendance", {
        lead_uuid: lead.id,
      });

      if (error) throw error;

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Atendimento cancelado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao cancelar atendimento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao cancelar atendimento",
      });
    }
  };

  const handleWhatsAppClick = (telefone: string, nome: string) => {
    const message = `Olá ${nome}, entramos em contato sobre seu interesse em portas. Como podemos ajudá-lo?`;
    const whatsappUrl = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const canManageLead = () => {
    return isAdmin || lead?.atendente_id === user?.id;
  };

  const canViewSalesButton = () => {
    return isAdmin || (lead?.atendente_id === user?.id && lead?.status_atendimento === 2);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lead não encontrado</h1>
          <p className="text-muted-foreground mb-4">
            O lead solicitado não foi encontrado.
          </p>
          <Button onClick={() => navigate("/dashboard/leads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Leads
          </Button>
        </div>
      </div>
    );
  }

  const status = getLeadStatus(lead);
  const statusInfo = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/leads")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-foreground">{lead.nome}</h1>
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full ${statusInfo.className}`}
                  title={statusInfo.label}
                />
                <span className="text-sm text-muted-foreground">{statusInfo.label}</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Lead enviado em {format(new Date(lead.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {canViewSalesButton() && (
            <Button
              onClick={() => navigate(`/dashboard/leads/${lead.id}/venda`)}
              className="bg-green-600 hover:bg-green-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Finalizar Venda
            </Button>
          )}

          {canManageLead() && lead.status_atendimento === 1 && (
            <Button onClick={handleStartAttendance}>
              <Play className="w-4 h-4 mr-2" />
              Iniciar Atendimento
            </Button>
          )}

          {canManageLead() && lead.status_atendimento === 2 && (
            <>
              <Button
                variant="outline"
                onClick={handlePauseAttendance}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelAttendance}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}

          {canManageLead() && (
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/leads/${lead.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => handleWhatsAppClick(lead.telefone, lead.nome)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Lead</CardTitle>
            <CardDescription>
              Detalhes sobre o lead
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Dados de Contato</h2>
              <p><strong>Nome:</strong> {lead.nome}</p>
              <p><strong>Email:</strong> {lead.email || "Não informado"}</p>
              <p><strong>Telefone:</strong> {lead.telefone}</p>
              <p><strong>Cidade:</strong> {lead.cidade || "Não informada"}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Detalhes da Porta</h2>
              <p><strong>Tipo:</strong> {lead.tipo_porta || "Não informado"}</p>
              <p><strong>Altura:</strong> {lead.altura_porta || "Não informada"}</p>
              <p><strong>Largura:</strong> {lead.largura_porta || "Não informada"}</p>
              <p><strong>Cor:</strong> {lead.cor_porta || "Não informada"}</p>
              <p><strong>Valor Estimado:</strong> {lead.valor_orcamento ? `R$ ${lead.valor_orcamento.toFixed(2)}` : "Não informado"}</p>
              <p><strong>Data Prevista:</strong> {lead.data_prevista_entrega ? format(new Date(lead.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR }) : "Não informada"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>
              Mensagem e observações do lead
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Mensagem</h2>
              <p>{lead.mensagem || "Nenhuma mensagem"}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Observações</h2>
              <p>{lead.observacoes || "Nenhuma observação"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
