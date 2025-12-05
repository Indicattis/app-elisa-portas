import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Loader2, Plus, Trash2, Check, ChevronsUpDown, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { FornecedorForm } from "@/components/compras/FornecedorForm";
import { useFornecedores, Fornecedor } from "@/hooks/useFornecedores";

const CATEGORIAS = [
  { value: "materia_prima", label: "Matéria-Prima" },
  { value: "servicos", label: "Serviços" },
  { value: "utilidades", label: "Utilidades (Água, Luz, etc)" },
  { value: "impostos", label: "Impostos" },
  { value: "salarios", label: "Salários" },
  { value: "outros", label: "Outros" },
];

const INTERVALOS = [
  { value: "30", label: "30 dias (mensal)" },
  { value: "15", label: "15 dias (quinzenal)" },
  { value: "7", label: "7 dias (semanal)" },
];

interface ItemCompra {
  id: string;
  tipo: 'estoque' | 'manual';
  estoqueId?: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export default function ContasPagarNova() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { fornecedores, createFornecedor, isCreating } = useFornecedores();

  // Seção 1: Fornecedor
  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);
  const [fornecedorFormOpen, setFornecedorFormOpen] = useState(false);
  const [fornecedorComboOpen, setFornecedorComboOpen] = useState(false);

  // Seção 2: Compra
  const [itensCompra, setItensCompra] = useState<ItemCompra[]>([]);
  const [tipoItem, setTipoItem] = useState<'estoque' | 'manual'>('manual');
  const [retiradaPropria, setRetiradaPropria] = useState(false);
  const [valorFrete, setValorFrete] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("materia_prima");

  // Seção 3: Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<string>("");
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>(addDays(new Date(), 30));
  const [intervalo, setIntervalo] = useState<string>("30");
  const [empresaPagadoraId, setEmpresaPagadoraId] = useState<string>("");

  // Seção 4: Anexos
  const [observacoes, setObservacoes] = useState("");
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Buscar produtos do estoque do fornecedor
  const { data: produtosEstoque = [] } = useQuery({
    queryKey: ['estoque-fornecedor', fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return [];
      const { data, error } = await supabase
        .from('estoque')
        .select('id, nome_produto, custo_unitario, quantidade, unidade')
        .eq('fornecedor_id', fornecedorId)
        .eq('ativo', true)
        .order('nome_produto');
      if (error) throw error;
      return data || [];
    },
    enabled: !!fornecedorId
  });

  // Buscar empresas emissoras
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas-emissoras-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_emissoras')
        .select('id, nome, cnpj, padrao')
        .eq('ativo', true)
        .order('padrao', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Setar empresa padrão
  useEffect(() => {
    if (empresas.length > 0 && !empresaPagadoraId) {
      const padrao = empresas.find(e => e.padrao);
      if (padrao) setEmpresaPagadoraId(padrao.id);
    }
  }, [empresas, empresaPagadoraId]);

  // Quando selecionar fornecedor
  useEffect(() => {
    if (fornecedorId && fornecedores) {
      const forn = fornecedores.find(f => f.id === fornecedorId);
      setFornecedorSelecionado(forn || null);
    } else {
      setFornecedorSelecionado(null);
    }
  }, [fornecedorId, fornecedores]);

  // Cálculos
  const subtotalItens = itensCompra.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
  const valorFreteNum = retiradaPropria ? 0 : (parseFloat(valorFrete.replace(/\./g, '').replace(',', '.')) || 0);
  const valorTotal = subtotalItens + valorFreteNum;
  const valorParcela = numeroParcelas > 0 ? valorTotal / numeroParcelas : 0;

  // Funções de itens
  const adicionarItem = () => {
    setItensCompra([...itensCompra, {
      id: crypto.randomUUID(),
      tipo: 'manual',
      descricao: '',
      quantidade: 1,
      valorUnitario: 0
    }]);
  };

  const adicionarItemEstoque = (estoqueId: string) => {
    const produto = produtosEstoque.find(p => p.id === estoqueId);
    if (!produto) return;
    
    // Verificar se já existe
    if (itensCompra.some(item => item.estoqueId === estoqueId)) {
      toast({ variant: "destructive", title: "Produto já adicionado" });
      return;
    }

    setItensCompra([...itensCompra, {
      id: crypto.randomUUID(),
      tipo: 'estoque',
      estoqueId,
      descricao: produto.nome_produto,
      quantidade: 1,
      valorUnitario: produto.custo_unitario || 0
    }]);
  };

  const removerItem = (id: string) => {
    setItensCompra(itensCompra.filter(item => item.id !== id));
  };

  const atualizarItem = (id: string, campo: keyof ItemCompra, valor: any) => {
    setItensCompra(itensCompra.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  // Criar fornecedor
  const handleCriarFornecedor = async (data: any) => {
    const novoFornecedor = await createFornecedor(data);
    if (novoFornecedor) {
      setFornecedorId(novoFornecedor.id);
      setFornecedorFormOpen(false);
      toast({ title: "Fornecedor cadastrado!" });
    }
  };

  // Mutation para criar contas
  const criarContasMutation = useMutation({
    mutationFn: async () => {
      if (itensCompra.length === 0) {
        throw new Error("Adicione pelo menos um item");
      }
      if (!metodoPagamento) {
        throw new Error("Selecione a forma de pagamento");
      }
      if (!dataVencimento) {
        throw new Error("Selecione a data de vencimento");
      }

      const grupoId = crypto.randomUUID();
      const intervaloNum = parseInt(intervalo);

      // Gerar descrição
      const descricaoItens = itensCompra.map(i => i.descricao).join(', ');
      const descricao = fornecedorSelecionado 
        ? `Compra - ${fornecedorSelecionado.nome} - ${descricaoItens.substring(0, 100)}`
        : `Compra - ${descricaoItens.substring(0, 100)}`;

      // Upload da nota fiscal se houver
      let notaFiscalUrl = null;
      let notaFiscalNome = null;

      if (notaFiscalFile) {
        setUploading(true);
        const fileExt = notaFiscalFile.name.split('.').pop();
        const fileName = `${grupoId}_nf_${Date.now()}.${fileExt}`;
        const filePath = `notas-fiscais/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contas-pagar')
          .upload(filePath, notaFiscalFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contas-pagar')
          .getPublicUrl(filePath);

        notaFiscalUrl = publicUrl;
        notaFiscalNome = notaFiscalFile.name;
        setUploading(false);
      }

      // Criar parcelas
      const parcelas = [];
      for (let i = 0; i < numeroParcelas; i++) {
        let dataVenc: Date;
        
        if (metodoPagamento === 'a_vista' || metodoPagamento === 'dinheiro') {
          dataVenc = dataVencimento;
        } else if (metodoPagamento === 'cartao_credito') {
          dataVenc = addDays(dataVencimento, i * 30);
        } else {
          dataVenc = addDays(dataVencimento, i * intervaloNum);
        }

        parcelas.push({
          descricao,
          fornecedor_id: fornecedorId || null,
          fornecedor_nome: null,
          empresa_pagadora_id: empresaPagadoraId || null,
          categoria,
          numero_parcela: i + 1,
          total_parcelas: numeroParcelas,
          valor_parcela: Math.round(valorParcela * 100) / 100,
          data_vencimento: format(dataVenc, 'yyyy-MM-dd'),
          metodo_pagamento: metodoPagamento,
          status: 'pendente',
          nota_fiscal_url: notaFiscalUrl,
          nota_fiscal_nome: notaFiscalNome,
          observacoes: observacoes || null,
          grupo_id: grupoId,
          created_by: user?.id || null
        });
      }

      const { error } = await supabase
        .from('contas_pagar')
        .insert(parcelas);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({ title: "Conta cadastrada com sucesso!" });
      navigate('/dashboard/administrativo/financeiro/contas-a-pagar');
    },
    onError: (error: Error) => {
      setUploading(false);
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: error.message });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    criarContasMutation.mutate();
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Conta a Pagar</h1>
          <p className="text-muted-foreground mt-1">Cadastre uma nova despesa ou compra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Informações do Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
              Informações do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Fornecedor</Label>
                <Popover open={fornecedorComboOpen} onOpenChange={setFornecedorComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={fornecedorComboOpen}
                      className="w-full justify-between font-normal"
                    >
                      {fornecedorSelecionado?.nome || "Selecione um fornecedor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar fornecedor..." />
                      <CommandList>
                        <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                        <CommandGroup>
                          {fornecedores?.map((forn) => (
                            <CommandItem
                              key={forn.id}
                              value={forn.nome}
                              onSelect={() => {
                                setFornecedorId(forn.id);
                                setFornecedorComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  fornecedorId === forn.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {forn.nome}
                              {forn.cnpj && <span className="ml-2 text-xs text-muted-foreground">({forn.cnpj})</span>}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={() => setFornecedorFormOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {fornecedorSelecionado && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <Input value={fornecedorSelecionado.nome} disabled className="bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Input value={fornecedorSelecionado.tipo === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'} disabled className="bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">CNPJ/CPF</Label>
                  <Input value={fornecedorSelecionado.cnpj || '-'} disabled className="bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Responsável</Label>
                  <Input value={fornecedorSelecionado.responsavel || '-'} disabled className="bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cidade</Label>
                  <Input value={fornecedorSelecionado.cidade || '-'} disabled className="bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <Input value={fornecedorSelecionado.estado || '-'} disabled className="bg-background" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção 2: Informações da Compra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
              Informações da Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Adicionar itens */}
            <div className="flex flex-wrap gap-2">
              {fornecedorId && produtosEstoque.length > 0 && (
                <Select onValueChange={adicionarItemEstoque}>
                  <SelectTrigger className="w-[280px]">
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Adicionar do estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtosEstoque.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id}>
                        {prod.nome_produto} - {formatCurrency(prod.custo_unitario || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" variant="outline" onClick={adicionarItem}>
                <Wrench className="h-4 w-4 mr-2" />
                Adicionar Serviço/Produto Manual
              </Button>
            </div>

            {/* Tabela de itens */}
            {itensCompra.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Produto/Serviço</TableHead>
                    <TableHead className="w-[15%]">Qtd</TableHead>
                    <TableHead className="w-[20%]">Valor Unit.</TableHead>
                    <TableHead className="w-[15%]">Total</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensCompra.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.tipo === 'estoque' ? (
                          <Input value={item.descricao} disabled className="bg-muted/30" />
                        ) : (
                          <Input
                            placeholder="Descrição do item"
                            value={item.descricao}
                            onChange={(e) => atualizarItem(item.id, 'descricao', e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantidade}
                          onChange={(e) => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.valorUnitario}
                          onChange={(e) => atualizarItem(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.quantidade * item.valorUnitario)}
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removerItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Frete */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  id="retirada"
                  checked={retiradaPropria}
                  onCheckedChange={(checked) => setRetiradaPropria(checked === true)}
                />
                <Label htmlFor="retirada" className="cursor-pointer">Retirada própria (sem frete)</Label>
              </div>

              {!retiradaPropria && (
                <div className="w-48">
                  <Label>Valor do Frete</Label>
                  <Input
                    placeholder="0,00"
                    value={valorFrete}
                    onChange={(e) => setValorFrete(e.target.value.replace(/[^\d,]/g, ''))}
                  />
                </div>
              )}
            </div>

            {/* Resumo */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotalItens)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frete:</span>
                <span>{formatCurrency(valorFreteNum)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(valorTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Forma de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
              Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="a_vista">PIX / À Vista</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empresa Pagadora</Label>
                <Select value={empresaPagadoraId} onValueChange={setEmpresaPagadoraId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome} {emp.padrao && "(Padrão)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos condicionais baseados na forma de pagamento */}
            {metodoPagamento === 'boleto' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={48}
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>1º Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataVencimento && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataVencimento ? format(dataVencimento, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dataVencimento} onSelect={setDataVencimento} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Intervalo</Label>
                  <Select value={intervalo} onValueChange={setIntervalo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVALOS.map((int) => (
                        <SelectItem key={int.value} value={int.value}>
                          {int.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {metodoPagamento === 'cartao_credito' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label>Número de Parcelas (máx. 12)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(Math.min(12, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>1º Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataVencimento && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataVencimento ? format(dataVencimento, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dataVencimento} onSelect={setDataVencimento} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {(metodoPagamento === 'a_vista' || metodoPagamento === 'dinheiro') && (
              <div className="w-full md:w-1/3 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label>Data do Pagamento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataVencimento && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataVencimento ? format(dataVencimento, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dataVencimento} onSelect={setDataVencimento} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Preview das parcelas */}
            {metodoPagamento && valorTotal > 0 && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-sm font-medium mb-2">Preview das parcelas:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Array.from({ length: Math.min(numeroParcelas, 6) }).map((_, i) => {
                    let dataVenc: Date | null = null;
                    if (dataVencimento) {
                      if (metodoPagamento === 'a_vista' || metodoPagamento === 'dinheiro') {
                        dataVenc = dataVencimento;
                      } else if (metodoPagamento === 'cartao_credito') {
                        dataVenc = addDays(dataVencimento, i * 30);
                      } else {
                        dataVenc = addDays(dataVencimento, i * parseInt(intervalo));
                      }
                    }
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{i + 1}ª parcela</span>
                        <span className="flex gap-4">
                          <span className="text-muted-foreground">
                            {dataVenc ? format(dataVenc, 'dd/MM/yyyy') : '-'}
                          </span>
                          <span className="font-medium">{formatCurrency(valorParcela)}</span>
                        </span>
                      </div>
                    );
                  })}
                  {numeroParcelas > 6 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      ... e mais {numeroParcelas - 6} parcela(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção 4: Anexos e Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
              Anexos e Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notaFiscal">Nota Fiscal (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="notaFiscal"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.xml"
                    onChange={(e) => setNotaFiscalFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {notaFiscalFile && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setNotaFiscalFile(null)}>
                      Remover
                    </Button>
                  )}
                </div>
                {notaFiscalFile && (
                  <p className="text-xs text-muted-foreground">
                    Arquivo: {notaFiscalFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={criarContasMutation.isPending || uploading || itensCompra.length === 0}>
            {(criarContasMutation.isPending || uploading) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Cadastrar Conta
          </Button>
        </div>
      </form>

      {/* Modal de Fornecedor */}
      <FornecedorForm
        open={fornecedorFormOpen}
        onOpenChange={setFornecedorFormOpen}
        onSubmit={handleCriarFornecedor}
        isSubmitting={isCreating}
      />
    </div>
  );
}
