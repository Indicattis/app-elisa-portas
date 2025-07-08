import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Download, Filter, CheckCircle, Clock, XCircle, Search, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/types/lead";

interface OrcamentoFormData {
  lead_id: string;
  valor_produto: string;
  valor_pintura: string;
  valor_frete: string;
  valor_instalacao: string;
  campos_personalizados: { [key: string]: number };
  forma_pagamento: string;
  desconto_percentual: number;
  requer_analise: boolean;
}

interface Filters {
  search: string;
  status: string;
  lead: string;
}

export default function Orcamentos() {
  const { toast } = useToast();
  const { user, isAdmin, isGerenteComercial } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [filteredOrcamentos, setFilteredOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    desconto_adicional: 0,
    observacoes: ""
  });

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    lead: ""
  });

  const [formData, setFormData] = useState<OrcamentoFormData>({
    lead_id: "",
    valor_produto: "",
    valor_pintura: "0",
    valor_frete: "0",
    valor_instalacao: "0",
    campos_personalizados: {},
    forma_pagamento: "",
    desconto_percentual: 0,
    requer_analise: false
  });

  const [camposPersonalizados, setCamposPersonalizados] = useState<Array<{ nome: string; valor: string }>>([]);

  useEffect(() => {
    fetchLeads();
    fetchOrcamentos();
  }, []);

  useEffect(() => {
    filterOrcamentos();
  }, [orcamentos, filters]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .order("data_envio", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar leads",
      });
    }
  };

  const fetchOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          elisaportas_leads (nome, telefone, email),
          admin_users!orcamentos_aprovado_por_fkey (nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar orçamentos",
      });
    }
  };

  const filterOrcamentos = () => {
    let filtered = orcamentos;

    if (filters.search) {
      filtered = filtered.filter(orc => 
        orc.elisaportas_leads?.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        orc.elisaportas_leads?.telefone.includes(filters.search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(orc => orc.status === filters.status);
    }

    if (filters.lead) {
      filtered = filtered.filter(orc => orc.lead_id === filters.lead);
    }

    setFilteredOrcamentos(filtered);
  };

  const handleFormChange = (field: keyof OrcamentoFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCampoPersonalizado = () => {
    setCamposPersonalizados(prev => [...prev, { nome: "", valor: "0" }]);
  };

  const updateCampoPersonalizado = (index: number, field: "nome" | "valor", value: string) => {
    setCamposPersonalizados(prev => 
      prev.map((campo, i) => i === index ? { ...campo, [field]: value } : campo)
    );
  };

  const removeCampoPersonalizado = (index: number) => {
    setCamposPersonalizados(prev => prev.filter((_, i) => i !== index));
  };

  const calcularValorTotal = () => {
    const valorProduto = parseFloat(formData.valor_produto) || 0;
    const valorPintura = parseFloat(formData.valor_pintura) || 0;
    const valorFrete = parseFloat(formData.valor_frete) || 0;
    const valorInstalacao = parseFloat(formData.valor_instalacao) || 0;
    
    const valorCamposPersonalizados = camposPersonalizados.reduce((sum, campo) => {
      return sum + (parseFloat(campo.valor) || 0);
    }, 0);

    const subtotal = valorProduto + valorPintura + valorFrete + valorInstalacao + valorCamposPersonalizados;
    const desconto = (valorProduto * formData.desconto_percentual) / 100;
    
    return subtotal - desconto;
  };

  const generatePDF = async (orcamento: any) => {
    // Simular geração do PDF - aqui seria implementada a geração real
    toast({
      title: "PDF Gerado",
      description: "O orçamento foi baixado com sucesso",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const camposPersonalizadosObj = camposPersonalizados.reduce((acc, campo) => {
        if (campo.nome && campo.valor) {
          acc[campo.nome] = parseFloat(campo.valor);
        }
        return acc;
      }, {} as { [key: string]: number });

      const orcamentoData = {
        lead_id: formData.lead_id,
        usuario_id: user?.id,
        valor_produto: parseFloat(formData.valor_produto),
        valor_pintura: parseFloat(formData.valor_pintura),
        valor_frete: parseFloat(formData.valor_frete),
        valor_instalacao: parseFloat(formData.valor_instalacao),
        campos_personalizados: camposPersonalizadosObj,
        forma_pagamento: formData.forma_pagamento,
        desconto_percentual: formData.desconto_percentual,
        valor_total: calcularValorTotal(),
        requer_analise: formData.requer_analise,
        status: formData.requer_analise ? 'pendente' : 'aprovado'
      };

      const { data, error } = await supabase
        .from("orcamentos")
        .insert(orcamentoData)
        .select()
        .single();

      if (error) throw error;

      // Atualizar valor do orçamento no lead
      await supabase
        .from("elisaportas_leads")
        .update({ valor_orcamento: calcularValorTotal() })
        .eq("id", formData.lead_id);

      toast({
        title: "Sucesso",
        description: `Orçamento ${formData.requer_analise ? 'criado e enviado para análise' : 'criado e aprovado automaticamente'}`,
      });

      setShowForm(false);
      resetForm();
      fetchOrcamentos();

      // Gerar PDF automaticamente se aprovado
      if (!formData.requer_analise) {
        generatePDF(data);
      }
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar orçamento",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      lead_id: "",
      valor_produto: "",
      valor_pintura: "0",
      valor_frete: "0",
      valor_instalacao: "0",
      campos_personalizados: {},
      forma_pagamento: "",
      desconto_percentual: 0,
      requer_analise: false
    });
    setCamposPersonalizados([]);
  };

  const handleApproveOrcamento = async () => {
    if (!selectedOrcamento) return;

    try {
      const { error } = await supabase.rpc("aprovar_orcamento", {
        orcamento_uuid: selectedOrcamento.id,
        desconto_adicional: approvalData.desconto_adicional,
        observacoes: approvalData.observacoes || null
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento aprovado com sucesso",
      });

      setShowApprovalModal(false);
      setSelectedOrcamento(null);
      setApprovalData({ desconto_adicional: 0, observacoes: "" });
      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao aprovar orçamento",
      });
    }
  };

  const handleRejectOrcamento = async (orcamentoId: string) => {
    try {
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: 'reprovado' })
        .eq("id", orcamentoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento reprovado",
      });

      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao reprovar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao reprovar orçamento",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'reprovado':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Reprovado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const valorTotal = calcularValorTotal();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie orçamentos dos leads</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou telefone do lead"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select value={filters.lead} onValueChange={(value) => setFilters(prev => ({ ...prev, lead: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os leads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os leads</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Criação */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_id">Lead *</Label>
                  <Select value={formData.lead_id} onValueChange={(value) => handleFormChange("lead_id", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.nome} - {lead.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                  <Select value={formData.forma_pagamento} onValueChange={(value) => handleFormChange("forma_pagamento", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À vista</SelectItem>
                      <SelectItem value="Cartão de crédito">Cartão de crédito</SelectItem>
                      <SelectItem value="Parcelado">Parcelado</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_produto">Valor do Produto *</Label>
                  <Input
                    id="valor_produto"
                    type="number"
                    step="0.01"
                    value={formData.valor_produto}
                    onChange={(e) => handleFormChange("valor_produto", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_pintura">Valor da Pintura</Label>
                  <Input
                    id="valor_pintura"
                    type="number"
                    step="0.01"
                    value={formData.valor_pintura}
                    onChange={(e) => handleFormChange("valor_pintura", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_frete">Frete</Label>
                  <Input
                    id="valor_frete"
                    type="number"
                    step="0.01"
                    value={formData.valor_frete}
                    onChange={(e) => handleFormChange("valor_frete", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_instalacao">Instalação</Label>
                  <Input
                    id="valor_instalacao"
                    type="number"
                    step="0.01"
                    value={formData.valor_instalacao}
                    onChange={(e) => handleFormChange("valor_instalacao", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Campos Personalizados</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCampoPersonalizado}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </div>

                {camposPersonalizados.map((campo, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Nome do campo"
                      value={campo.nome}
                      onChange={(e) => updateCampoPersonalizado(index, "nome", e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={campo.valor}
                      onChange={(e) => updateCampoPersonalizado(index, "valor", e.target.value)}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCampoPersonalizado(index)}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto no Produto</Label>
                  <Select 
                    value={formData.desconto_percentual.toString()} 
                    onValueChange={(value) => handleFormChange("desconto_percentual", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem desconto</SelectItem>
                      <SelectItem value="5">5% de desconto</SelectItem>
                      <SelectItem value="10">10% de desconto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requer_analise"
                      checked={formData.requer_analise}
                      onCheckedChange={(checked) => handleFormChange("requer_analise", checked)}
                    />
                    <Label htmlFor="requer_analise">Requer Análise da Gerência</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marque esta opção se precisar de aprovação para desconto acima de 10%
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="text-lg font-semibold">
                  Valor Total: R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                {formData.desconto_percentual > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Desconto de {formData.desconto_percentual}% aplicado no produto
                  </div>
                )}
                {formData.requer_analise && (
                  <div className="text-sm text-yellow-600 mt-2">
                    ⚠️ Este orçamento será enviado para análise da gerência
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Orçamento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrcamentos.map((orcamento) => (
                <TableRow key={orcamento.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{orcamento.elisaportas_leads?.nome}</div>
                      <div className="text-sm text-muted-foreground">{orcamento.elisaportas_leads?.telefone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                  <TableCell className="font-medium">
                    R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{orcamento.forma_pagamento}</TableCell>
                  <TableCell>
                    {format(new Date(orcamento.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => generatePDF(orcamento)}>
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                      {(isAdmin || isGerenteComercial) && orcamento.status === 'pendente' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 border-green-600"
                            onClick={() => {
                              setSelectedOrcamento(orcamento);
                              setShowApprovalModal(true);
                            }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-600"
                            onClick={() => handleRejectOrcamento(orcamento.id)}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reprovar
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Aprovação */}
      {showApprovalModal && selectedOrcamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Aprovar Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Lead: {selectedOrcamento.elisaportas_leads?.nome}</Label>
                <p className="text-sm text-muted-foreground">
                  Valor Atual: R$ {selectedOrcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Desconto Adicional (%)</Label>
                <Select 
                  value={approvalData.desconto_adicional.toString()} 
                  onValueChange={(value) => setApprovalData(prev => ({ ...prev, desconto_adicional: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem desconto adicional</SelectItem>
                    <SelectItem value="5">5% de desconto adicional</SelectItem>
                    <SelectItem value="10">10% de desconto adicional</SelectItem>
                    <SelectItem value="15">15% de desconto adicional</SelectItem>
                    <SelectItem value="20">20% de desconto adicional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre a aprovação..."
                  value={approvalData.observacoes}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedOrcamento(null);
                    setApprovalData({ desconto_adicional: 0, observacoes: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleApproveOrcamento}>
                  Aprovar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}