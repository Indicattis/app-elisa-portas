import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { OrcamentoFormData } from '@/types/orcamento';
import type { OrcamentoProduto } from '@/types/produto';
import { distribuirCustosLogisticos, criarItensLogisticosIncluso } from '@/utils/costDistribution';

interface OrcamentoPreviewProps {
  formData: OrcamentoFormData;
  produtos: OrcamentoProduto[];
  calculatedTotal: number;
  valorInstalacao?: number;
}

export function OrcamentoPreview({ formData, produtos, calculatedTotal, valorInstalacao = 0 }: OrcamentoPreviewProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const getTipoProdutoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      porta_enrolar: 'Porta de Enrolar',
      porta_social: 'Porta Social',
      acessorio: 'Acessório',
      manutencao: 'Manutenção',
      adicional: 'Adicional',
      pintura_epoxi: 'Pintura Epóxi'
    };
    return labels[tipo] || tipo;
  };

  const numeroOrcamento = `ORC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Distribuir custos logísticos entre produtos de porta
  const valorFrete = parseFloat(formData.valor_frete) || 0;
  const valorInstalacaoFromForm = parseFloat(formData.valor_instalacao) || 0;
  const produtosComCustosDistribuidos = distribuirCustosLogisticos(produtos, valorFrete, valorInstalacaoFromForm);
  const itensLogisticos = criarItensLogisticosIncluso();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-8">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">ELISA PORTAS LTDA</h1>
            <p className="text-sm text-muted-foreground">Soluções em Portas de Aço</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Rua Padre Elio Baron Toaldo, 571</p>
            <p>95055652 - Caxias do Sul, RS</p>
            <p>CNPJ: 59.277.825/0001-09</p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Título e número do orçamento */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">ORÇAMENTO</h2>
          <div className="text-right">
            <p className="font-semibold">Nº: {numeroOrcamento}</p>
            <p className="text-sm text-muted-foreground">
              Data: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">DADOS DO CLIENTE</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Nome:</span> {formData.cliente_nome || 'Não informado'}</p>
              <p><span className="font-medium">CPF:</span> {formData.cliente_cpf || 'Não informado'}</p>
              <p><span className="font-medium">Telefone:</span> {formData.cliente_telefone || 'Não informado'}</p>
            </div>
            <div>
              <p><span className="font-medium">Estado:</span> {formData.cliente_estado || 'Não informado'}</p>
              <p><span className="font-medium">Cidade:</span> {formData.cliente_cidade || 'Não informado'}</p>
              <p><span className="font-medium">CEP:</span> {formData.cliente_cep || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Informações da Vendedora */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">VENDEDORA RESPONSÁVEL</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold">👤</span>
            </div>
            <div>
              <p className="font-medium">Consultora de Vendas</p>
              <p className="text-sm text-muted-foreground">Departamento Comercial</p>
            </div>
          </div>
        </div>

        {/* Produtos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">PRODUTOS E SERVIÇOS</h3>
          
          {produtos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum produto adicionado
            </p>
          ) : (
            <div className="space-y-4">
              {produtosComCustosDistribuidos.map((produto, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{getTipoProdutoLabel(produto.tipo_produto)}</h4>
                      {produto.medidas && (
                        <p className="text-sm text-muted-foreground">Medidas: {produto.medidas}</p>
                      )}
                      {produto.descricao && (
                        <p className="text-sm text-muted-foreground">{produto.descricao}</p>
                      )}
                      {produto.descricao_manutencao && (
                        <p className="text-sm text-muted-foreground">{produto.descricao_manutencao}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {formatCurrency(produto.valor)}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {/* Itens logísticos como "Incluso" */}
              {itensLogisticos.map((item, index) => (
                <div key={`logistic-${index}`} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{item.descricao}</h4>
                      <p className="text-sm text-muted-foreground">Incluso no valor dos produtos</p>
                    </div>
                    <Badge variant="secondary">
                      Incluso
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        <Separator className="mb-6" />

        {/* Resumo Final */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">RESUMO</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Quantidade de itens:</span>
              <span>{produtos.length + itensLogisticos.length}</span>
            </div>
            
            {formData.desconto_total_percentual > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculatedTotal / (1 - formData.desconto_total_percentual / 100))}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Desconto ({formData.desconto_total_percentual}%):</span>
                  <span>-{formatCurrency(calculatedTotal / (1 - formData.desconto_total_percentual / 100) - calculatedTotal)}</span>
                </div>
              </>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL GERAL:</span>
              <span>{formatCurrency(calculatedTotal)}</span>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              <p>* O valor inclui frete, instalação e demais custos logísticos</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Forma de Pagamento:</span> {formData.forma_pagamento || 'Não informado'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Modalidade de Instalação:</span> {
                formData.modalidade_instalacao === 'instalacao_elisa' ? 'Instalação Elisa' : 'Autorizado Elisa'
              }
            </p>
          </div>

          <div className="mt-8 text-xs text-muted-foreground text-center">
            <p>Este orçamento tem validade de 30 dias.</p>
            <p>Elisa Portas LTDA - Soluções em Portas de Aço</p>
            <p>Contato: contato@elisaportas.com.br</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}