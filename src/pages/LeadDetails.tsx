import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Edit, 
  MessageCircle, 
  Play, 
  X, 
  DollarSign, 
  Trash2, 
  CheckCircle, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  AlertTriangle,
  Calculator,
  Home,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadComments } from "@/components/LeadComments";
import { LeadLossModal } from "@/components/LeadLossModal";
import { LeadTagSelector } from "@/components/LeadTagSelector";
import { STATUS_CONFIG, getLeadTag, canEditTag } from "@/utils/newLeadSystem";
import type { LeadStatus, MotivoPerda } from "@/utils/newLeadSystem";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  status_atendimento: number;
  novo_status: LeadStatus;
  tag_id: number | null;
  motivo_perda: MotivoPerda | null;
  observacoes_perda: string | null;
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
  canal_aquisicao: string;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;  
  endereco_cep: string | null;
  endereco_cidade_completa: string | null;
  endereco_estado: string | null;
  endereco_complemento: string | null;
}

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [attendantName, setAttendantName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [hasActiveVisit, setHasActiveVisit] = useState(false);
  const { isAdmin, isGerenteComercial, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchOrcamentos();
      checkActiveVisits();
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

      // Buscar nome do atendente se houver
      if (data.atendente_id) {
        const { data: attendantData, error: attendantError } = await supabase
          .from("admin_users")
          .select("nome")
          .eq("user_id", data.atendente_id)
          .single();

        if (!attendantError && attendantData) {
          setAttendantName(attendantData.nome);
        }
      }
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

  const fetchOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
    }
  };

  const checkActiveVisits = async () => {
    try {
      const { data, error } = await supabase
        .from("visitas_tecnicas")
        .select("id")
        .eq("lead_id", id)
        .eq("status", "agendada")
        .limit(1);

      if (error) throw error;
      setHasActiveVisit(data && data.length > 0);
    } catch (error) {
      console.error("Erro ao verificar visitas:", error);
    }
  };

  const handleStartAttendance = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ 
          novo_status: 'em_andamento',
          atendente_id: user?.id,
          data_inicio_atendimento: new Date().toISOString()
        })
        .eq("id", lead.id);

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

  const handleMarkAsLost = async (data: { motivo_perda: MotivoPerda; observacoes_perda?: string }) => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ 
          novo_status: 'perdido',
          motivo_perda: data.motivo_perda,
          observacoes_perda: data.observacoes_perda || null
        })
        .eq("id", lead.id);

      if (error) throw error;

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Lead marcado como perdido",
      });
    } catch (error: any) {
      console.error("Erro ao marcar como perdido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao marcar lead como perdido",
      });
    }
  };

  const handleInitiateSale = async () => {
    if (!lead) return;

    try {
      // Verificar se há orçamento aprovado
      const approvedBudgets = orcamentos.filter(o => o.status === 'aprovado');
      if (approvedBudgets.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro", 
          description: "É necessário ter um orçamento aprovado antes de iniciar uma venda",
        });
        return;
      }

      // Criar requisição de venda usando a função do Supabase
      const { data: requisicaoId, error: requisicaoError } = await supabase
        .rpc('criar_requisicao_venda', {
          lead_uuid: lead.id,
          orcamento_uuid: approvedBudgets[0].id
        });

      if (requisicaoError) throw requisicaoError;

      // Atualizar status do lead para aguardando aprovação de venda (status 4)
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ novo_status: 'aguardando_aprovacao_venda' })
        .eq("id", lead.id);

      if (error) throw error;

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Requisição de venda enviada para aprovação",
      });
    } catch (error: any) {
      console.error("Erro ao iniciar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao iniciar processo de venda",
      });
    }
  };

  const handleResumeAttendance = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ 
          novo_status: 'em_andamento',
          atendente_id: user?.id,
          data_inicio_atendimento: new Date().toISOString(),
          motivo_perda: null,
          observacoes_perda: null
        })
        .eq("id", lead.id);

      if (error) throw error;

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Atendimento retomado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao retomar atendimento:", error);
      toast({
        variant: "destructive", 
        title: "Erro",
        description: error.message || "Erro ao retomar atendimento",
      });
    }
  };

  const handleStopAttendance = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ 
          novo_status: 'aguardando_atendimento',
          atendente_id: null,
          data_inicio_atendimento: null
        })
        .eq("id", lead.id);

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

  const handleTagChange = async (tagId: number | null) => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ tag_id: tagId })
        .eq("id", lead.id);

      if (error) throw error;

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Etiqueta alterada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao alterar etiqueta:", error);
      toast({
        variant: "destructive",
        title: "Erro", 
        description: error.message || "Erro ao alterar etiqueta",
      });
    }
  };

  const handleWhatsAppClick = (telefone: string, nome: string) => {
    const message = `Olá ${nome}, entramos em contato sobre seu interesse em portas. Como podemos ajudá-lo?`;
    const whatsappUrl = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDeleteLead = async () => {
    if (!lead || !window.confirm('Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .delete()
        .eq("id", lead.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lead excluído com sucesso",
      });
      navigate("/dashboard/leads");
    } catch (error) {
      console.error("Erro ao excluir lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir lead",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="text-green-600 border-green-600">Aprovado</Badge>;
      case 'reprovado':
        return <Badge variant="outline" className="text-red-600 border-red-600">Reprovado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Verificar permissões baseadas no novo status
  const canStartAttendance = () => lead?.novo_status === 'aguardando_atendimento';
  const canManageInProgress = () => lead?.novo_status === 'em_andamento' && lead?.atendente_id === user?.id;
  const canResumeAttendance = () => isAdmin && ['perdido', 'venda_reprovada'].includes(lead?.novo_status || '');
  const canStopAttendance = () => lead?.novo_status === 'em_andamento' && lead?.atendente_id === user?.id;
  const hasApprovedBudget = () => orcamentos.some(o => o.status === 'aprovado');

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

  const statusInfo = STATUS_CONFIG[lead.novo_status];
  const currentTag = getLeadTag(lead.tag_id);

  return (
    <div className="space-y-8">
      {/* Header com navegação */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/leads", { state: { focusLeadId: lead.id } })}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Botões baseados no status */}
          <div className="flex flex-wrap gap-2">
            {/* Status 1: Aguardando atendimento */}
            {canStartAttendance() && (
              <>
                <Button 
                  onClick={handleStartAttendance}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Atendimento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleWhatsAppClick(lead.telefone, lead.nome)}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </>
            )}

            {/* Status 2: Em andamento */}
            {canManageInProgress() && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowLossModal(true)}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Perdido
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/orcamentos/novo?leadId=${lead.id}`)}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Criar Orçamento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!lead.endereco_rua || !lead.endereco_numero || !lead.endereco_bairro || !lead.endereco_cep) {
                      toast({
                        title: "Endereço incompleto",
                        description: "É necessário preencher o endereço completo do lead antes de criar uma visita técnica",
                        variant: "destructive",
                      });
                      return;
                    }
                    navigate(`/dashboard/visitas/nova/${lead.id}`);
                  }}
                  className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Criar Visita Técnica
                </Button>
                {hasApprovedBudget() && (
                  <Button
                    onClick={handleInitiateSale}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Iniciar Venda
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleStopAttendance}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Parar Atendimento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleWhatsAppClick(lead.telefone, lead.nome)}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </>
            )}

            {/* Status 3, 5: Perdido/Venda reprovada - apenas admin pode retomar */}
            {canResumeAttendance() && (
              <Button
                variant="outline"
                onClick={handleResumeAttendance}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retomar Atendimento
              </Button>
            )}

            {/* Botões administrativos */}
            {(isAdmin || isGerenteComercial) && (
              <>
                {lead.novo_status !== 'venda_aprovada' && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/dashboard/leads/${lead.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleDeleteLead}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Informações principais */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-primary/5 border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{lead.nome}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Enviado em {format(new Date(lead.data_envio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                {attendantName && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Atendente: <strong>{attendantName}</strong></span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right space-y-2">
              <div>
                <Badge 
                  className={`${statusInfo.className} text-white px-4 py-2`}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              {currentTag && (
                <div>
                  <Badge 
                    className={`${currentTag.color} cursor-pointer`}
                    onClick={() => canEditTag(lead.novo_status) && setShowTagSelector(true)}
                  >
                    {currentTag.name}
                  </Badge>
                </div>
              )}
              {!currentTag && canEditTag(lead.novo_status) && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTagSelector(true)}
                  >
                    Adicionar Etiqueta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Informações de Contato */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informações de Contato
            </h2>
            <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground block">Telefone</span>
                  <span className="font-medium">{lead.telefone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground block">Email</span>
                  <span className="font-medium">{lead.email || "Não informado"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground block">Cidade</span>
                  <span className="font-medium">{lead.cidade || "Não informada"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Especificações do Produto */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Especificações da Porta
            </h2>
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground block">Tipo</span>
                  <span className="font-medium">{lead.tipo_porta || "Não especificado"}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">Altura</span>
                  <span className="font-medium">{lead.altura_porta || "Não especificada"}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">Largura</span>
                  <span className="font-medium">{lead.largura_porta || "Não especificada"}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground block">Cor</span>
                  <span className="font-medium">{lead.cor_porta || "Não especificada"}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">Valor Estimado</span>
                  <span className="font-medium text-green-600">
                    {lead.valor_orcamento ? `R$ ${lead.valor_orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Não informado"}
                  </span>
                </div>
              </div>
              {lead.data_prevista_entrega && (
                <div>
                  <span className="text-sm text-muted-foreground block">Data Prevista de Entrega</span>
                  <span className="font-medium">{format(new Date(lead.data_prevista_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}
            </div>
          </section>

          {/* Orçamentos */}
          {orcamentos.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Orçamentos
              </h2>
              <div className="space-y-4">
                {orcamentos.map((orcamento) => (
                  <div key={orcamento.id} className="bg-muted/30 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-sm text-muted-foreground block">
                          Criado em {format(new Date(orcamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="font-medium text-lg">
                          R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {getStatusBadge(orcamento.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Produto</span>
                        <span className="font-medium">R$ {orcamento.valor_produto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Pintura</span>
                        <span className="font-medium">R$ {orcamento.valor_pintura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Frete</span>
                        <span className="font-medium">R$ {orcamento.valor_frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Instalação</span>
                        <span className="font-medium">R$ {orcamento.valor_instalacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-muted">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Pagamento: </span>
                        <span className="font-medium">{orcamento.forma_pagamento}</span>
                        {orcamento.desconto_percentual > 0 && (
                          <span className="text-red-600 ml-2">
                            (Desconto: {orcamento.desconto_percentual}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mensagem Original */}
          {lead.mensagem && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Mensagem Original
              </h2>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-foreground whitespace-pre-wrap italic">"{lead.mensagem}"</p>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Comentários */}
      <LeadComments leadId={lead.id} />

      {/* Modais */}
      <LeadLossModal
        open={showLossModal}
        onOpenChange={setShowLossModal}
        onConfirm={handleMarkAsLost}
        leadName={lead.nome}
      />

      <LeadTagSelector
        open={showTagSelector}
        onOpenChange={setShowTagSelector}
        currentTagId={lead.tag_id}
        leadStatus={lead.novo_status}
        onTagChange={handleTagChange}
        leadName={lead.nome}
      />
    </div>
  );
}
