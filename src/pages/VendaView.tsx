
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, MapPin, Calendar, DollarSign, FileText, History } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
}

interface Orcamento {
  id: string;
  valor_produto: number;
  valor_pintura: number;
  valor_frete: number;
  valor_instalacao: number;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  desconto_percentual: number;
  created_at: string;
  data_aprovacao: string | null;
}

interface HistoricoItem {
  id: string;
  acao: string;
  created_at: string;
  observacoes: string | null;
  atendente_nome: string;
}

export default function VendaView() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<Tables<"vendas"> | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVendaDetails();
    }
  }, [id]);

  const fetchVendaDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);

      // Buscar dados da venda
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();

      if (vendaError) throw vendaError;
      setVenda(vendaData);

      // Vendas table doesn't have lead_id, so skip lead/orcamento/historico lookups
    } catch (error) {
      console.error("Erro ao buscar detalhes da venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar detalhes da venda",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pendente': { label: 'Pendente', variant: 'secondary' as const },
      'aprovado': { label: 'Aprovado', variant: 'default' as const },
      'rejeitado': { label: 'Rejeitado', variant: 'destructive' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando detalhes da venda...</p>
        </div>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="text-center py-8">
        <p>Venda não encontrada</p>
        <Button onClick={() => navigate("/dashboard/faturamento")} className="mt-4">
          Voltar para Faturamento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/dashboard/faturamento")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Detalhes da Venda</h1>
          <p className="text-muted-foreground">Visualizar informações completas da venda</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => navigate(`/dashboard/vendas/${id}/editar`)}
          >
            Editar Venda
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Venda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Informações da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor da Venda</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(venda.valor_venda)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data da Venda</p>
                <p className="font-medium">{formatDate(venda.data_venda)}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Canal de Aquisição</p>
                <p className="font-medium">{venda.canal_aquisicao_id || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium">{venda.forma_pagamento || "Não informado"}</p>
              </div>
            </div>

            {(venda.estado || venda.cidade || venda.bairro || venda.cep) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Endereço
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {venda.estado && <p><strong>Estado:</strong> {venda.estado}</p>}
                    {venda.cidade && <p><strong>Cidade:</strong> {venda.cidade}</p>}
                    {venda.bairro && <p><strong>Bairro:</strong> {venda.bairro}</p>}
                    {venda.cep && <p><strong>CEP:</strong> {venda.cep}</p>}
                  </div>
                </div>
              </>
            )}

            {venda.observacoes_venda && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Observações
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-md">{venda.observacoes_venda}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informações do Lead */}
        {lead && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{lead.nome}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{lead.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="font-medium">{lead.telefone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                <p className="font-medium">{lead.cidade}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Orçamentos */}
      {orcamentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos Relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orcamentos.map((orcamento) => (
                <div key={orcamento.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Orçamento</span>
                      {getStatusBadge(orcamento.status)}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(orcamento.valor_total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(orcamento.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Produto</p>
                      <p className="font-medium">{formatCurrency(orcamento.valor_produto)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pintura</p>
                      <p className="font-medium">{formatCurrency(orcamento.valor_pintura)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frete</p>
                      <p className="font-medium">{formatCurrency(orcamento.valor_frete)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Instalação</p>
                      <p className="font-medium">{formatCurrency(orcamento.valor_instalacao)}</p>
                    </div>
                  </div>
                  
                  {orcamento.desconto_percentual > 0 && (
                    <p className="text-sm text-orange-600 mt-2">
                      Desconto aplicado: {orcamento.desconto_percentual}%
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-muted-foreground">
                      Forma de Pagamento: {orcamento.forma_pagamento}
                    </span>
                    {orcamento.data_aprovacao && (
                      <span className="text-muted-foreground">
                        Aprovado em: {formatDate(orcamento.data_aprovacao)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historico.map((item) => (
                <div key={item.id} className="flex items-start gap-4 border-l-2 border-muted pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {item.acao.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        por {item.atendente_nome}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDate(item.created_at)}
                    </p>
                    {item.observacoes && (
                      <p className="text-sm bg-muted p-2 rounded-md">
                        {item.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
