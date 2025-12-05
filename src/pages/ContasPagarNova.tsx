import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormaPagamentoSelect, FORMAS_PAGAMENTO } from "@/components/FormaPagamentoSelect";
import { useAuth } from "@/hooks/useAuth";

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

export default function ContasPagarNova() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [descricao, setDescricao] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [empresaPagadoraId, setEmpresaPagadoraId] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("outros");
  const [metodoPagamento, setMetodoPagamento] = useState<string>("");
  const [valorTotal, setValorTotal] = useState<string>("");
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>(addDays(new Date(), 30));
  const [intervalo, setIntervalo] = useState<string>("30");
  const [observacoes, setObservacoes] = useState("");
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Buscar fornecedores
  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar empresas emissoras
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas-emissoras-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_emissoras')
        .select('id, nome, padrao')
        .eq('ativo', true)
        .order('padrao', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Setar empresa padrão quando carregar
  useState(() => {
    if (empresas.length > 0 && !empresaPagadoraId) {
      const padrao = empresas.find(e => e.padrao);
      if (padrao) setEmpresaPagadoraId(padrao.id);
    }
  });

  const criarContasMutation = useMutation({
    mutationFn: async () => {
      if (!descricao || !valorTotal || !dataVencimento) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const valorTotalNum = parseFloat(valorTotal.replace(/\./g, '').replace(',', '.'));
      if (isNaN(valorTotalNum) || valorTotalNum <= 0) {
        throw new Error("Valor total inválido");
      }

      const valorParcela = valorTotalNum / numeroParcelas;
      const grupoId = crypto.randomUUID();
      const intervaloNum = parseInt(intervalo);

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
        const dataVenc = addDays(dataVencimento, i * intervaloNum);
        parcelas.push({
          descricao,
          fornecedor_id: fornecedorId || null,
          fornecedor_nome: fornecedorId ? null : fornecedorNome || null,
          empresa_pagadora_id: empresaPagadoraId || null,
          categoria,
          numero_parcela: i + 1,
          total_parcelas: numeroParcelas,
          valor_parcela: Math.round(valorParcela * 100) / 100,
          data_vencimento: format(dataVenc, 'yyyy-MM-dd'),
          metodo_pagamento: metodoPagamento || null,
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
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: error.message });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    criarContasMutation.mutate();
  };

  const valorTotalNum = parseFloat(valorTotal.replace(/\./g, '').replace(',', '.')) || 0;
  const valorParcela = valorTotalNum / numeroParcelas;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Conta a Pagar</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre uma nova despesa ou conta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra de Alumínio - Jan/2025"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor/Beneficiário</Label>
                <Select value={fornecedorId} onValueChange={(value) => {
                  setFornecedorId(value);
                  if (value) setFornecedorNome("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou digite abaixo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (digitar manualmente)</SelectItem>
                    {fornecedores.map((forn) => (
                      <SelectItem key={forn.id} value={forn.id}>
                        {forn.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(fornecedorId === "none" || !fornecedorId) && (
                  <Input
                    placeholder="Digite o nome do fornecedor"
                    value={fornecedorNome}
                    onChange={(e) => setFornecedorNome(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa Pagadora</Label>
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

              <FormaPagamentoSelect
                value={metodoPagamento}
                onValueChange={setMetodoPagamento}
                showLabel={true}
                placeholder="Selecione o método"
              />
            </CardContent>
          </Card>

          {/* Valores e Parcelas */}
          <Card>
            <CardHeader>
              <CardTitle>Valores e Parcelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valorTotal">Valor Total *</Label>
                <Input
                  id="valorTotal"
                  placeholder="0,00"
                  value={valorTotal}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d,]/g, '');
                    setValorTotal(value);
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parcelas">Número de Parcelas</Label>
                  <Input
                    id="parcelas"
                    type="number"
                    min={1}
                    max={48}
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervalo">Intervalo</Label>
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

              <div className="space-y-2">
                <Label>Primeiro Vencimento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataVencimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataVencimento ? format(dataVencimento, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataVencimento}
                      onSelect={setDataVencimento}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {valorTotalNum > 0 && numeroParcelas > 0 && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm font-medium mb-2">Preview das parcelas:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Array.from({ length: Math.min(numeroParcelas, 6) }).map((_, i) => {
                      const dataVenc = dataVencimento ? addDays(dataVencimento, i * parseInt(intervalo)) : null;
                      return (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{i + 1}ª parcela</span>
                          <span className="flex gap-4">
                            <span className="text-muted-foreground">
                              {dataVenc ? format(dataVenc, 'dd/MM/yyyy') : '-'}
                            </span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorParcela)}
                            </span>
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

          {/* Anexos e Observações */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Anexos e Observações</CardTitle>
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
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setNotaFiscalFile(null)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  {notaFiscalFile && (
                    <p className="text-xs text-muted-foreground">
                      Arquivo selecionado: {notaFiscalFile.name}
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
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={criarContasMutation.isPending || uploading}>
            {(criarContasMutation.isPending || uploading) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Cadastrar Conta
          </Button>
        </div>
      </form>
    </div>
  );
}
