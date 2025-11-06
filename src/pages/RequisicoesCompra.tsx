import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, Eye, Trash2, Calendar, User, Package as PackageIcon, FileText, Clock, CheckCircle, TruckIcon } from "lucide-react";
import { useRequisicoesCompra, RequisicaoCompra } from "@/hooks/useRequisicoesCompra";
import { RequisicaoCompraForm } from "@/components/compras/RequisicaoCompraForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pendente_aprovacao: "bg-yellow-500",
  em_analise: "bg-blue-500",
  aprovada: "bg-green-500",
  aguardando_fornecedor: "bg-orange-500",
  ok_financeiro: "bg-teal-500",
  rejeitada: "bg-red-500",
  em_cotacao: "bg-indigo-500",
  pedido_realizado: "bg-purple-500",
  concluida: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  pendente_aprovacao: "Pendente Aprovação",
  em_analise: "Em Análise",
  aprovada: "Aprovada",
  aguardando_fornecedor: "Aguardando Fornecedor",
  ok_financeiro: "Ok Financeiro",
  rejeitada: "Rejeitada",
  em_cotacao: "Em Cotação",
  pedido_realizado: "Pedido Realizado",
  concluida: "Concluída",
};

export default function RequisicoesCompra() {
  const { requisicoes, isLoading, createRequisicao, deleteRequisicao, isCreating, isDeleting } = useRequisicoesCompra();
  const [formOpen, setFormOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [requisicaoSelecionada, setRequisicaoSelecionada] = useState<RequisicaoCompra | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requisicaoToDelete, setRequisicaoToDelete] = useState<string | null>(null);

  const handleVerDetalhes = (requisicao: RequisicaoCompra) => {
    setRequisicaoSelecionada(requisicao);
    setDetalhesOpen(true);
  };

  const handleDelete = (id: string) => {
    setRequisicaoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (requisicaoToDelete) {
      await deleteRequisicao(requisicaoToDelete);
      setDeleteDialogOpen(false);
      setRequisicaoToDelete(null);
    }
  };

  const indicadores = useMemo(() => {
    const total = requisicoes.length;
    const emAnalise = requisicoes.filter(r => r.status === "em_analise").length;
    const aprovadas = requisicoes.filter(r => r.status === "aprovada").length;
    const aguardandoFornecedor = requisicoes.filter(r => r.status === "aguardando_fornecedor").length;
    const okFinanceiro = requisicoes.filter(r => r.status === "ok_financeiro").length;
    
    return { total, emAnalise, aprovadas, aguardandoFornecedor, okFinanceiro };
  }, [requisicoes]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Requisições de Compra</h1>
            <p className="text-muted-foreground">Gestão de requisições de compra</p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Requisição
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.total}</div>
            <p className="text-xs text-muted-foreground">requisições</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.emAnalise}</div>
            <p className="text-xs text-muted-foreground">pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.aprovadas}</div>
            <p className="text-xs text-muted-foreground">aprovadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Fornecedor</CardTitle>
            <TruckIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.aguardandoFornecedor}</div>
            <p className="text-xs text-muted-foreground">em espera</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ok Financeiro</CardTitle>
            <CheckCircle className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.okFinanceiro}</div>
            <p className="text-xs text-muted-foreground">liberadas</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : requisicoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma requisição cadastrada. Clique em "Nova Requisição" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requisicoes.map((requisicao) => (
            <Card key={requisicao.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{requisicao.numero_requisicao}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(requisicao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[requisicao.status]}>
                    {statusLabels[requisicao.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {requisicao.fornecedor_nome && (
                  <div className="flex items-center gap-2 text-sm">
                    <PackageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{requisicao.fornecedor_nome}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{requisicao.solicitante_nome || "Sistema"}</span>
                </div>

                {requisicao.data_necessidade && (
                  <div className="text-sm text-muted-foreground">
                    Necessário até: {format(new Date(requisicao.data_necessidade), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}

                <div className="text-sm font-medium">
                  {requisicao.itens?.length || 0} {requisicao.itens?.length === 1 ? "item" : "itens"}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerDetalhes(requisicao)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalhes
                  </Button>
                  {requisicao.status === "pendente_aprovacao" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(requisicao.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RequisicaoCompraForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data) => {
          await createRequisicao(data);
        }}
        isSubmitting={isCreating}
      />

      <Sheet open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Requisição</SheetTitle>
          </SheetHeader>

          {requisicaoSelecionada && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-semibold">{requisicaoSelecionada.numero_requisicao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[requisicaoSelecionada.status]}>
                    {statusLabels[requisicaoSelecionada.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solicitante</p>
                  <p className="font-medium">{requisicaoSelecionada.solicitante_nome || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{requisicaoSelecionada.fornecedor_nome || "Não especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Criação</p>
                  <p className="font-medium">
                    {format(new Date(requisicaoSelecionada.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {requisicaoSelecionada.data_necessidade && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Necessidade</p>
                    <p className="font-medium">
                      {format(new Date(requisicaoSelecionada.data_necessidade), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {requisicaoSelecionada.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{requisicaoSelecionada.observacoes}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Itens da Requisição</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisicaoSelecionada.itens?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.produto_nome}</TableCell>
                        <TableCell className="text-center">{item.quantidade}</TableCell>
                        <TableCell>{item.observacoes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta requisição? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
