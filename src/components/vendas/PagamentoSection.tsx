import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetodoPagamentoCard, MetodoPagamento, createEmptyMetodo } from "./MetodoPagamentoCard";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface PagamentoData {
  usar_dois_metodos: boolean;
  metodos: [MetodoPagamento, MetodoPagamento];
}

export const createEmptyPagamentoData = (): PagamentoData => ({
  usar_dois_metodos: false,
  metodos: [createEmptyMetodo(), createEmptyMetodo()]
});

interface PagamentoSectionProps {
  paymentData: PagamentoData;
  onChange: (data: PagamentoData) => void;
  valorTotal: number;
}

export function PagamentoSection({ paymentData, onChange, valorTotal }: PagamentoSectionProps) {
  const { data: empresas = [], isLoading: isLoadingEmpresas } = useQuery({
    queryKey: ['empresas-emissoras-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_emissoras')
        .select('id, nome')
        .eq('ativo', true)
        .order('padrao', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Auto-set empresa padrão quando empresas carregam
  useEffect(() => {
    if (empresas.length > 0) {
      const empresaPadrao = empresas[0];
      let needsUpdate = false;
      const newMetodos = [...paymentData.metodos] as [MetodoPagamento, MetodoPagamento];
      
      if (!paymentData.metodos[0].empresa_receptora_id && paymentData.metodos[0].tipo) {
        newMetodos[0] = { ...newMetodos[0], empresa_receptora_id: empresaPadrao.id };
        needsUpdate = true;
      }
      if (!paymentData.metodos[1].empresa_receptora_id && paymentData.metodos[1].tipo) {
        newMetodos[1] = { ...newMetodos[1], empresa_receptora_id: empresaPadrao.id };
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        onChange({ ...paymentData, metodos: newMetodos });
      }
    }
  }, [empresas, paymentData.metodos[0].tipo, paymentData.metodos[1].tipo]);

  const handleMetodo1Change = (metodo: MetodoPagamento) => {
    const newMetodos: [MetodoPagamento, MetodoPagamento] = [metodo, paymentData.metodos[1]];
    
    // Se estiver usando 2 métodos, recalcular o valor restante
    if (paymentData.usar_dois_metodos) {
      const valorRestante = Math.max(0, valorTotal - metodo.valor);
      newMetodos[1] = { ...newMetodos[1], valor: valorRestante };
    } else {
      // Se for método único, o valor é o total
      newMetodos[0] = { ...metodo, valor: valorTotal };
    }
    
    onChange({ ...paymentData, metodos: newMetodos });
  };

  const handleMetodo2Change = (metodo: MetodoPagamento) => {
    const newMetodos: [MetodoPagamento, MetodoPagamento] = [paymentData.metodos[0], metodo];
    onChange({ ...paymentData, metodos: newMetodos });
  };

  const handleToggleDoisMetodos = (checked: boolean) => {
    if (checked) {
      // Ativando 2 métodos - zerar valores para usuário definir
      onChange({
        usar_dois_metodos: true,
        metodos: [
          { ...paymentData.metodos[0], valor: 0 },
          createEmptyMetodo()
        ]
      });
    } else {
      // Desativando 2 métodos - método 1 recebe valor total
      onChange({
        usar_dois_metodos: false,
        metodos: [
          { ...paymentData.metodos[0], valor: valorTotal },
          createEmptyMetodo()
        ]
      });
    }
  };

  // Calcular preview de parcelas para boleto e cartão
  const calcularPreviewParcelas = (metodo: MetodoPagamento) => {
    if (!metodo.data_pagamento || metodo.valor <= 0) return [];
    
    const parcelas: { numero: number; data: Date; valor: number }[] = [];
    
    if (metodo.tipo === 'boleto') {
      const valorParcela = metodo.valor / metodo.parcelas_boleto;
      for (let i = 0; i < metodo.parcelas_boleto; i++) {
        parcelas.push({
          numero: i + 1,
          data: addDays(metodo.data_pagamento, metodo.intervalo_boletos * i),
          valor: valorParcela
        });
      }
    } else if (metodo.tipo === 'cartao_credito') {
      const valorParcela = metodo.valor / metodo.parcelas_cartao;
      for (let i = 0; i < metodo.parcelas_cartao; i++) {
        parcelas.push({
          numero: i + 1,
          data: addDays(metodo.data_pagamento, 30 * i),
          valor: valorParcela
        });
      }
    }
    
    return parcelas;
  };

  const metodo1 = paymentData.metodos[0];
  const metodo2 = paymentData.metodos[1];
  const valorMetodo1 = paymentData.usar_dois_metodos ? metodo1.valor : valorTotal;
  const valorMetodo2 = paymentData.usar_dois_metodos ? Math.max(0, valorTotal - metodo1.valor) : 0;
  const valoresConferem = !paymentData.usar_dois_metodos || (metodo1.valor + valorMetodo2 === valorTotal);

  const cardClass = "bg-primary/5 border-primary/10 backdrop-blur-xl";

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-white">Forma de Pagamento</CardTitle>
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-white">
            Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        {/* Toggle para 2 métodos */}
        <div className="flex items-center space-x-2 p-2.5 border rounded-md border-primary/10 bg-primary/5">
          <Checkbox
            id="usar-dois-metodos"
            checked={paymentData.usar_dois_metodos}
            onCheckedChange={handleToggleDoisMetodos}
          />
          <Label htmlFor="usar-dois-metodos" className="cursor-pointer text-xs text-white/80">
            Usar 2 formas de pagamento (ex: entrada + restante)
          </Label>
        </div>

        {/* Método 1 */}
        <MetodoPagamentoCard
          metodo={{ ...metodo1, valor: valorMetodo1 }}
          onChange={handleMetodo1Change}
          empresas={empresas}
          isLoadingEmpresas={isLoadingEmpresas}
          titulo={paymentData.usar_dois_metodos ? "Método 1 (Entrada)" : "Método de Pagamento"}
          valorFixo={!paymentData.usar_dois_metodos}
          valorLabel={paymentData.usar_dois_metodos ? "Valor da Entrada *" : "Valor Total"}
        />

        {/* Preview parcelas método 1 */}
        {(metodo1.tipo === 'boleto' || metodo1.tipo === 'cartao_credito') && metodo1.data_pagamento && valorMetodo1 > 0 && (
          <div className="border rounded-lg p-3 border-primary/10 bg-primary/5">
            <p className="text-xs font-medium mb-2 text-white/80">
              Parcelas {metodo1.tipo === 'boleto' ? 'do Boleto' : 'do Cartão'} (Método 1):
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {calcularPreviewParcelas({ ...metodo1, valor: valorMetodo1 }).map((p) => (
                <div key={p.numero} className="text-xs p-2 bg-primary/5 rounded border border-primary/10 text-white/70">
                  <span className="font-medium text-white">{p.numero}ª:</span>{' '}
                  {format(p.data, "dd/MM/yy", { locale: ptBR })} -{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Método 2 (se ativo) */}
        {paymentData.usar_dois_metodos && (
          <>
            <MetodoPagamentoCard
              metodo={{ ...metodo2, valor: valorMetodo2 }}
              onChange={handleMetodo2Change}
              empresas={empresas}
              isLoadingEmpresas={isLoadingEmpresas}
              titulo="Método 2 (Restante)"
              valorFixo={true}
              valorLabel="Valor Restante"
            />

            {/* Preview parcelas método 2 */}
            {(metodo2.tipo === 'boleto' || metodo2.tipo === 'cartao_credito') && metodo2.data_pagamento && valorMetodo2 > 0 && (
              <div className="border rounded-lg p-3 border-primary/10 bg-primary/5">
                <p className="text-xs font-medium mb-2 text-white/80">
                  Parcelas {metodo2.tipo === 'boleto' ? 'do Boleto' : 'do Cartão'} (Método 2):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {calcularPreviewParcelas({ ...metodo2, valor: valorMetodo2 }).map((p) => (
                    <div key={p.numero} className="text-xs p-2 bg-primary/5 rounded border border-primary/10 text-white/70">
                      <span className="font-medium text-white">{p.numero}ª:</span>{' '}
                      {format(p.data, "dd/MM/yy", { locale: ptBR })} -{' '}
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Resumo do pagamento */}
        {(metodo1.tipo || (paymentData.usar_dois_metodos && metodo2.tipo)) && (
          <div className="border rounded-lg p-4 space-y-3 border-primary/10 bg-primary/5">
            <h4 className="font-medium text-sm text-white">Resumo do Pagamento</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Total da Venda:</span>
                <span className="font-medium text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                </span>
              </div>
              
              <div className="border-t border-primary/10 pt-2 space-y-1">
                {metodo1.tipo && (
                  <div className="flex justify-between">
                    <span className="text-white/60">
                      {paymentData.usar_dois_metodos ? 'Método 1' : 'Pagamento'} ({
                        metodo1.tipo === 'boleto' ? `Boleto ${metodo1.parcelas_boleto}x` :
                        metodo1.tipo === 'cartao_credito' ? `Cartão ${metodo1.parcelas_cartao}x` :
                        metodo1.tipo === 'a_vista' ? 'À Vista' : 'Dinheiro'
                      }):
                    </span>
                    <span className="text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorMetodo1)}
                      {metodo1.data_pagamento && (
                        <span className="text-white/50 ml-2">
                          em {format(metodo1.data_pagamento, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {paymentData.usar_dois_metodos && metodo2.tipo && (
                  <div className="flex justify-between">
                    <span className="text-white/60">
                      Método 2 ({
                        metodo2.tipo === 'boleto' ? `Boleto ${metodo2.parcelas_boleto}x` :
                        metodo2.tipo === 'cartao_credito' ? `Cartão ${metodo2.parcelas_cartao}x` :
                        metodo2.tipo === 'a_vista' ? 'À Vista' : 'Dinheiro'
                      }):
                    </span>
                    <span className="text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorMetodo2)}
                      {metodo2.data_pagamento && (
                        <span className="text-white/50 ml-2">
                          em {format(metodo2.data_pagamento, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-primary/10 pt-2">
                {valoresConferem ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ Valores conferem</Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">⚠ Valores não conferem com o total</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
