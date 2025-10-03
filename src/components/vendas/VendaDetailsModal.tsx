import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, MapPin, Calendar, DollarSign, FileText, Package, Phone, Mail } from "lucide-react";
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

  // Calcular valor sem frete
  const valorSemFrete = (venda.valor_venda || 0) - (venda.valor_frete || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalhes da Venda</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-4 h-4" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{venda.cliente_nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Telefone
                  </p>
                  <p className="text-sm">{venda.cliente_telefone}</p>
                </div>
                {venda.cliente_email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </p>
                    <p className="text-sm">{venda.cliente_email}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" />
                  Localização
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>Cidade/Estado:</strong> {venda.cidade}/{venda.estado}</p>
                  {venda.bairro && <p><strong>Bairro:</strong> {venda.bairro}</p>}
                  {venda.cep && <p><strong>CEP:</strong> {venda.cep}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-4 h-4" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Produtos</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(valorSemFrete)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Frete</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(venda.valor_frete || 0)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(venda.valor_venda || 0)}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                {venda.valor_entrada > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entrada</p>
                    <p className="font-medium">{formatCurrency(venda.valor_entrada)}</p>
                  </div>
                )}
                {venda.valor_a_receber > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                    <p className="font-medium text-orange-600">{formatCurrency(venda.valor_a_receber)}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium">{venda.forma_pagamento}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Venda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-4 h-4" />
                Detalhes da Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data da Venda</p>
                <p className="font-medium">{formatDate(venda.data_venda)}</p>
              </div>
              {venda.data_prevista_entrega && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Previsão de Entrega</p>
                  <p className="font-medium">{formatDateOnly(venda.data_prevista_entrega)}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{venda.portas?.length || 0} produto(s)</span>
              </div>
              {venda.publico_alvo && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Público Alvo</p>
                  <p className="font-medium">{venda.publico_alvo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atendente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-4 h-4" />
                Atendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={venda.atendente?.foto_perfil_url || ''} 
                    alt={venda.atendente?.nome || 'Atendente'} 
                  />
                  <AvatarFallback>
                    {venda.atendente?.nome?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{venda.atendente?.nome || 'N/A'}</p>
                  {venda.atendente?.email && (
                    <p className="text-sm text-muted-foreground">{venda.atendente.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Produtos */}
        {venda.portas && venda.portas.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-4 h-4" />
                Produtos ({venda.portas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {venda.portas.map((produto: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{produto.tipo_produto}</p>
                        {produto.descricao && (
                          <p className="text-sm text-muted-foreground">{produto.descricao}</p>
                        )}
                      </div>
                      <p className="font-bold text-primary">{formatCurrency(produto.valor_total || 0)}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {produto.tamanho && (
                        <div>
                          <p className="text-muted-foreground">Tamanho</p>
                          <p className="font-medium">{produto.tamanho}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Quantidade</p>
                        <p className="font-medium">{produto.quantidade}x</p>
                      </div>
                      {produto.valor_produto > 0 && (
                        <div>
                          <p className="text-muted-foreground">Produto</p>
                          <p className="font-medium">{formatCurrency(produto.valor_produto)}</p>
                        </div>
                      )}
                      {produto.valor_pintura > 0 && (
                        <div>
                          <p className="text-muted-foreground">Pintura</p>
                          <p className="font-medium">{formatCurrency(produto.valor_pintura)}</p>
                        </div>
                      )}
                    </div>
                    {(produto.desconto_percentual > 0 || produto.desconto_valor > 0) && (
                      <p className="text-sm text-orange-600">
                        Desconto: {produto.tipo_desconto === 'percentual' 
                          ? `${produto.desconto_percentual}%` 
                          : formatCurrency(produto.desconto_valor)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        {venda.observacoes_venda && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
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
