import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Calendar, DollarSign, FileText, Package, Phone, Mail, Truck, Wrench } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VendaDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: any;
}

export function VendaDetailsModal({ open, onOpenChange, venda }: VendaDetailsModalProps) {
  if (!venda) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDateOnly = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Calcular valores da venda
  const produtos = venda.produtos_vendas || venda.portas || [];
  const valorProdutos = produtos.reduce((acc: number, p: any) => 
    acc + ((p.valor_produto || 0) + (p.valor_pintura || 0)) * (p.quantidade || 1), 0
  );
  const valorInstalacao = venda.valor_instalacao || 0;
  const valorFrete = venda.valor_frete || 0;
  const valorTotal = venda.valor_venda || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Detalhes da Venda</DialogTitle>
        </DialogHeader>

        {/* Resumo Financeiro Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(valorTotal)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground mb-1">Produtos</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(valorProdutos)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <Wrench className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground mb-1">Instalação</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(valorInstalacao)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <Truck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-muted-foreground mb-1">Frete</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(valorFrete)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Produtos - Seção Principal */}
        {produtos && produtos.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos da Venda ({produtos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {produtos.map((produto: any, index: number) => (
                  <div key={index} className="border-2 rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">
                            {produto.tipo_produto.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Qtd: <strong>{produto.quantidade}x</strong>
                          </span>
                        </div>
                        {produto.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{produto.descricao}</p>
                        )}
                        {produto.tamanho && (
                          <p className="text-sm font-medium mt-1">Tamanho: {produto.tamanho}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(produto.valor_total || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t">
                      {produto.valor_produto > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Produto</p>
                          <p className="font-semibold">{formatCurrency(produto.valor_produto)}</p>
                        </div>
                      )}
                      {produto.valor_pintura > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Pintura</p>
                          <p className="font-semibold">{formatCurrency(produto.valor_pintura)}</p>
                        </div>
                      )}
                      {produto.valor_instalacao > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Instalação</p>
                          <p className="font-semibold">{formatCurrency(produto.valor_instalacao)}</p>
                        </div>
                      )}
                    </div>

                    {(produto.desconto_percentual > 0 || produto.desconto_valor > 0) && (
                      <div className="mt-3 pt-3 border-t">
                        <Badge variant="destructive">
                          Desconto: {produto.tipo_desconto === 'percentual' 
                            ? `${produto.desconto_percentual}%` 
                            : formatCurrency(produto.desconto_valor)}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do Cliente e Venda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-semibold">{venda.cliente_nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{venda.cliente_telefone}</p>
                </div>
                {venda.cpf_cliente && (
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="text-sm font-medium">{venda.cpf_cliente}</p>
                  </div>
                )}
              </div>
              {venda.cliente_email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{venda.cliente_email}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Localização</p>
                <p className="text-sm font-medium">{venda.cidade}/{venda.estado}</p>
                {venda.cep && <p className="text-xs text-muted-foreground">CEP: {venda.cep}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Informações da Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Data da Venda</p>
                <p className="font-semibold">{formatDate(venda.data_venda)}</p>
              </div>
              {venda.data_prevista_entrega && (
                <div>
                  <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                  <p className="font-semibold">{formatDateOnly(venda.data_prevista_entrega)}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {venda.publico_alvo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Público Alvo</p>
                    <p className="text-sm font-medium">{venda.publico_alvo}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Pagamento</p>
                  <p className="text-sm font-medium">{venda.forma_pagamento}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Frete</p>
                  <p className="text-sm font-semibold">{formatCurrency(venda.valor_frete || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Instalação</p>
                  <p className="text-sm font-semibold">{formatCurrency(venda.valor_instalacao || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        {venda.observacoes_venda && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                {venda.observacoes_venda}
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
