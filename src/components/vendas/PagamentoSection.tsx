import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, X, CreditCard, Banknote, QrCode, Wallet } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PagamentoData {
  metodo_pagamento: 'boleto' | 'a_vista' | 'cartao_credito' | 'dinheiro' | '';
  empresa_receptora_id: string;
  quantidade_parcelas: number;
  intervalo_boletos: number;
  pago_na_instalacao: boolean;
  parcelas_dinheiro: 1 | 2;
  valor_entrada_dinheiro: number;
  restante_na_instalacao: boolean;
  comprovante_file: File | null;
}

interface PagamentoSectionProps {
  pagamentoData: PagamentoData;
  onChange: (data: PagamentoData) => void;
  tipoEntrega: string;
  vendaPresencial: boolean;
  dataVenda: Date | undefined;
  valorTotal: number;
}

export function PagamentoSection({
  pagamentoData,
  onChange,
  tipoEntrega,
  vendaPresencial,
  dataVenda,
  valorTotal
}: PagamentoSectionProps) {
  const [previewVencimentos, setPreviewVencimentos] = useState<string[]>([]);

  // Buscar empresas emissoras
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas-emissoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_emissoras')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  // Calcular preview de vencimentos para boleto
  useEffect(() => {
    if (pagamentoData.metodo_pagamento === 'boleto' && dataVenda && pagamentoData.quantidade_parcelas > 0 && pagamentoData.intervalo_boletos > 0) {
      const vencimentos: string[] = [];
      for (let i = 1; i <= pagamentoData.quantidade_parcelas; i++) {
        const dataVenc = addDays(dataVenda, pagamentoData.intervalo_boletos * i);
        vencimentos.push(format(dataVenc, "dd/MM/yyyy", { locale: ptBR }));
      }
      setPreviewVencimentos(vencimentos);
    } else {
      setPreviewVencimentos([]);
    }
  }, [pagamentoData.metodo_pagamento, pagamentoData.quantidade_parcelas, pagamentoData.intervalo_boletos, dataVenda]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange({ ...pagamentoData, comprovante_file: file });
  };

  const handleRemoveFile = () => {
    onChange({ ...pagamentoData, comprovante_file: null });
  };

  const calcularValorParcela = () => {
    if (pagamentoData.metodo_pagamento === 'boleto') {
      return valorTotal / pagamentoData.quantidade_parcelas;
    }
    if (pagamentoData.metodo_pagamento === 'cartao_credito') {
      return valorTotal / pagamentoData.quantidade_parcelas;
    }
    if (pagamentoData.metodo_pagamento === 'dinheiro' && pagamentoData.parcelas_dinheiro === 2) {
      return valorTotal - pagamentoData.valor_entrada_dinheiro;
    }
    return valorTotal;
  };

  return (
    <Card>
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-base font-semibold">Forma de Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção do Método de Pagamento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...pagamentoData, metodo_pagamento: 'boleto' })}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              pagamentoData.metodo_pagamento === 'boleto' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Banknote className="h-6 w-6" />
            <span className="text-sm font-medium">Boleto</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...pagamentoData, metodo_pagamento: 'a_vista' })}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              pagamentoData.metodo_pagamento === 'a_vista' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <QrCode className="h-6 w-6" />
            <span className="text-sm font-medium">À Vista</span>
            <span className="text-xs text-muted-foreground">PIX, Débito</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...pagamentoData, metodo_pagamento: 'cartao_credito' })}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              pagamentoData.metodo_pagamento === 'cartao_credito' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-sm font-medium">Cartão Crédito</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...pagamentoData, metodo_pagamento: 'dinheiro' })}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              pagamentoData.metodo_pagamento === 'dinheiro' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            } ${vendaPresencial ? 'ring-2 ring-yellow-500/50' : ''}`}
          >
            <Wallet className="h-6 w-6" />
            <span className="text-sm font-medium">Dinheiro</span>
            {vendaPresencial && <span className="text-xs text-yellow-600">Recomendado</span>}
          </button>
        </div>

        {vendaPresencial && pagamentoData.metodo_pagamento !== 'dinheiro' && pagamentoData.metodo_pagamento !== '' && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              ⚠️ Para vendas presenciais, é recomendado usar pagamento em dinheiro.
            </p>
          </div>
        )}

        {/* Opções específicas por método */}
        {pagamentoData.metodo_pagamento === 'boleto' && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantidade de Boletos *</Label>
                <Select 
                  value={pagamentoData.quantidade_parcelas.toString()} 
                  onValueChange={(val) => onChange({ ...pagamentoData, quantidade_parcelas: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} boleto{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Intervalo (dias) *</Label>
                <Select 
                  value={pagamentoData.intervalo_boletos.toString()} 
                  onValueChange={(val) => onChange({ ...pagamentoData, intervalo_boletos: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="21">21 dias</SelectItem>
                    <SelectItem value="28">28 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empresa que Recebe *</Label>
                <Select 
                  value={pagamentoData.empresa_receptora_id} 
                  onValueChange={(val) => onChange({ ...pagamentoData, empresa_receptora_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview dos vencimentos */}
            {previewVencimentos.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Vencimentos:</p>
                <div className="flex flex-wrap gap-2">
                  {previewVencimentos.map((data, i) => (
                    <Badge key={i} variant="outline">
                      {i + 1}ª: {data} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularValorParcela())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {pagamentoData.metodo_pagamento === 'a_vista' && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empresa que Recebe *</Label>
                <Select 
                  value={pagamentoData.empresa_receptora_id} 
                  onValueChange={(val) => onChange({ ...pagamentoData, empresa_receptora_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comprovante de Pagamento *</Label>
                {pagamentoData.comprovante_file ? (
                  <div className="flex items-center gap-2 p-2 border rounded-lg">
                    <span className="text-sm flex-1 truncate">{pagamentoData.comprovante_file.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {pagamentoData.metodo_pagamento === 'cartao_credito' && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de Parcelas *</Label>
                <Select 
                  value={pagamentoData.quantidade_parcelas.toString()} 
                  onValueChange={(val) => onChange({ ...pagamentoData, quantidade_parcelas: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal / n)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empresa que Recebe *</Label>
                <Select 
                  value={pagamentoData.empresa_receptora_id} 
                  onValueChange={(val) => onChange({ ...pagamentoData, empresa_receptora_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipoEntrega === 'instalacao' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pago_instalacao"
                  checked={pagamentoData.pago_na_instalacao}
                  onCheckedChange={(checked) => onChange({ ...pagamentoData, pago_na_instalacao: !!checked })}
                />
                <Label htmlFor="pago_instalacao" className="cursor-pointer">
                  Pagamento será feito no dia da instalação
                </Label>
              </div>
            )}

            {pagamentoData.pago_na_instalacao && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  ℹ️ As parcelas serão geradas automaticamente quando a entrega/instalação for concluída.
                </p>
              </div>
            )}
          </div>
        )}

        {pagamentoData.metodo_pagamento === 'dinheiro' && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-3">
              <Label>Quantidade de Parcelas</Label>
              <RadioGroup
                value={pagamentoData.parcelas_dinheiro.toString()}
                onValueChange={(val) => onChange({ ...pagamentoData, parcelas_dinheiro: parseInt(val) as 1 | 2 })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="dinheiro_1" />
                  <Label htmlFor="dinheiro_1" className="cursor-pointer">1 parcela (à vista)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="dinheiro_2" />
                  <Label htmlFor="dinheiro_2" className="cursor-pointer">2 parcelas</Label>
                </div>
              </RadioGroup>
            </div>

            {pagamentoData.parcelas_dinheiro === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor de Entrada *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pagamentoData.valor_entrada_dinheiro || ''}
                      onChange={(e) => onChange({ ...pagamentoData, valor_entrada_dinheiro: parseFloat(e.target.value) || 0 })}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo Restante</Label>
                    <div className="h-9 px-3 py-2 border rounded-md bg-muted">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal - pagamentoData.valor_entrada_dinheiro)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restante_instalacao"
                    checked={pagamentoData.restante_na_instalacao}
                    onCheckedChange={(checked) => onChange({ ...pagamentoData, restante_na_instalacao: !!checked })}
                  />
                  <Label htmlFor="restante_instalacao" className="cursor-pointer">
                    Restante será pago na instalação/entrega
                  </Label>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}