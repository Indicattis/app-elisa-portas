import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendas, VendaFormData, ProdutoVenda } from '@/hooks/useVendas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarIcon, Percent, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { ProdutoVendaForm } from '@/components/vendas/ProdutoVendaForm';
import { ProdutosVendaTable } from '@/components/vendas/ProdutosVendaTable';
import { VendaResumo } from '@/components/vendas/VendaResumo';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SelecionarAcessoriosModal } from '@/components/vendas/SelecionarAcessoriosModal';
import { DescontoVendaModal } from '@/components/vendas/DescontoVendaModal';
import { CreditoVendaModal } from '@/components/vendas/CreditoVendaModal';
import { AutorizacaoDescontoModal } from '@/components/vendas/AutorizacaoDescontoModal';
import { PinturaRapidaModal } from '@/components/vendas/PinturaRapidaModal';
import { validarDesconto, getTipoAutorizacaoNecessaria } from '@/utils/descontoVendasRules';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { PagamentoSection, PagamentoData, createEmptyPagamentoData } from '@/components/vendas/PagamentoSection';
import { ClienteVendaSection } from '@/components/vendas/ClienteVendaSection';
import { MinimalistLayout } from '@/components/MinimalistLayout';

export default function VendaNovaMinimalista() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orcamentoId = searchParams.get('orcamento_id');
  const { toast } = useToast();
  const { createVenda, isCreating } = useVendas();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<VendaFormData>({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    cpf_cliente: '',
    estado: '',
    cidade: '',
    cep: '',
    bairro: '',
    endereco: '',
    publico_alvo: '',
    forma_pagamento: '',
    observacoes_venda: '',
    valor_frete: 0,
    valor_entrada: 0,
    valor_a_receber: 0,
    data_prevista_entrega: '',
    tipo_entrega: 'instalacao',
    venda_presencial: false
  });

  const [portas, setPortas] = useState<ProdutoVenda[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acessoriosModalOpen, setAcessoriosModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoVenda | undefined>(undefined);
  const [indexEditando, setIndexEditando] = useState<number | undefined>(undefined);
  const [tipoInicial, setTipoInicial] = useState<'porta_enrolar' | 'porta_social' | 'pintura_epoxi' | 'acessorio' | 'adicional' | 'manutencao' | undefined>(undefined);
  const [permitirTrocaTipo, setPermitirTrocaTipo] = useState(true);
  const [descontoModalOpen, setDescontoModalOpen] = useState(false);
  const [creditoModalOpen, setCreditoModalOpen] = useState(false);
  const [autorizacaoDescontoOpen, setAutorizacaoDescontoOpen] = useState(false);
  const [produtosComDesconto, setProdutosComDesconto] = useState<ProdutoVenda[]>([]);
  const [autorizadorId, setAutorizadorId] = useState<string | null>(null);
  const [tipoAutorizacaoNecessaria, setTipoAutorizacaoNecessaria] = useState<'responsavel_setor' | 'master' | null>(null);
  const [limitePermitido, setLimitePermitido] = useState<number>(10);
  
  const [valorCredito, setValorCredito] = useState<number>(0);
  const [percentualCredito, setPercentualCredito] = useState<number>(0);

  const [pinturaRapidaOpen, setPinturaRapidaOpen] = useState(false);
  const [portaRecemAdicionada, setPortaRecemAdicionada] = useState<{largura: number, altura: number} | null>(null);

  const [pagamentoData, setPagamentoData] = useState<PagamentoData>(createEmptyPagamentoData());

  const { data: cores } = useQuery({
    queryKey: ['cores-catalogo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_cores')
        .select('*')
        .eq('ativa', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  const { data: orcamentoData, isLoading: isLoadingOrcamento } = useQuery({
    queryKey: ['orcamento-para-venda', orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return null;
      
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          orcamento_produtos (*),
          admin_users (id, nome)
        `)
        .eq('id', orcamentoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!orcamentoId
  });

  const isFromOrcamento = !!orcamentoId && !!orcamentoData;

  useEffect(() => {
    if (orcamentoData) {
      setFormData(prev => ({
        ...prev,
        cliente_nome: orcamentoData.cliente_nome || '',
        cliente_telefone: orcamentoData.cliente_telefone || '',
        cliente_email: orcamentoData.cliente_email || '',
        cpf_cliente: orcamentoData.cliente_cpf || '',
        estado: orcamentoData.cliente_estado || '',
        cidade: orcamentoData.cliente_cidade || '',
        cep: orcamentoData.cliente_cep || '',
        bairro: orcamentoData.cliente_bairro || '',
        endereco: '',
        publico_alvo: orcamentoData.publico_alvo || '',
        canal_aquisicao_id: orcamentoData.canal_aquisicao_id || '',
        valor_frete: orcamentoData.valor_frete || 0,
        tipo_entrega: 'instalacao',
        orcamento_id: orcamentoData.id,
      }));

      if (orcamentoData.orcamento_produtos && orcamentoData.orcamento_produtos.length > 0) {
        const produtosConvertidos: ProdutoVenda[] = orcamentoData.orcamento_produtos.map((p: any) => ({
          tipo_produto: p.tipo_produto || 'porta_enrolar',
          largura: p.medidas?.largura || 0,
          altura: p.medidas?.altura || 0,
          cor_id: p.cor_id || '',
          valor_produto: p.valor || 0,
          valor_pintura: p.preco_producao || 0,
          valor_instalacao: p.preco_instalacao || 0,
          valor_frete: 0,
          quantidade: p.quantidade || 1,
          descricao: p.descricao || '',
          desconto_percentual: p.desconto_percentual || 0,
          desconto_valor: 0,
          tipo_desconto: 'percentual' as const,
          valor_credito: 0,
        }));
        setPortas(produtosConvertidos);
      }

      const formaPagamento = orcamentoData.forma_pagamento;
      if (formaPagamento === 'a_vista' || formaPagamento === 'boleto' || formaPagamento === 'cartao_credito' || formaPagamento === 'dinheiro') {
        setPagamentoData(prev => ({
          ...prev,
          metodo_pagamento: formaPagamento
        }));
      }
    }
  }, [orcamentoData]);

  const recalcularValorTotal = (produtos: ProdutoVenda[], credito: number = valorCredito) => {
    const valorProdutos = produtos.reduce((acc, p) => {
      const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
      const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
      return acc + valorBase - desconto;
    }, 0);
    return valorProdutos + credito + (formData.valor_frete || 0);
  };

  const handleAddPorta = (produto: ProdutoVenda) => {
    setPortas(prev => {
      let newPortas;
      
      if (indexEditando !== undefined) {
        newPortas = [...prev];
        newPortas[indexEditando] = produto;
      } else {
        newPortas = [...prev, produto];
      }
      
      const valorTotal = recalcularValorTotal(newPortas);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      setProdutoEditando(undefined);
      setIndexEditando(undefined);
      
      return newPortas;
    });

    if (produto.tipo_produto === 'porta_enrolar' && indexEditando === undefined && produto.largura && produto.altura) {
      setPortaRecemAdicionada({ largura: produto.largura, altura: produto.altura });
      setPinturaRapidaOpen(true);
    }
  };

  const handleAddPinturaRapida = (pintura: ProdutoVenda) => {
    setPortas(prev => {
      const newPortas = [...prev, pintura];
      const valorTotal = recalcularValorTotal(newPortas);
      
      setFormData(prevForm => ({
        ...prevForm,
        valor_a_receber: valorTotal - (prevForm.valor_entrada || 0)
      }));
      
      return newPortas;
    });
    setPortaRecemAdicionada(null);
  };

  const handleAddAcessorios = (produtos: ProdutoVenda[]) => {
    setPortas(prev => {
      const newPortas = [...prev, ...produtos];
      
      const valorTotal = recalcularValorTotal(newPortas);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
  };

  const handleEditPorta = (index: number) => {
    setProdutoEditando(portas[index]);
    setIndexEditando(index);
    setDialogOpen(true);
  };

  const handleRemovePorta = (index: number) => {
    setPortas(prev => {
      const newPortas = prev.filter((_, i) => i !== index);
      const valorTotal = recalcularValorTotal(newPortas);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
  };

  const handleUpdateQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    
    setPortas(prev => {
      const newPortas = [...prev];
      newPortas[index] = { ...newPortas[index], quantidade: novaQuantidade };
      
      const valorTotal = recalcularValorTotal(newPortas);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
  };

  const handleAplicarDesconto = (produtosAtualizados: ProdutoVenda[]) => {
    setPortas(produtosAtualizados);
    
    setValorCredito(0);
    setPercentualCredito(0);
    
    const valorTotal = recalcularValorTotal(produtosAtualizados, 0);
    
    setFormData(prev => ({
      ...prev,
      valor_a_receber: valorTotal - (prev.valor_entrada || 0)
    }));
  };

  const handleAplicarCredito = (novoValorCredito: number, novoPercentualCredito: number) => {
    setValorCredito(novoValorCredito);
    setPercentualCredito(novoPercentualCredito);
    
    const valorTotal = recalcularValorTotal(portas, novoValorCredito);
    
    setFormData(prev => ({
      ...prev,
      valor_a_receber: valorTotal - (prev.valor_entrada || 0)
    }));
    
    toast({ title: "Crédito aplicado com sucesso" });
  };

  const handleRemoverDesconto = (index: number) => {
    setPortas(prev => {
      const newPortas = [...prev];
      newPortas[index] = {
        ...newPortas[index],
        desconto_valor: 0,
        desconto_percentual: 0
      };
      
      const valorTotal = recalcularValorTotal(newPortas);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
    
    toast({ title: "Desconto removido com sucesso" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (portas.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário adicionar pelo menos um produto'
      });
      return;
    }

    if (!formData.estado || !formData.cidade || !formData.cep || !formData.bairro || !formData.endereco) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Todos os campos de localização são obrigatórios (Estado, Cidade, CEP, Bairro e Endereço).'
      });
      return;
    }

    if (formData.endereco.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O endereço deve ter no mínimo 2 caracteres.'
      });
      return;
    }

    if (formData.bairro.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O bairro deve ter no mínimo 2 caracteres.'
      });
      return;
    }

    const documentoDigitos = formData.cpf_cliente?.replace(/\D/g, '') || '';
    if (documentoDigitos && documentoDigitos.length !== 11 && documentoDigitos.length !== 14) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Documento inválido. Digite um CPF (11 dígitos) ou CNPJ (14 dígitos).'
      });
      return;
    }

    const validacao = validarDesconto(
      portas,
      formData.forma_pagamento,
      formData.venda_presencial
    );

    const tipoAutorizacao = getTipoAutorizacaoNecessaria(validacao);
    if (tipoAutorizacao) {
      setProdutosComDesconto(portas);
      setTipoAutorizacaoNecessaria(tipoAutorizacao);
      setLimitePermitido(validacao.limitePermitido);
      setAutorizacaoDescontoOpen(true);
      return;
    }

    try {
      await createVenda({ 
        vendaData: {
          ...formData,
          forma_pagamento: pagamentoData.metodos[0]?.tipo || '',
          data_venda: new Date().toISOString(),
        },
        portas,
        pagamentoData,
        creditoVenda: { valorCredito, percentualCredito }
      });
      navigate('/vendas/minhas-vendas');
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  const handleAutorizacaoDesconto = async (autorizadorUserId: string) => {
    if (!user || !tipoAutorizacaoNecessaria) return;
    
    setAutorizadorId(autorizadorUserId);
    
    try {
      const validacao = validarDesconto(
        produtosComDesconto,
        formData.forma_pagamento,
        formData.venda_presencial
      );

      await createVenda({ 
        vendaData: {
          ...formData,
          forma_pagamento: pagamentoData.metodos[0]?.tipo || '',
          data_venda: new Date().toISOString(),
        },
        portas: produtosComDesconto,
        pagamentoData,
        autorizacaoDesconto: {
          autorizado_por: autorizadorUserId,
          solicitado_por: user.id,
          percentual_desconto: validacao.percentualDesconto,
          senha_usada: '1qazxsw2',
          tipo_autorizacao: tipoAutorizacaoNecessaria
        },
        creditoVenda: { valorCredito: 0, percentualCredito: 0 }
      });
      navigate('/vendas/minhas-vendas');
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  // Classes minimalistas para Cards
  const cardClass = "bg-primary/5 border-primary/10 backdrop-blur-xl";
  const labelClass = "text-xs font-medium text-white/80";
  const inputClass = "bg-primary/5 border-primary/10 text-white placeholder:text-white/40";

  return (
    <MinimalistLayout 
      title="Nova Venda" 
      subtitle={isFromOrcamento ? `Convertido do Orçamento #${orcamentoData?.numero_orcamento || orcamentoId?.slice(-8).toUpperCase()}` : undefined}
      backPath="/vendas/minhas-vendas"
    >
      {isLoadingOrcamento && orcamentoId && (
        <div className="text-center py-8 text-white/60">
          Carregando dados do orçamento...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente - Buscar ou Cadastrar */}
        <ClienteVendaSection
          dados={{
            cliente_nome: formData.cliente_nome,
            cliente_telefone: formData.cliente_telefone,
            cliente_email: formData.cliente_email,
            cpf_cliente: formData.cpf_cliente,
            estado: formData.estado,
            cidade: formData.cidade,
            cep: formData.cep,
            endereco: formData.endereco,
            bairro: formData.bairro,
            canal_aquisicao_id: formData.canal_aquisicao_id || '',
            publico_alvo: formData.publico_alvo,
          }}
          onChange={(dados) => setFormData(prev => ({ ...prev, ...dados }))}
          onClienteSelecionado={(cliente) => {
            setFormData(prev => ({ ...prev, cliente_id: cliente?.id }));
          }}
          disabled={isFromOrcamento}
        />

        {/* Forma de Pagamento */}
        <PagamentoSection
          paymentData={pagamentoData}
          onChange={setPagamentoData}
          valorTotal={portas.reduce((acc, p) => {
            const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
            const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
            const credito = (p.valor_credito || 0) * (p.quantidade || 1);
            return acc + valorBase - desconto + credito;
          }, 0) + (formData.valor_frete || 0)}
        />

        {/* Dados Adicionais */}
        <Card className={cardClass}>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold text-white">Dados Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4">
            <div className="space-y-1">
              <Label htmlFor="valor_frete" className={labelClass}>Frete (R$)</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_frete}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_frete: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                className={cn("h-9", inputClass)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="data_prevista_entrega" className={labelClass}>Previsão Entrega *</Label>
              <Input
                id="data_prevista_entrega"
                type="date"
                value={formData.data_prevista_entrega}
                onChange={(e) => setFormData(prev => ({ ...prev, data_prevista_entrega: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className={cn("h-9", inputClass)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="valor_entrada" className={labelClass}>Entrada (R$)</Label>
              <Input
                id="valor_entrada"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_entrada}
                onChange={(e) => {
                  const entrada = parseFloat(e.target.value) || 0;
                  const valorTotal = portas.reduce((acc, p) => {
                    const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
                    const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
                    return acc + valorBase - desconto;
                  }, 0) + (formData.valor_frete || 0);
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    valor_entrada: entrada,
                    valor_a_receber: valorTotal - entrada
                  }));
                }}
                placeholder="0,00"
                className={cn("h-9", inputClass)}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label className={labelClass}>Tipo de Entrega *</Label>
              <RadioGroup
                value={formData.tipo_entrega}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_entrega: value }))}
                className="grid grid-cols-2 gap-3"
                required
              >
                <label
                  htmlFor="tipo-instalacao"
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                    "hover:scale-[1.02] hover:shadow-md",
                    formData.tipo_entrega === "instalacao"
                      ? "border-primary bg-primary/20 text-primary font-medium"
                      : "border-primary/20 bg-primary/5 hover:border-primary/50 text-white/80"
                  )}
                >
                  <RadioGroupItem value="instalacao" id="tipo-instalacao" className="sr-only" />
                  <span className="text-sm">🔧 Instalação</span>
                </label>
                <label
                  htmlFor="tipo-entrega"
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                    "hover:scale-[1.02] hover:shadow-md",
                    formData.tipo_entrega === "entrega"
                      ? "border-primary bg-primary/20 text-primary font-medium"
                      : "border-primary/20 bg-primary/5 hover:border-primary/50 text-white/80"
                  )}
                >
                  <RadioGroupItem value="entrega" id="tipo-entrega" className="sr-only" />
                  <span className="text-sm">🚚 Entrega</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="observacoes_venda" className={labelClass}>Observações</Label>
              <Textarea
                id="observacoes_venda"
                value={formData.observacoes_venda}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_venda: e.target.value }))}
                rows={2}
                placeholder="Informações adicionais"
                className={cn("resize-none", inputClass)}
              />
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center space-x-2 p-2.5 border rounded-md border-primary/10 bg-primary/5">
                <Checkbox 
                  id="venda_presencial"
                  checked={formData.venda_presencial}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, venda_presencial: checked as boolean }))}
                />
                <Label htmlFor="venda_presencial" className="cursor-pointer flex-1 text-xs text-white/80">
                  <span className="font-medium">Venda Presencial</span>
                  <span className="text-white/60 ml-1.5">(+5% limite de desconto)</span>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card className={cardClass}>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold text-white">Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                type="button"
                size="sm"
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('porta_enrolar');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Porta de Enrolar
              </Button>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                className="border-primary/30 text-white hover:bg-primary/10"
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('porta_social');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Porta Social
              </Button>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                className="border-primary/30 text-white hover:bg-primary/10"
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('pintura_epoxi');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Pintura Eletrostática
              </Button>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                className="border-primary/30 text-white hover:bg-primary/10"
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('manutencao');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Serviço
              </Button>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                className="border-primary/30 text-white hover:bg-primary/10"
                onClick={() => setAcessoriosModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Catálogo
              </Button>
            </div>
            
            <ProdutoVendaForm 
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial(undefined);
                }
              }}
              tipoInicial={tipoInicial}
              permitirTrocaTipo={permitirTrocaTipo}
              onAddProduto={(produto) => {
                handleAddPorta(produto);
                setDialogOpen(false);
              }}
              produtoEditando={produtoEditando}
              indexEditando={indexEditando}
            />
            
            <SelecionarAcessoriosModal
              open={acessoriosModalOpen}
              onOpenChange={setAcessoriosModalOpen}
              onConfirm={handleAddAcessorios}
            />
            
            <ProdutosVendaTable
              produtos={portas}
              onRemoveProduto={handleRemovePorta}
              onEditProduto={handleEditPorta}
              onUpdateQuantidade={handleUpdateQuantidade}
              onRemoverDesconto={handleRemoverDesconto}
            />
          </CardContent>
        </Card>

        {/* Resumo */}
        {portas.length > 0 && (
          <>
            <VendaResumo 
              produtos={portas} 
              valorFrete={formData.valor_frete} 
              valorCredito={valorCredito}
              percentualCredito={percentualCredito}
              onRemoverCredito={() => {
                setValorCredito(0);
                setPercentualCredito(0);
                recalcularValorTotal(portas, 0);
              }}
            />
            
            {/* Indicador de Autorização Necessária */}
            {(() => {
              const validacao = validarDesconto(portas, formData.forma_pagamento, formData.venda_presencial);
              const tipoAutorizacao = getTipoAutorizacaoNecessaria(validacao);
              
              if (validacao.dentroDoLimite) {
                return (
                  <Card className="border-green-500/30 bg-green-500/10">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-300">Venda Dentro do Limite</p>
                          <p className="text-xs text-green-400/80">
                            Desconto: {validacao.percentualDesconto.toFixed(1)}% (limite: {validacao.limitePermitido.toFixed(0)}%)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              if (tipoAutorizacao === 'responsavel_setor') {
                return (
                  <Card className="border-amber-500/30 bg-amber-500/10">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-300">Autorização do Líder Necessária</p>
                          <p className="text-xs text-amber-400/80">
                            Desconto: {validacao.percentualDesconto.toFixed(1)}% (excede {validacao.excedente.toFixed(1)}%, limite: {validacao.limitePermitido.toFixed(0)}%)
                          </p>
                        </div>
                        <Badge className="bg-amber-500 text-xs h-5">Responsável</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              if (tipoAutorizacao === 'master') {
                return (
                  <Card className="border-orange-500/30 bg-orange-500/10">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20">
                          <ShieldCheck className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-orange-300">Autorização Master Necessária</p>
                          <p className="text-xs text-orange-400/80">
                            Desconto: {validacao.percentualDesconto.toFixed(1)}% (excede {validacao.excedente.toFixed(1)}%, limite: {validacao.limitePermitido.toFixed(0)}%)
                          </p>
                        </div>
                        <Badge className="bg-orange-500 text-xs h-5">Master</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              return null;
            })()}
            
            {formData.valor_entrada > 0 && (
              <Card className={cardClass}>
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-white/60 mb-0.5">Valor de Entrada:</p>
                      <p className="text-base font-semibold text-green-400">R$ {formData.valor_entrada.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-0.5">Valor a Receber:</p>
                      <p className="text-base font-semibold text-orange-400">R$ {formData.valor_a_receber?.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-2">
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            onClick={() => navigate('/vendas/minhas-vendas')}
            className="border-primary/30 text-white hover:bg-primary/10"
          >
            Cancelar
          </Button>
          {portas.length > 0 && valorCredito === 0 && (
            <Button 
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDescontoModalOpen(true)}
              className="border-primary/30 text-white hover:bg-primary/10"
            >
              <Percent className="w-3.5 h-3.5 mr-1.5" />
              Adicionar Desconto
            </Button>
          )}
          {portas.length > 0 && validarDesconto(portas, formData.forma_pagamento, formData.venda_presencial).dentroDoLimite && !portas.some(p => (p.desconto_valor || 0) > 0 || (p.desconto_percentual || 0) > 0) && (
            <Button 
              type="button"
              size="sm"
              variant="outline"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              onClick={() => setCreditoModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {valorCredito > 0 ? 'Editar Crédito' : 'Adicionar Crédito'}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isCreating || portas.length === 0}>
            {isCreating ? 'Criando...' : 'Criar Venda'}
          </Button>
        </div>
      </form>

      {/* Modais */}
      <DescontoVendaModal
        open={descontoModalOpen}
        onOpenChange={setDescontoModalOpen}
        produtos={portas}
        onAplicarDesconto={handleAplicarDesconto}
        formaPagamento={formData.forma_pagamento}
        vendaPresencial={formData.venda_presencial}
      />

      <CreditoVendaModal
        open={creditoModalOpen}
        onOpenChange={setCreditoModalOpen}
        valorTotalVenda={recalcularValorTotal(portas, 0) - (formData.valor_frete || 0)}
        temDesconto={portas.some(p => (p.desconto_valor || 0) > 0 || (p.desconto_percentual || 0) > 0)}
        valorCreditoAtual={valorCredito}
        percentualCreditoAtual={percentualCredito}
        onAplicarCredito={handleAplicarCredito}
      />

      {tipoAutorizacaoNecessaria && (
        <AutorizacaoDescontoModal
          open={autorizacaoDescontoOpen}
          onOpenChange={setAutorizacaoDescontoOpen}
          onAutorizado={handleAutorizacaoDesconto}
          percentualDesconto={validarDesconto(portas, formData.forma_pagamento, formData.venda_presencial).percentualDesconto}
          tipoAutorizacao={tipoAutorizacaoNecessaria}
          limitePermitido={limitePermitido}
        />
      )}

      {portaRecemAdicionada && (
        <PinturaRapidaModal
          open={pinturaRapidaOpen}
          onOpenChange={setPinturaRapidaOpen}
          largura={portaRecemAdicionada.largura}
          altura={portaRecemAdicionada.altura}
          onConfirm={handleAddPinturaRapida}
          onSkip={() => setPortaRecemAdicionada(null)}
        />
      )}
    </MinimalistLayout>
  );
}
