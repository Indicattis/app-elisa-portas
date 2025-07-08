import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, MessageCircle, Pause, Play, X, DollarSign, Trash2, CheckCircle, User, Calendar, MapPin, Phone, Mail, Package } from "lucide-react";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadComments } from "@/components/LeadComments";
import { LeadTagManager } from "@/components/LeadTags";
import { getLeadStatus, statusConfig } from "@/utils/leadStatus";

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
  canal_aquisicao: string;
}

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [leadTag, setLeadTag] = useState<string | null>(null);
  const [attendantName, setAttendantName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { isAdmin, isGerenteComercial, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchOrcamentos();
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

      // Extrair etiqueta das observações (apenas uma)
      if (data.observacoes) {
        try {
          const parsed = JSON.parse(data.observacoes);
          setLeadTag(parsed.tags?.[0] || null);
        } catch {
          setLeadTag(null);
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

  const handleTagUpdate = (newTag: string | null) => {
    setLeadTag(newTag);
    // Atualizar o lead local também
    if (lead) {
      setLead({
        ...lead,
        observacoes: JSON.stringify({ tags: newTag ? [newTag] : [] })
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
        description: "Lead capturado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao capturar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao capturar lead",
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

  const handleMarkAsSold = async () => {
    if (!lead) return;

    try {
      // Verificar se pode marcar como vendido
      const { data: canSell, error: checkError } = await supabase.rpc("pode_marcar_venda", {
        lead_uuid: lead.id
      });

      if (checkError) throw checkError;

      if (!canSell) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não é possível marcar como vendido. Verifique se há orçamento aprovado e nenhuma requisição pendente.",
        });
        return;
      }

      // Verificar se existe orçamento aprovado para este lead
      const { data: orcamentos } = await supabase
        .from("orcamentos")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("status", "aprovado")
        .limit(1);

      const orcamentoId = orcamentos && orcamentos.length > 0 ? orcamentos[0].id : null;

      // Criar requisição de venda
      const { error } = await supabase.rpc("criar_requisicao_venda", {
        lead_uuid: lead.id,
        orcamento_uuid: orcamentoId
      });

      if (error) throw error;

      // Atualizar status do lead para "aguardando aprovação"
      await supabase
        .from("elisaportas_leads")
        .update({ status_atendimento: 4 }) // 4 = aguardando aprovação
        .eq("id", lead.id);

      fetchLead();
      toast({
        title: "Sucesso",
        description: "Requisição de venda criada com sucesso. Aguardando aprovação do gerente comercial.",
      });
    } catch (error: any) {
      console.error("Erro ao criar requisição de venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar requisição de venda",
      });
    }
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

  const canManageLead = () => {
    return isAdmin || lead?.atendente_id === user?.id;
  };

  const canEditTags = () => {
    if (!lead) return false;
    
    // Lead vendido não pode ser alterado
    if (lead.status_atendimento === 5) return false;
    
    // Se não tem atendente, qualquer usuário pode alterar
    if (!lead.atendente_id) return true;
    
    // Se tem atendente, apenas admin ou o próprio atendente pode alterar
    return isAdmin || lead.atendente_id === user?.id;
  };

  // Verificar se o lead está vendido (readonly)
  const isReadOnly = lead?.status_atendimento === 5;

  const canViewSalesButton = () => {
    return isAdmin || (lead?.atendente_id === user?.id && lead?.status_atendimento === 2);
  };

  const canDeleteLead = () => {
    return isAdmin || isGerenteComercial;
  };

  const canStartAttendance = () => {
    return lead?.status_atendimento === 1;
  };

  const canPauseAttendance = () => {
    return lead?.status_atendimento === 2 && (isAdmin || lead?.atendente_id === user?.id);
  };

  const canCancelAttendance = () => {
    return lead?.status_atendimento === 2 && (isAdmin || lead?.atendente_id === user?.id);
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
    <div className="space-y-8">
      {/* Header com navegação */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/leads")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Ações do Lead - desabilitadas se vendido */}
          {!isReadOnly && (
            <div className="flex flex-wrap gap-2">
              {canStartAttendance() && (
                <Button 
                  onClick={handleStartAttendance}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Capturar Lead
                </Button>
              )}

              {canPauseAttendance() && (
                <Button
                  variant="outline"
                  onClick={handlePauseAttendance}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              )}

              {canCancelAttendance() && (
                <Button
                  variant="outline"
                  onClick={handleCancelAttendance}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}

              {canViewSalesButton() && (
                <Button
                  onClick={handleMarkAsSold}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Vendido
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => handleWhatsAppClick(lead.telefone, lead.nome)}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>

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
                variant="destructive"
                onClick={handleDeleteLead}
                disabled={!canDeleteLead()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Informações principais em formato documento */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {/* Cabeçalho do documento */}
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
            <div className="text-right">
              <Badge 
                className={`${statusInfo.className} text-white px-4 py-2`}
              >
                {statusInfo.label}
              </Badge>
              {isReadOnly && (
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    VENDIDO - Somente Leitura
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Corpo do documento */}
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

      {/* Sistema de Etiquetas - desabilitado se vendido */}
      <LeadTagManager
        leadId={lead.id}
        currentTag={leadTag}
        onTagUpdate={handleTagUpdate}
        canEdit={canEditTags()}
      />

      {/* Comentários */}
      <LeadComments leadId={lead.id} />
    </div>
  );
}
