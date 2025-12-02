import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendas, VendaFormData, ProdutoVenda } from '@/hooks/useVendas';
import { useCanaisAquisicao } from '@/hooks/useCanaisAquisicao';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, CalendarIcon, Percent, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ESTADOS_BRASIL, getCidadesPorEstado } from '@/utils/estadosCidades';
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
import { validarDesconto, getTipoAutorizacaoNecessaria } from '@/utils/descontoVendasRules';
import { validarCredito } from '@/utils/creditoVendasRules';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { PagamentoSection, PagamentoData } from '@/components/vendas/PagamentoSection';
// FormaPagamentoSelect substituído por PagamentoSection

export default function VendasNova() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createVenda, isCreating } = useVendas();
  const { canais } = useCanaisAquisicao();
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
  const [dataVenda, setDataVenda] = useState<Date>();
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

  // Estado para pagamento
  const [pagamentoData, setPagamentoData] = useState<PagamentoData>({
    metodo_pagamento: '',
    empresa_receptora_id: '',
    quantidade_parcelas: 1,
    intervalo_boletos: 30,
    pago_na_instalacao: false,
    parcelas_dinheiro: 1,
    valor_entrada_dinheiro: 0,
    restante_na_instalacao: false,
    comprovante_file: null
  });

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

  const handleAddPorta = (produto: ProdutoVenda) => {
    setPortas(prev => {
      let newPortas;
      
      // Se está editando, substitui o produto na posição correta
      if (indexEditando !== undefined) {
        newPortas = [...prev];
        newPortas[indexEditando] = produto;
      } else {
        // Caso contrário, adiciona um novo produto
        newPortas = [...prev, produto];
      }
      
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        const credito = (p.valor_credito || 0) * (p.quantidade || 1);
        return acc + valorBase - desconto + credito;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      // Limpar estado de edição
      setProdutoEditando(undefined);
      setIndexEditando(undefined);
      
      return newPortas;
    });
  };

  const handleAddAcessorios = (produtos: ProdutoVenda[]) => {
    setPortas(prev => {
      const newPortas = [...prev, ...produtos];
      
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        const credito = (p.valor_credito || 0) * (p.quantidade || 1);
        return acc + valorBase - desconto + credito;
      }, 0) + (formData.valor_frete || 0);
      
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
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        const credito = (p.valor_credito || 0) * (p.quantidade || 1);
        return acc + valorBase - desconto + credito;
      }, 0) + (formData.valor_frete || 0);
      
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
      
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        const credito = (p.valor_credito || 0) * (p.quantidade || 1);
        return acc + valorBase - desconto + credito;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
  };

  const handleAplicarDesconto = (produtosAtualizados: ProdutoVenda[]) => {
    setPortas(produtosAtualizados);
    
    // Recalcular valores
    const valorTotal = produtosAtualizados.reduce((acc, p) => {
      const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
      const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
      const credito = (p.valor_credito || 0) * (p.quantidade || 1);
      return acc + valorBase - desconto + credito;
    }, 0) + (formData.valor_frete || 0);
    
    setFormData(prev => ({
      ...prev,
      valor_a_receber: valorTotal - (prev.valor_entrada || 0)
    }));
  };

  const handleAplicarCredito = (produtosAtualizados: ProdutoVenda[]) => {
    setPortas(produtosAtualizados);
    
    // Recalcular valores
    const valorTotal = produtosAtualizados.reduce((acc, p) => {
      const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
      const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
      const credito = (p.valor_credito || 0) * (p.quantidade || 1);
      return acc + valorBase - desconto + credito;
    }, 0) + (formData.valor_frete || 0);
    
    setFormData(prev => ({
      ...prev,
      valor_a_receber: valorTotal - (prev.valor_entrada || 0)
    }));
  };

  const handleRemoverDesconto = (index: number) => {
    setPortas(prev => {
      const newPortas = [...prev];
      newPortas[index] = {
        ...newPortas[index],
        desconto_valor: 0,
        desconto_percentual: 0
      };
      
      // Recalcular valores
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        const credito = (p.valor_credito || 0) * (p.quantidade || 1);
        return acc + valorBase - desconto + credito;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
    
    toast({ title: "Desconto removido com sucesso" });
  };

  const handleRemoverCredito = (index: number) => {
    setPortas(prev => {
      const newPortas = [...prev];
      newPortas[index] = {
        ...newPortas[index],
        valor_credito: 0,
        percentual_credito: 0
      };
      
      // Recalcular valores
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        const credito = (p.valor_credito || 0) * (p.quantidade || 1);
        return acc + valorBase - desconto + credito;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
    
    toast({ title: "Crédito removido com sucesso" });
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

    // Validar localização obrigatória para emissão de NF-e
    if (!formData.estado || !formData.cidade || !formData.cep || !formData.bairro || !formData.endereco) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Todos os campos de localização são obrigatórios (Estado, Cidade, CEP, Bairro e Endereço).'
      });
      return;
    }

    // Validar tamanho mínimo de endereço e bairro (requisito SEFAZ)
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

    // Validar CPF/CNPJ
    const documentoDigitos = formData.cpf_cliente?.replace(/\D/g, '') || '';
    if (documentoDigitos && documentoDigitos.length !== 11 && documentoDigitos.length !== 14) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Documento inválido. Digite um CPF (11 dígitos) ou CNPJ (14 dígitos).'
      });
      return;
    }

    // Validar desconto
    const validacao = validarDesconto(
      portas,
      formData.forma_pagamento,
      formData.venda_presencial
    );

    // Verificar se precisa autorização
    const tipoAutorizacao = getTipoAutorizacaoNecessaria(validacao);
    if (tipoAutorizacao) {
      setProdutosComDesconto(portas);
      setTipoAutorizacaoNecessaria(tipoAutorizacao);
      setLimitePermitido(validacao.limitePermitido);
      setAutorizacaoDescontoOpen(true);
      return;
    }

    // Se está dentro do limite, criar venda normalmente
    try {
      await createVenda({ 
        vendaData: {
          ...formData,
          forma_pagamento: pagamentoData.metodo_pagamento,
          // Usar a data selecionada ou a data atual
          data_venda: dataVenda ? dataVenda.toISOString() : new Date().toISOString(),
        }, 
        portas,
        pagamentoData
      });
      navigate('/dashboard/vendas');
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
          forma_pagamento: pagamentoData.metodo_pagamento,
          data_venda: dataVenda ? dataVenda.toISOString() : new Date().toISOString(),
        }, 
        portas: produtosComDesconto,
        pagamentoData,
        autorizacaoDesconto: {
          autorizado_por: autorizadorUserId,
          solicitado_por: user.id,
          percentual_desconto: validacao.percentualDesconto,
          senha_usada: '1qazxsw2',
          tipo_autorizacao: tipoAutorizacaoNecessaria
        }
      });
      navigate('/dashboard/vendas');
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  const cidades = formData.estado ? getCidadesPorEstado(formData.estado) : [];

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-7xl">
      <div className="flex items-center gap-3 pb-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/vendas')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold">Nova Venda</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dados do Cliente */}
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
            <div className="space-y-1">
              <Label htmlFor="cliente_nome" className="text-xs font-medium">Nome *</Label>
              <Input
                id="cliente_nome"
                value={formData.cliente_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                placeholder="Nome completo"
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente_telefone" className="text-xs font-medium">Telefone *</Label>
              <Input
                id="cliente_telefone"
                value={formData.cliente_telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente_email" className="text-xs font-medium">E-mail</Label>
              <Input
                id="cliente_email"
                type="email"
                value={formData.cliente_email}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cpf_cliente" className="text-xs font-medium">CPF/CNPJ *</Label>
              <Input
                id="cpf_cliente"
                value={formData.cpf_cliente}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 11) {
                    // Máscara CPF: 000.000.000-00
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                  } else {
                    // Máscara CNPJ: 00.000.000/0000-00
                    value = value.replace(/(\d{2})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1/$2');
                    value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
                  }
                  setFormData(prev => ({ ...prev, cpf_cliente: value }));
                }}
                placeholder="CPF ou CNPJ"
                className="h-9"
                maxLength={18}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold">Localização</CardTitle>
            <CardDescription className="text-xs">Todos os campos são obrigatórios para emissão de NF-e</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            <div className="space-y-1">
              <Label htmlFor="estado" className="text-xs font-medium">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value, cidade: '' }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map(estado => (
                    <SelectItem key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cidade" className="text-xs font-medium">Cidade *</Label>
              <Select
                value={formData.cidade}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cidade: value }))}
                required
                disabled={!formData.estado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cidades.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cep" className="text-xs font-medium">CEP *</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 5) {
                    value = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
                  }
                  setFormData(prev => ({ ...prev, cep: value }));
                }}
                placeholder="00000-000"
                className="h-9"
                maxLength={9}
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="endereco" className="text-xs font-medium">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Ex: Rua das Flores, 123"
                className="h-9"
                minLength={2}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bairro" className="text-xs font-medium">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                placeholder="Nome do bairro"
                className="h-9"
                minLength={2}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados da Venda */}
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold">Dados da Venda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            <div className="space-y-1">
              <Label htmlFor="data_venda" className="text-xs font-medium">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !dataVenda && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dataVenda ? format(dataVenda, "dd/MM/yyyy", { locale: ptBR }) : <span>Hoje</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataVenda}
                    onSelect={setDataVenda}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label htmlFor="publico_alvo" className="text-xs font-medium">Público *</Label>
              <Select
                value={formData.publico_alvo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, publico_alvo: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente_final">Cliente Final</SelectItem>
                  <SelectItem value="serralheiro">Serralheiro</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="canal_aquisicao_id" className="text-xs font-medium">Canal *</Label>
              <Select
                value={formData.canal_aquisicao_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, canal_aquisicao_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  {canais.map((canal) => (
                    <SelectItem key={canal.id} value={canal.id}>
                      {canal.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* Forma de Pagamento */}
        <PagamentoSection
          pagamentoData={pagamentoData}
          onChange={setPagamentoData}
          tipoEntrega={formData.tipo_entrega || 'instalacao'}
          vendaPresencial={formData.venda_presencial || false}
          dataVenda={dataVenda}
          valorTotal={portas.reduce((acc, p) => {
            const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
            const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
            const credito = (p.valor_credito || 0) * (p.quantidade || 1);
            return acc + valorBase - desconto + credito;
          }, 0) + (formData.valor_frete || 0)}
        />

        {/* Dados Adicionais */}
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold">Dados Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4">

            <div className="space-y-1">
              <Label htmlFor="valor_frete" className="text-xs font-medium">Frete (R$)</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_frete}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_frete: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="data_prevista_entrega" className="text-xs font-medium">Previsão Entrega *</Label>
              <Input
                id="data_prevista_entrega"
                type="date"
                value={formData.data_prevista_entrega}
                onChange={(e) => setFormData(prev => ({ ...prev, data_prevista_entrega: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="valor_entrada" className="text-xs font-medium">Entrada (R$)</Label>
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
                className="h-9"
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label className="text-xs font-medium">Tipo de Entrega *</Label>
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
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background hover:border-primary/50"
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
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="entrega" id="tipo-entrega" className="sr-only" />
                  <span className="text-sm">🚚 Entrega</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="observacoes_venda" className="text-xs font-medium">Observações</Label>
              <Textarea
                id="observacoes_venda"
                value={formData.observacoes_venda}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_venda: e.target.value }))}
                rows={2}
                placeholder="Informações adicionais"
                className="resize-none"
              />
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center space-x-2 p-2.5 border rounded-md bg-muted/20">
                <Checkbox 
                  id="venda_presencial"
                  checked={formData.venda_presencial}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, venda_presencial: checked as boolean }))}
                />
                <Label htmlFor="venda_presencial" className="cursor-pointer flex-1 text-xs">
                  <span className="font-medium">Venda Presencial</span>
                  <span className="text-muted-foreground ml-1.5">(+5% limite de desconto)</span>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold">Produtos</CardTitle>
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
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('manutencao');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Manutenção
              </Button>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAcessoriosModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Acessório/Adicional
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
                  onRemoverCredito={handleRemoverCredito}
                />
          </CardContent>
        </Card>

        {/* Resumo */}
        {portas.length > 0 && (
          <>
            <VendaResumo produtos={portas} valorFrete={formData.valor_frete} />
            
            {/* Indicador de Autorização Necessária */}
            {(() => {
              const validacao = validarDesconto(portas, formData.forma_pagamento, formData.venda_presencial);
              const tipoAutorizacao = getTipoAutorizacaoNecessaria(validacao);
              
              if (validacao.dentroDoLimite) {
                return (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-900">Venda Dentro do Limite</p>
                          <p className="text-xs text-green-700">
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
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900">Autorização do Líder Necessária</p>
                          <p className="text-xs text-amber-700">
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
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                          <ShieldCheck className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-orange-900">Autorização Master Necessária</p>
                          <p className="text-xs text-orange-700">
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
              <Card className="bg-muted/30">
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Valor de Entrada:</p>
                      <p className="text-base font-semibold text-green-600">R$ {formData.valor_entrada.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Valor a Receber:</p>
                      <p className="text-base font-semibold text-orange-600">R$ {formData.valor_a_receber?.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" size="sm" variant="outline" onClick={() => navigate('/dashboard/vendas')}>
            Cancelar
          </Button>
          {portas.length > 0 && !validarCredito(portas).totalCredito && (
            <Button 
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDescontoModalOpen(true)}
            >
              <Percent className="w-3.5 h-3.5 mr-1.5" />
              Adicionar Desconto
            </Button>
          )}
          {portas.length > 0 && validarDesconto(portas, formData.forma_pagamento, formData.venda_presencial).dentroDoLimite && (
            <Button 
              type="button"
              size="sm"
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={() => setCreditoModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Adicionar Crédito
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
        produtos={portas}
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
    </div>
  );
}
