import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RequisicaoVenda {
  id: string;
  orcamento_id: string;
  solicitante_id: string;
  gerente_id: string | null;
  status: string;
  custo_material: number | null;
  custo_pintura: number | null;
  custo_instalacao: number | null;
  custo_frete: number | null;
  observacoes: string | null;
  data_aprovacao: string | null;
  created_at: string;
  canal_aquisicao_id: string | null;
  canais_aquisicao?: { nome: string } | null;
  orcamentos: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string;
    cliente_email: string | null;
    cliente_cpf: string | null;
    cliente_estado: string | null;
    cliente_cidade: string | null;
    cliente_bairro: string | null;
    cliente_cep: string | null;
    valor_total: number;
    valor_produto: number;
    valor_pintura: number;
    valor_frete: number;
    valor_instalacao: number;
    forma_pagamento: string;
    modalidade_instalacao: string | null;
    numero_parcelas: number | null;
    valor_entrada: number | null;
    desconto_percentual: number | null;
    publico_alvo: string | null;
    canal_aquisicao_id: string | null;
    campos_personalizados: any;
    canais_aquisicao?: { nome: string } | null;
  };
}

export function RequisicoesVenda() {
  const { toast } = useToast();
  const { user, isGerenteComercial, isAdmin } = useAuth();
  const [requisicoes, setRequisicoes] = useState<RequisicaoVenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequisicao, setSelectedRequisicao] = useState<RequisicaoVenda | null>(null);
  const [custos, setCustos] = useState({
    custo_material: "",
    custo_pintura: "",
    custo_instalacao: "",
    custo_frete: "",
    observacoes: ""
  });

  useEffect(() => {
    if (isGerenteComercial || isAdmin) {
      fetchRequisicoes();
    }
  }, [isGerenteComercial, isAdmin]);

  const fetchRequisicoes = async () => {
    try {
      const { data, error } = await supabase
        .from("requisicoes_venda")
        .select(`
          *,
          canais_aquisicao (nome),
          orcamentos (
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            cliente_cpf,
            cliente_estado,
            cliente_cidade,
            cliente_bairro,
            cliente_cep,
            valor_total,
            valor_produto,
            valor_pintura,
            valor_frete,
            valor_instalacao,
            forma_pagamento,
            modalidade_instalacao,
            desconto_percentual,
            publico_alvo,
            canal_aquisicao_id,
            campos_personalizados,
            canais_aquisicao (nome)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequisicoes((data || []) as any);
    } catch (error) {
      console.error("Erro ao buscar requisições:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar requisições de venda",
      });
    }
  };

  const handleCustoChange = (field: string, value: string) => {
    setCustos(prev => ({ ...prev, [field]: value }));
  };

  const calcularLucro = () => {
    const valorVenda = selectedRequisicao?.orcamentos?.valor_total || 0;
    const custoTotal = 
      (parseFloat(custos.custo_material) || 0) +
      (parseFloat(custos.custo_pintura) || 0) +
      (parseFloat(custos.custo_instalacao) || 0) +
      (parseFloat(custos.custo_frete) || 0);
    
    return valorVenda - custoTotal;
  };

  const aprovarRequisicao = async () => {
    if (!selectedRequisicao) return;
    setLoading(true);

    try {
      // Atualizar requisição com custos e aprovar
      const { error: updateError } = await supabase
        .from("requisicoes_venda")
        .update({
          status: "aprovada",
          gerente_id: user?.id,
          custo_material: parseFloat(custos.custo_material) || null,
          custo_pintura: parseFloat(custos.custo_pintura) || null,
          custo_instalacao: parseFloat(custos.custo_instalacao) || null,
          custo_frete: parseFloat(custos.custo_frete) || null,
          observacoes: custos.observacoes || null,
          data_aprovacao: new Date().toISOString()
        })
        .eq("id", selectedRequisicao.id);

      if (updateError) throw updateError;

      // Criar venda com todos os dados do orçamento
      const orcamento = selectedRequisicao.orcamentos;
      
      // Buscar produtos do orçamento separando pintura epóxi dos demais
      const { data: produtosOrcamento, error: produtosError } = await supabase
        .from("orcamento_produtos")
        .select("valor, tipo_produto")
        .eq("orcamento_id", orcamento.id);

      if (produtosError) {
        console.error("Erro ao buscar produtos do orçamento:", produtosError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao calcular valor dos produtos",
        });
        return;
      }

      // Separar valores: pintura epóxi vs outros produtos
      const valorProdutosSemPintura = produtosOrcamento?.reduce((sum, produto) => {
        return produto.tipo_produto === 'pintura_epoxi' ? sum : sum + (produto.valor || 0);
      }, 0) || 0;

      const valorPinturaEpoxi = produtosOrcamento?.reduce((sum, produto) => {
        return produto.tipo_produto === 'pintura_epoxi' ? sum + (produto.valor || 0) : sum;
      }, 0) || 0;
      
      const { error: vendaError } = await supabase
        .from("vendas")
        .insert({
          atendente_id: selectedRequisicao.solicitante_id,
          cliente_nome: orcamento.cliente_nome,
          cliente_telefone: orcamento.cliente_telefone,
          cliente_email: orcamento.cliente_email,
          valor_venda: orcamento.valor_total,
          valor_produto: valorProdutosSemPintura,
          valor_pintura: valorPinturaEpoxi,
          valor_frete: orcamento.valor_frete,
          valor_instalacao: orcamento.valor_instalacao,
          custo_produto: parseFloat(custos.custo_material) || 0,
          custo_pintura: parseFloat(custos.custo_pintura) || 0,
          forma_pagamento: orcamento.forma_pagamento,
          estado: orcamento.cliente_estado,
          cidade: orcamento.cliente_cidade,
          bairro: orcamento.cliente_bairro,
          cep: orcamento.cliente_cep,
          publico_alvo: orcamento.publico_alvo,
          canal_aquisicao_id: selectedRequisicao.canal_aquisicao_id || orcamento.canal_aquisicao_id,
          observacoes_venda: custos.observacoes,
          data_venda: new Date().toISOString()
        });

      if (vendaError) throw vendaError;

      toast({
        title: "Sucesso",
        description: "Requisição aprovada e venda criada com sucesso",
      });

      fetchRequisicoes();
      setSelectedRequisicao(null);
      setCustos({
        custo_material: "",
        custo_pintura: "",
        custo_instalacao: "",
        custo_frete: "",
        observacoes: ""
      });
    } catch (error) {
      console.error("Erro ao aprovar requisição:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao aprovar requisição",
      });
    } finally {
      setLoading(false);
    }
  };

  const reprovarRequisicao = async () => {
    if (!selectedRequisicao) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("requisicoes_venda")
        .update({
          status: "reprovada",
          gerente_id: user?.id,
          observacoes: custos.observacoes || null
        })
        .eq("id", selectedRequisicao.id);

      if (error) throw error;

      // Atualizar status do orçamento para reprovado
      await supabase
        .from("orcamentos")
        .update({
          status: 'reprovado'
        })
        .eq("id", selectedRequisicao.orcamento_id);

      toast({
        title: "Requisição reprovada",
        description: "A requisição foi reprovada e o orçamento foi marcado como reprovado",
      });

      fetchRequisicoes();
      setSelectedRequisicao(null);
    } catch (error) {
      console.error("Erro ao reprovar requisição:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao reprovar requisição",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirRequisicao = async (id: string) => {
    try {
      const { error } = await supabase
        .from("requisicoes_venda")
        .update({ status: "excluida" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Requisição excluída",
        description: "A requisição foi movida para a lixeira",
      });

      fetchRequisicoes();
    } catch (error) {
      console.error("Erro ao excluir requisição:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir requisição",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "aprovada":
        return <Badge variant="default">Aprovada</Badge>;
      case "reprovada":
        return <Badge variant="destructive">Reprovada</Badge>;
      case "excluida":
        return <Badge variant="outline">Excluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filtrarRequisicoes = (status: string) => {
    return requisicoes.filter(req => {
      if (status === "lixeira") return req.status === "excluida";
      return req.status === status;
    });
  };

  if (!isGerenteComercial && !isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Acesso restrito a gerentes comerciais</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pendente" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
          <TabsTrigger value="reprovada">Reprovadas</TabsTrigger>
          <TabsTrigger value="lixeira">Lixeira</TabsTrigger>
        </TabsList>

        {["pendente", "aprovada", "reprovada", "lixeira"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrarRequisicoes(status).map((requisicao) => (
                <Card key={requisicao.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{requisicao.orcamentos?.cliente_nome}</CardTitle>
                        <p className="text-sm text-muted-foreground">{requisicao.orcamentos?.cliente_telefone}</p>
                      </div>
                      {getStatusBadge(requisicao.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Valor:</span>
                        <span>R$ {(requisicao.orcamentos?.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {requisicao.orcamentos && (
                        <div className="flex justify-between">
                          <span>Pagamento:</span>
                          <span>{requisicao.orcamentos.forma_pagamento}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Criado em:</span>
                        <span>{new Date(requisicao.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedRequisicao(requisicao);
                              // Preencher com custos salvos ou valores do orçamento como padrão
                              setCustos({
                                custo_material: requisicao.custo_material?.toString() || "",
                                custo_pintura: requisicao.custo_pintura?.toString() || "",
                                custo_instalacao: requisicao.custo_instalacao?.toString() || (requisicao.orcamentos?.valor_instalacao || 0).toString(),
                                custo_frete: requisicao.custo_frete?.toString() || (requisicao.orcamentos?.valor_frete || 0).toString(),
                                observacoes: requisicao.observacoes || ""
                              });
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Requisição de Venda - {selectedRequisicao?.orcamentos?.cliente_nome}</DialogTitle>
                          </DialogHeader>
                          
                          {selectedRequisicao && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h3 className="font-semibold mb-2">Informações do Cliente</h3>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Nome:</strong> {selectedRequisicao.orcamentos?.cliente_nome}</p>
                                    <p><strong>Telefone:</strong> {selectedRequisicao.orcamentos?.cliente_telefone}</p>
                                    {selectedRequisicao.orcamentos?.cliente_email && (
                                      <p><strong>Email:</strong> {selectedRequisicao.orcamentos.cliente_email}</p>
                                    )}
                                    {selectedRequisicao.orcamentos?.cliente_cpf && (
                                      <p><strong>CPF:</strong> {selectedRequisicao.orcamentos.cliente_cpf}</p>
                                    )}
                                    {selectedRequisicao.orcamentos?.cliente_cidade && (
                                      <p><strong>Cidade:</strong> {selectedRequisicao.orcamentos.cliente_cidade} - {selectedRequisicao.orcamentos.cliente_estado}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="font-semibold mb-2">Detalhes da Venda</h3>
                                  <div className="space-y-2">
                                    <div className="text-2xl font-bold text-primary">
                                      R$ {(selectedRequisicao.orcamentos?.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-sm space-y-1">
                                      <p>Produto: R$ {(selectedRequisicao.orcamentos?.valor_produto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p>Pintura: R$ {(selectedRequisicao.orcamentos?.valor_pintura || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p>Frete: R$ {(selectedRequisicao.orcamentos?.valor_frete || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p>Instalação: R$ {(selectedRequisicao.orcamentos?.valor_instalacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p className="mt-2"><strong>Pagamento:</strong> {selectedRequisicao.orcamentos?.forma_pagamento}</p>
                                      {selectedRequisicao.orcamentos?.modalidade_instalacao && (
                                        <p><strong>Instalação:</strong> {selectedRequisicao.orcamentos.modalidade_instalacao}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {selectedRequisicao.status === "pendente" && (
                                <div className="space-y-4">
                                  <h3 className="font-semibold">Custos da Venda</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="custo_material">Custo do Material</Label>
                                      <Input
                                        id="custo_material"
                                        type="number"
                                        step="0.01"
                                        value={custos.custo_material}
                                        onChange={(e) => handleCustoChange("custo_material", e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="custo_pintura">Custo da Pintura</Label>
                                      <Input
                                        id="custo_pintura"
                                        type="number"
                                        step="0.01"
                                        value={custos.custo_pintura}
                                        onChange={(e) => handleCustoChange("custo_pintura", e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="custo_instalacao">Custo da Instalação</Label>
                                      <Input
                                        id="custo_instalacao"
                                        type="number"
                                        step="0.01"
                                        value={custos.custo_instalacao}
                                        onChange={(e) => handleCustoChange("custo_instalacao", e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="custo_frete">Custo do Frete</Label>
                                      <Input
                                        id="custo_frete"
                                        type="number"
                                        step="0.01"
                                        value={custos.custo_frete}
                                        onChange={(e) => handleCustoChange("custo_frete", e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="observacoes">Observações</Label>
                                    <Textarea
                                      id="observacoes"
                                      value={custos.observacoes}
                                      onChange={(e) => handleCustoChange("observacoes", e.target.value)}
                                    />
                                  </div>

                                  <div className="bg-muted p-4 rounded-lg">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <p className="font-semibold">Custo Total:</p>
                                        <p>R$ {((parseFloat(custos.custo_material) || 0) + (parseFloat(custos.custo_pintura) || 0) + (parseFloat(custos.custo_instalacao) || 0) + (parseFloat(custos.custo_frete) || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold">Valor de Venda:</p>
                                        <p>R$ {(selectedRequisicao.orcamentos?.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold">Lucro:</p>
                                        <p className={calcularLucro() >= 0 ? "text-green-600" : "text-red-600"}>
                                          R$ {calcularLucro().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button 
                                      onClick={aprovarRequisicao} 
                                      disabled={loading}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Aprovar
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={reprovarRequisicao} 
                                      disabled={loading}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reprovar
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {selectedRequisicao.status !== "pendente" && (
                                <div className="space-y-4">
                                  <h3 className="font-semibold">Custos Registrados</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p><strong>Material:</strong> R$ {(selectedRequisicao.custo_material || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p><strong>Pintura:</strong> R$ {(selectedRequisicao.custo_pintura || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                      <p><strong>Instalação:</strong> R$ {(selectedRequisicao.custo_instalacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                      <p><strong>Frete:</strong> R$ {(selectedRequisicao.custo_frete || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                  {selectedRequisicao.observacoes && (
                                    <div>
                                      <p className="font-semibold">Observações:</p>
                                      <p className="text-sm">{selectedRequisicao.observacoes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {status === "lixeira" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => excluirRequisicao(requisicao.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}