import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCanaisAquisicao } from '@/hooks/useCanaisAquisicao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CalendarIcon, Download, Package, Paintbrush, Wrench } from 'lucide-react';
import { ESTADOS_BRASIL, getCidadesPorEstado } from '@/utils/estadosCidades';
import { ProdutoVendaForm } from '@/components/vendas/ProdutoVendaForm';
import { ProdutosOrcamentoTable } from './ProdutosOrcamentoTable';
import { OrcamentoResumo } from './OrcamentoResumo';
import { SelecionarAcessoriosModal } from '@/components/vendas/SelecionarAcessoriosModal';
import { FormaPagamentoSelect } from '@/components/FormaPagamentoSelect';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { generateOrcamentoPDF } from '@/utils/orcamentoPDFGenerator';
import type { OrcamentoFormData } from '@/types/orcamento';
import type { OrcamentoProduto } from '@/types/produto';
import type { ProdutoVenda } from '@/hooks/useVendas';

interface NovoOrcamentoFormProps {
  onSubmit?: (data: OrcamentoFormData, produtos: OrcamentoProduto[], valorTotal: number) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  leadId?: string | null;
  initialData?: any;
  isEdit?: boolean;
}

export function NovoOrcamentoForm({
  onSubmit,
  onCancel,
  loading,
  leadId,
  initialData,
  isEdit
}: NovoOrcamentoFormProps) {
  const { toast } = useToast();
  const { canais } = useCanaisAquisicao();
  
  const [formData, setFormData] = useState<OrcamentoFormData>({
    lead_id: leadId || '',
    cliente_nome: '',
    cliente_cpf: '',
    cliente_telefone: '',
    cliente_email: '',
    cliente_estado: '',
    cliente_cidade: '',
    cliente_bairro: '',
    cliente_cep: '',
    valor_frete: '0',
    publico_alvo: '',
    tipo_entrega: 'instalacao',
    forma_pagamento: '',
    desconto_total_percentual: 0,
    requer_analise: false,
    motivo_analise: '',
    canal_aquisicao_id: '',
    data_orcamento: '',
    observacoes: ''
  });

  const [produtos, setProdutos] = useState<OrcamentoProduto[]>([]);
  const [dataOrcamento, setDataOrcamento] = useState<Date>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acessoriosModalOpen, setAcessoriosModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoVenda | undefined>(undefined);
  const [indexEditando, setIndexEditando] = useState<number | undefined>(undefined);
  const [tipoInicial, setTipoInicial] = useState<'porta_enrolar' | 'porta_social' | 'pintura_epoxi' | 'acessorio' | 'adicional' | 'manutencao' | undefined>(undefined);

  // Carregar dados iniciais se estiver editando
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        lead_id: initialData.lead_id || '',
        cliente_nome: initialData.cliente_nome || '',
        cliente_cpf: initialData.cliente_cpf || '',
        cliente_telefone: initialData.cliente_telefone || '',
        cliente_email: initialData.cliente_email || '',
        cliente_estado: initialData.cliente_estado || '',
        cliente_cidade: initialData.cliente_cidade || '',
        cliente_bairro: initialData.cliente_bairro || '',
        cliente_cep: initialData.cliente_cep || '',
        valor_frete: String(initialData.valor_frete || 0),
        publico_alvo: initialData.publico_alvo || '',
        tipo_entrega: initialData.tipo_entrega || 'instalacao',
        forma_pagamento: initialData.forma_pagamento || '',
        desconto_total_percentual: initialData.desconto_total_percentual || 0,
        requer_analise: initialData.requer_analise || false,
        motivo_analise: initialData.motivo_analise || '',
        canal_aquisicao_id: initialData.canal_aquisicao_id || '',
        data_orcamento: initialData.data_orcamento || '',
        observacoes: initialData.observacoes || ''
      });
      
      if (initialData.produtos) {
        setProdutos(initialData.produtos);
      }
    }
  }, [initialData, isEdit]);

  const handleAddProduto = (produto: ProdutoVenda) => {
    // Normalizar tipo_produto para os tipos permitidos em orçamentos
    let tipoProduto = produto.tipo_produto;
    if (tipoProduto === 'porta') {
      tipoProduto = 'porta_enrolar'; // Converter tipo legado
    }
    
    const orcamentoProduto: OrcamentoProduto = {
      tipo_produto: tipoProduto as 'porta_enrolar' | 'porta_social' | 'acessorio' | 'manutencao' | 'adicional' | 'pintura_epoxi',
      medidas: produto.tamanho,
      largura: produto.largura,
      altura: produto.altura,
      cor_id: produto.cor_id,
      acessorio_id: produto.acessorio_id,
      adicional_id: produto.adicional_id,
      estoque_id: produto.estoque_id,
      descricao: produto.descricao,
      valor: produto.valor_produto,
      quantidade: produto.quantidade || 1,
      preco_instalacao: produto.valor_instalacao || 0,
      valor_pintura: produto.valor_pintura || 0,
      desconto_percentual: produto.tipo_desconto === 'percentual' ? produto.desconto_percentual : 0,
      desconto_valor: produto.tipo_desconto === 'valor' ? produto.desconto_valor : 0,
      tipo_desconto: produto.tipo_desconto || 'percentual',
      tamanho: produto.tamanho
    };

    setProdutos(prev => {
      if (indexEditando !== undefined) {
        const newProdutos = [...prev];
        newProdutos[indexEditando] = orcamentoProduto;
        return newProdutos;
      }
      return [...prev, orcamentoProduto];
    });

    setProdutoEditando(undefined);
    setIndexEditando(undefined);
  };

  const handleAddAcessorios = (produtosVenda: ProdutoVenda[]) => {
    const orcamentoProdutos: OrcamentoProduto[] = produtosVenda.map(produto => {
      // Normalizar tipo_produto
      let tipoProduto = produto.tipo_produto;
      if (tipoProduto === 'porta') {
        tipoProduto = 'porta_enrolar';
      }
      
      return {
        tipo_produto: tipoProduto as 'porta_enrolar' | 'porta_social' | 'acessorio' | 'manutencao' | 'adicional' | 'pintura_epoxi',
        estoque_id: produto.estoque_id,
        descricao: produto.descricao,
        valor: produto.valor_produto,
        quantidade: produto.quantidade || 1,
        tipo_desconto: 'percentual',
        desconto_percentual: 0,
        desconto_valor: 0
      };
    });

    setProdutos(prev => [...prev, ...orcamentoProdutos]);
  };

  const handleEditProduto = (index: number) => {
    const produto = produtos[index];
    
    // Converter OrcamentoProduto para ProdutoVenda
    const produtoVenda: ProdutoVenda = {
      tipo_produto: produto.tipo_produto,
      tamanho: produto.medidas || produto.tamanho || '',
      largura: produto.largura,
      altura: produto.altura,
      cor_id: produto.cor_id || '',
      acessorio_id: produto.acessorio_id || '',
      adicional_id: produto.adicional_id || '',
      estoque_id: produto.estoque_id,
      tipo_pintura: '',
      valor_produto: produto.valor,
      valor_pintura: produto.valor_pintura || 0,
      valor_instalacao: produto.preco_instalacao || 0,
      valor_frete: 0,
      tipo_desconto: produto.tipo_desconto || 'percentual',
      desconto_percentual: produto.desconto_percentual || 0,
      desconto_valor: produto.desconto_valor || 0,
      quantidade: produto.quantidade || 1,
      descricao: produto.descricao || ''
    };

    setProdutoEditando(produtoVenda);
    setIndexEditando(index);
    setDialogOpen(true);
  };

  const handleRemoveProduto = (index: number) => {
    setProdutos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    
    setProdutos(prev => {
      const newProdutos = [...prev];
      newProdutos[index] = { ...newProdutos[index], quantidade: novaQuantidade };
      return newProdutos;
    });
  };

  const handleRemoverDesconto = (index: number) => {
    setProdutos(prev => {
      const newProdutos = [...prev];
      newProdutos[index] = {
        ...newProdutos[index],
        desconto_valor: 0,
        desconto_percentual: 0
      };
      return newProdutos;
    });
    
    toast({ title: "Desconto removido com sucesso" });
  };

  const calcularValorTotal = () => {
    const totalProdutos = produtos.reduce((acc, p) => {
      const valorBase = (p.valor + (p.valor_pintura || 0) + (p.preco_instalacao || 0)) * (p.quantidade || 1);
      const desconto = p.tipo_desconto === 'valor' 
        ? (p.desconto_valor || 0)
        : valorBase * ((p.desconto_percentual || 0) / 100);
      return acc + valorBase - desconto;
    }, 0);

    return totalProdutos + parseFloat(formData.valor_frete || '0');
  };

  const handleDownloadPDF = async () => {
    if (produtos.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Adicione pelo menos um produto antes de gerar o PDF'
      });
      return;
    }

    try {
      await generateOrcamentoPDF({
        ...formData,
        produtos
      }, calcularValorTotal());
      toast({
        title: 'Sucesso',
        description: 'PDF gerado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao gerar PDF'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (produtos.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário adicionar pelo menos um produto'
      });
      return;
    }

    if (!formData.cliente_estado || !formData.cliente_cidade) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Estado e cidade são obrigatórios.'
      });
      return;
    }

    if (formData.requer_analise && !formData.motivo_analise.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Motivo da análise é obrigatório.'
      });
      return;
    }

    const valorTotal = calcularValorTotal();

    if (onSubmit) {
      await onSubmit({
        ...formData,
        data_orcamento: dataOrcamento ? dataOrcamento.toISOString() : new Date().toISOString()
      }, produtos, valorTotal);
    }
  };

  const cidades = formData.cliente_estado ? getCidadesPorEstado(formData.cliente_estado) : [];

  return (
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
            <Label htmlFor="cliente_cpf" className="text-xs font-medium">CPF/CNPJ *</Label>
            <Input
              id="cliente_cpf"
              value={formData.cliente_cpf}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                  value = value.replace(/(\d{3})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                } else {
                  value = value.replace(/(\d{2})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d)/, '$1/$2');
                  value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
                }
                setFormData(prev => ({ ...prev, cliente_cpf: value }));
              }}
              placeholder="000.000.000-00"
              className="h-9"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-base font-semibold">Localização</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
          <div className="space-y-1">
            <Label htmlFor="cliente_estado" className="text-xs font-medium">Estado *</Label>
            <Select
              value={formData.cliente_estado}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, cliente_estado: value, cliente_cidade: '' }));
              }}
              required
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BRASIL.map((estado) => (
                  <SelectItem key={estado.sigla} value={estado.sigla}>
                    {estado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="cliente_cidade" className="text-xs font-medium">Cidade *</Label>
            <Select
              value={formData.cliente_cidade}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_cidade: value }))}
              disabled={!formData.cliente_estado}
              required
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {cidades.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>
                    {cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="cliente_cep" className="text-xs font-medium">CEP</Label>
            <Input
              id="cliente_cep"
              value={formData.cliente_cep}
              onChange={(e) => setFormData(prev => ({ ...prev, cliente_cep: e.target.value }))}
              placeholder="00000-000"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cliente_bairro" className="text-xs font-medium">Bairro</Label>
            <Input
              id="cliente_bairro"
              value={formData.cliente_bairro}
              onChange={(e) => setFormData(prev => ({ ...prev, cliente_bairro: e.target.value }))}
              placeholder="Nome do bairro"
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados do Orçamento */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-base font-semibold">Dados do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Data do Orçamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal",
                      !dataOrcamento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataOrcamento ? format(dataOrcamento, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataOrcamento}
                    onSelect={setDataOrcamento}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label htmlFor="publico_alvo" className="text-xs font-medium">Público Alvo</Label>
              <Select
                value={formData.publico_alvo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, publico_alvo: value }))}
              >
                <SelectTrigger className="h-9">
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
              <Label htmlFor="canal_aquisicao" className="text-xs font-medium">Canal de Aquisição</Label>
              <Select
                value={formData.canal_aquisicao_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, canal_aquisicao_id: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
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

            <div className="space-y-1">
              <Label htmlFor="forma_pagamento" className="text-xs font-medium">Forma de Pagamento *</Label>
              <FormaPagamentoSelect
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="valor_frete" className="text-xs font-medium">Valor do Frete</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_frete}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_frete: e.target.value }))}
                placeholder="0.00"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Tipo de Entrega</Label>
              <RadioGroup
                value={formData.tipo_entrega}
                onValueChange={(value: 'instalacao' | 'entrega') => setFormData(prev => ({ ...prev, tipo_entrega: value }))}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instalacao" id="instalacao" />
                  <Label htmlFor="instalacao" className="cursor-pointer font-normal">Instalação</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entrega" id="entrega" />
                  <Label htmlFor="entrega" className="cursor-pointer font-normal">Entrega</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="observacoes" className="text-xs font-medium">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre o orçamento..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-base font-semibold">Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                setTipoInicial('porta_enrolar');
                setProdutoEditando(undefined);
                setIndexEditando(undefined);
                setDialogOpen(true);
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              Porta de Enrolar
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTipoInicial('porta_social');
                setProdutoEditando(undefined);
                setIndexEditando(undefined);
                setDialogOpen(true);
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              Porta Social
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTipoInicial('pintura_epoxi');
                setProdutoEditando(undefined);
                setIndexEditando(undefined);
                setDialogOpen(true);
              }}
            >
              <Paintbrush className="w-4 h-4 mr-2" />
              Pintura Eletrostática
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTipoInicial('manutencao');
                setProdutoEditando(undefined);
                setIndexEditando(undefined);
                setDialogOpen(true);
              }}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Manutenção
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setAcessoriosModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Acessório/Adicional
            </Button>
          </div>

          <ProdutosOrcamentoTable
            produtos={produtos}
            onRemoveProduto={handleRemoveProduto}
            onEditProduto={handleEditProduto}
            onUpdateQuantidade={handleUpdateQuantidade}
            onRemoverDesconto={handleRemoverDesconto}
          />
        </CardContent>
      </Card>

      {/* Resumo e Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OrcamentoResumo 
          produtos={produtos} 
          valorFrete={parseFloat(formData.valor_frete || '0')} 
        />

        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold">Requer Análise?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requer_analise"
                checked={formData.requer_analise}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requer_analise: checked as boolean }))}
              />
              <Label htmlFor="requer_analise" className="cursor-pointer">
                Este orçamento requer análise antes da aprovação
              </Label>
            </div>

            {formData.requer_analise && (
              <div className="space-y-1">
                <Label htmlFor="motivo_analise" className="text-xs font-medium">Motivo *</Label>
                <Textarea
                  id="motivo_analise"
                  value={formData.motivo_analise}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo_analise: e.target.value }))}
                  placeholder="Descreva o motivo da análise..."
                  className="min-h-[80px]"
                  required={formData.requer_analise}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={loading || produtos.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>

          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : (isEdit ? 'Atualizar Orçamento' : 'Criar Orçamento')}
          </Button>
        </div>
      </div>

      {/* Modals */}
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
        onAddProduto={handleAddProduto}
        produtoEditando={produtoEditando}
        indexEditando={indexEditando}
        tipoInicial={tipoInicial}
        permitirTrocaTipo={false}
      />

      <SelecionarAcessoriosModal
        open={acessoriosModalOpen}
        onOpenChange={setAcessoriosModalOpen}
        onConfirm={handleAddAcessorios}
      />
    </form>
  );
}