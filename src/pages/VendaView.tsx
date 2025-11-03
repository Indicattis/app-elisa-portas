import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, DollarSign, Package, User, Calendar, CreditCard, FileText, Home } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Parcela {
  id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  valor_pago?: number;
}

interface Pedido {
  id: string;
  numero_pedido: string;
}

interface Instalacao {
  id: string;
  nome_cliente: string;
  data_instalacao?: string;
}

interface Venda {
  id: string;
  cliente_nome: string;
  cliente_cpf?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  cep?: string;
  valor_venda: number;
  forma_pagamento?: string;
  canal_aquisicao?: { nome: string };
  atendente?: { nome: string; foto_perfil_url?: string };
  observacoes_venda?: string;
  created_at: string;
  produtos: any[];
  parcelas: Parcela[];
  pedido?: Pedido;
  instalacao?: Instalacao;
}

export default function VendaView() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchVendaDetails();
  }, [id]);

  const fetchVendaDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select(`
          *,
          produtos:produtos_vendas(*,cor:catalogo_cores(nome, codigo_hex)),
          parcelas:contas_receber!venda_id(*),
          pedido:pedidos_producao!venda_id(id, numero_pedido),
          instalacao:instalacoes_cadastradas!venda_id(id, nome_cliente, data_instalacao),
          canal_aquisicao:canais_aquisicao(nome),
          atendente:admin_users!atendente_id(nome, foto_perfil_url)
        `)
        .eq("id", id)
        .single();

      if (vendaError) throw vendaError;
      setVenda(vendaData as any);
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar venda" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!venda) return <div className="text-center py-8"><p>Venda não encontrada</p></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Venda - {venda.cliente_nome}</h1>
            <p className="text-sm text-muted-foreground">
              Cadastrada em {format(new Date(venda.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(venda.valor_venda)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{venda.produtos?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{venda.forma_pagamento || "Não informado"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Informações do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{venda.cliente_nome}</p>
            </div>
            {venda.cliente_cpf && (
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{venda.cliente_cpf}</p>
              </div>
            )}
            {venda.cliente_telefone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{venda.cliente_telefone}</p>
              </div>
            )}
            {venda.cliente_email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{venda.cliente_email}</p>
              </div>
            )}
          </div>
          {venda.cidade && venda.estado && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Endereço</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p>{venda.cidade}, {venda.estado}</p>
                    {venda.bairro && <p className="text-sm text-muted-foreground">{venda.bairro}</p>}
                    {venda.cep && <p className="text-sm text-muted-foreground">CEP: {venda.cep}</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Produtos */}
      {venda.produtos && venda.produtos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos ({venda.produtos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {venda.produtos.map((produto) => (
                <div key={produto.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{produto.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {produto.tipo_produto}
                        </Badge>
                        {produto.cor && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{
                              borderColor: produto.cor.codigo_hex,
                              color: produto.cor.codigo_hex
                            }}
                          >
                            {produto.cor.nome}
                          </Badge>
                        )}
                        {produto.tamanho && (
                          <span className="text-xs text-muted-foreground">{produto.tamanho}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantidade: {produto.quantidade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(produto.valor_total)}</p>
                      {produto.desconto_percentual > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Desconto: {produto.desconto_percentual}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcelas */}
      {venda.parcelas && venda.parcelas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Parcelas de Pagamento ({venda.parcelas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {venda.parcelas.map((parcela) => (
                <div key={parcela.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold min-w-[60px]">
                      Parcela {parcela.numero_parcela}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        parcela.status === 'pago' 
                          ? 'bg-green-500/10 text-green-700 border-green-500/20' 
                          : parcela.status === 'pago_parcial'
                          ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-700 border-red-500/20'
                      }`}
                    >
                      {parcela.status === 'pago' 
                        ? 'Pago' 
                        : parcela.status === 'pago_parcial'
                        ? 'Pago Parcial'
                        : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(parcela.valor_parcela)}</p>
                    <p className="text-xs text-muted-foreground">
                      Venc: {format(new Date(parcela.data_vencimento), 'dd/MM/yyyy')}
                    </p>
                    {parcela.data_pagamento && (
                      <p className="text-xs text-green-600">
                        Pago: {format(new Date(parcela.data_pagamento), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Vendedor/Atendente */}
        {venda.atendente && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Atendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {venda.atendente.foto_perfil_url && (
                  <img 
                    src={venda.atendente.foto_perfil_url} 
                    alt={venda.atendente.nome}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <p className="font-medium">{venda.atendente.nome}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Canal de Aquisição */}
        {venda.canal_aquisicao && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Canal de Aquisição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{venda.canal_aquisicao.nome}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documentos Relacionados */}
      {(venda.pedido || venda.instalacao) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos Relacionados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {venda.pedido && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/dashboard/pedido/${venda.pedido?.id}/view`)}
              >
                <Package className="w-4 h-4 mr-2" />
                Pedido de Produção #{venda.pedido.numero_pedido}
              </Button>
            )}
            {venda.instalacao && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/dashboard/instalacoes`)}
              >
                <Home className="w-4 h-4 mr-2" />
                Instalação - {venda.instalacao.nome_cliente}
                {venda.instalacao.data_instalacao && (
                  <span className="ml-auto text-sm text-muted-foreground">
                    {format(new Date(venda.instalacao.data_instalacao), 'dd/MM/yyyy')}
                  </span>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {venda.observacoes_venda && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{venda.observacoes_venda}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => navigate(`/dashboard/vendas/${id}/edit`)}>
            Editar Venda
          </Button>
          {venda.pedido && (
            <Button variant="outline" onClick={() => navigate(`/dashboard/pedido/${venda.pedido.id}/view`)}>
              Ver Pedido
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
