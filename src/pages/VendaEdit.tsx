
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { canaisAquisicao } from "@/utils/canaisAquisicao";
import type { Tables } from "@/integrations/supabase/types";
import { usePortasVenda } from "@/hooks/usePortasVenda";
import { ProdutoVendaForm } from "@/components/vendas/ProdutoVendaForm";
import { PortasVendaTable } from "@/components/vendas/PortasVendaTable";
import type { ProdutoVenda } from "@/hooks/useVendas";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
}

export default function VendaEdit() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<Tables<"vendas"> | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProdutoForm, setShowProdutoForm] = useState(false);
  const { portas, isLoading: isLoadingPortas, addPorta, deletePorta } = usePortasVenda(id);
  const [formData, setFormData] = useState({
    valor_venda: "",
    forma_pagamento: "",
    observacoes_venda: "",
    canal_aquisicao: "Google",
    data_venda: "",
    estado: "",
    cidade: "",
    bairro: "",
    cep: "",
    publico_alvo: "cliente_final",
    cliente_nome: "",
    cliente_telefone: "",
    cliente_email: "",
    valor_produto: "",
    custo_produto: "",
    valor_pintura: "",
    custo_pintura: "",
    valor_instalacao: "",
    valor_frete: "",
    resgate: false
    // Removido lucro_total pois é uma coluna gerada
  });

  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVenda();
    }
  }, [id]);

  useEffect(() => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores podem editar vendas",
      });
      navigate("/dashboard/faturamento");
    }
  }, [isAdmin, navigate, toast]);

  const fetchVenda = async () => {
    if (!id) return;
    
    try {
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();

      if (vendaError) throw vendaError;
      
      setVenda(vendaData);
      setFormData({
        valor_venda: (vendaData.valor_venda ? vendaData.valor_venda * 100 : 0).toString(),
        forma_pagamento: vendaData.forma_pagamento || "",
        observacoes_venda: vendaData.observacoes_venda || "",
        canal_aquisicao: vendaData.canal_aquisicao_id || "Google",
        data_venda: new Date(vendaData.data_venda).toISOString().slice(0, 16),
        estado: vendaData.estado || "",
        cidade: vendaData.cidade || "",
        bairro: vendaData.bairro || "",
        cep: vendaData.cep || "",
        publico_alvo: vendaData.publico_alvo || "cliente_final",
        cliente_nome: vendaData.cliente_nome || "",
        cliente_telefone: vendaData.cliente_telefone || "",
        cliente_email: vendaData.cliente_email || "",
        valor_produto: (vendaData.valor_produto ? vendaData.valor_produto * 100 : 0).toString(),
        custo_produto: (vendaData.custo_produto ? vendaData.custo_produto * 100 : 0).toString(),
        valor_pintura: (vendaData.valor_pintura ? vendaData.valor_pintura * 100 : 0).toString(),
        custo_pintura: (vendaData.custo_pintura ? vendaData.custo_pintura * 100 : 0).toString(),
        valor_instalacao: (vendaData.valor_instalacao ? vendaData.valor_instalacao * 100 : 0).toString(),
        valor_frete: (vendaData.valor_frete ? vendaData.valor_frete * 100 : 0).toString(),
        resgate: vendaData.resgate || false
        // Removido lucro_total pois é uma coluna gerada automaticamente
      });

      // Vendas table doesn't have lead_id, so skip lead lookup
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados da venda",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setLoading(true);

    try {
      console.log("Iniciando atualização da venda:", id);
      console.log("Dados a serem atualizados:", formData);

      const valorProduto = parseFloat(formData.valor_produto) / 100;
      const custoProduto = parseFloat(formData.custo_produto) / 100;
      const valorPintura = parseFloat(formData.valor_pintura) / 100;
      const custoPintura = parseFloat(formData.custo_pintura) / 100;
      const valorInstalacao = parseFloat(formData.valor_instalacao) / 100;
      const valorFrete = parseFloat(formData.valor_frete) / 100;
      
      const custoTotal = custoProduto + custoPintura;
      const valorVenda = valorProduto + valorPintura + valorInstalacao + valorFrete;
      const lucroTotal = valorVenda - custoTotal;

      const updateData = {
        valor_venda: valorVenda,
        forma_pagamento: formData.forma_pagamento || null,
        observacoes_venda: formData.observacoes_venda || null,
        canal_aquisicao_id: formData.canal_aquisicao,
        data_venda: new Date(formData.data_venda).toISOString(),
        estado: formData.estado || null,
        cidade: formData.cidade || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        publico_alvo: formData.publico_alvo,
        cliente_nome: formData.cliente_nome || null,
        cliente_telefone: formData.cliente_telefone || null,
        cliente_email: formData.cliente_email || null,
        valor_produto: valorProduto,
        custo_produto: custoProduto,
        valor_pintura: valorPintura,
        custo_pintura: custoPintura,
        valor_instalacao: valorInstalacao,
        valor_frete: valorFrete,
        resgate: formData.resgate
        // Removido lucro_total pois é uma coluna gerada automaticamente
      };

      console.log("Update data processado:", updateData);

      const { data, error } = await supabase
        .from("vendas")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) {
        console.error("Erro na atualização:", error);
        throw error;
      }

      console.log("Venda atualizada com sucesso:", data);

      toast({
        title: "Sucesso",
        description: "Venda atualizada com sucesso",
      });

      navigate("/dashboard/faturamento");
    } catch (error) {
      console.error("Erro ao atualizar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao atualizar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleValueChange = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, valor_venda: numbers }));
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Venda</h1>
          <p className="text-muted-foreground">Editar dados da venda</p>
        </div>
      </div>

      {lead && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nome:</strong> {lead.nome}</div>
              <div><strong>Email:</strong> {lead.email}</div>
              <div><strong>Telefone:</strong> {lead.telefone}</div>
              <div><strong>Cidade:</strong> {lead.cidade}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_venda">Data da Venda *</Label>
                <Input
                  id="data_venda"
                  type="datetime-local"
                  value={formData.data_venda}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publico_alvo">Público Alvo *</Label>
                <Select
                  value={formData.publico_alvo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, publico_alvo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serralheiro">Serralheiro</SelectItem>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal_aquisicao">Canal de Aquisição *</Label>
                <Select
                  value={formData.canal_aquisicao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, canal_aquisicao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {canaisAquisicao.map((canal) => (
                      <SelectItem key={canal} value={canal}>
                        {canal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Input
                  id="forma_pagamento"
                  placeholder="Ex: PIX, Cartão, Boleto"
                  value={formData.forma_pagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                  <Input
                    id="cliente_nome"
                    placeholder="Nome completo"
                    value={formData.cliente_nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente_telefone">Telefone do Cliente *</Label>
                  <Input
                    id="cliente_telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente_email">E-mail do Cliente</Label>
                  <Input
                    id="cliente_email"
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Valores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_produto">Valor do Produto *</Label>
                  <Input
                    id="valor_produto"
                    placeholder="R$ 0,00"
                    value={formData.valor_produto ? formatCurrency(formData.valor_produto) : ""}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, valor_produto: numbers }));
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_produto">Custo do Produto *</Label>
                  <Input
                    id="custo_produto"
                    placeholder="R$ 0,00"
                    value={formData.custo_produto ? formatCurrency(formData.custo_produto) : ""}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, custo_produto: numbers }));
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_pintura">Valor da Pintura</Label>
                  <Input
                    id="valor_pintura"
                    placeholder="R$ 0,00"
                    value={formData.valor_pintura ? formatCurrency(formData.valor_pintura) : ""}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, valor_pintura: numbers }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_pintura">Custo da Pintura</Label>
                  <Input
                    id="custo_pintura"
                    placeholder="R$ 0,00"
                    value={formData.custo_pintura ? formatCurrency(formData.custo_pintura) : ""}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, custo_pintura: numbers }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_instalacao">Valor da Instalação</Label>
                  <Input
                    id="valor_instalacao"
                    placeholder="R$ 0,00"
                    value={formData.valor_instalacao ? formatCurrency(formData.valor_instalacao) : ""}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, valor_instalacao: numbers }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_frete">Valor do Frete</Label>
                  <Input
                    id="valor_frete"
                    placeholder="R$ 0,00"
                    value={formData.valor_frete ? formatCurrency(formData.valor_frete) : ""}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, valor_frete: numbers }));
                    }}
                  />
                </div>

                <div className="space-y-2 flex items-center space-x-2">
                  <Checkbox
                    id="resgate"
                    checked={formData.resgate}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, resgate: checked as boolean }))}
                  />
                  <Label htmlFor="resgate">Foi resgate?</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="Ex: SP"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Nome da cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  placeholder="Nome do bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes_venda">Observações</Label>
              <Textarea
                id="observacoes_venda"
                placeholder="Observações sobre a venda..."
                value={formData.observacoes_venda}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_venda: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Atualizar Venda"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos da Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={() => setShowProdutoForm(true)}>
            Adicionar Produto
          </Button>

          <ProdutoVendaForm 
            open={showProdutoForm}
            onOpenChange={setShowProdutoForm}
            onAddProduto={async (produto: ProdutoVenda) => {
              await addPorta(produto);
              setShowProdutoForm(false);
            }}
          />
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Produtos Adicionados</h3>
            {isLoadingPortas ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando produtos...
              </div>
            ) : (
              <PortasVendaTable 
                portas={(portas || []).map(p => ({
                  tipo_produto: p.tipo_produto as 'porta' | 'acessorio' | 'adicional',
                  tamanho: p.tamanho || '',
                  cor_id: p.cor_id || '',
                  acessorio_id: p.acessorio_id || '',
                  adicional_id: p.adicional_id || '',
                  valor_produto: p.valor_produto,
                  valor_pintura: p.valor_pintura,
                  valor_instalacao: p.valor_instalacao,
                  valor_frete: p.valor_frete,
                  tipo_desconto: p.tipo_desconto as 'percentual' | 'valor',
                  desconto_percentual: p.desconto_percentual,
                  desconto_valor: p.desconto_valor,
                  quantidade: p.quantidade,
                  descricao: p.descricao || ''
                }))} 
                onRemovePorta={async (index: number) => {
                  const produto = portas?.[index];
                  if (produto?.id) {
                    await deletePorta(produto.id);
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
