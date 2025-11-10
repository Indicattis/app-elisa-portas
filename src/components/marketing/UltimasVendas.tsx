import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUltimasVendas } from "@/hooks/useUltimasVendas";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShoppingCart } from "lucide-react";

export function UltimasVendas() {
  const { data: vendas, isLoading } = useUltimasVendas();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <CardTitle>Últimas Vendas</CardTitle>
          </div>
          <CardDescription>
            10 vendas mais recentes com informações de canal e CAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <CardTitle>Últimas Vendas</CardTitle>
        </div>
        <CardDescription>
          10 vendas mais recentes com informações de canal e CAC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Canal de Aquisição</TableHead>
                <TableHead className="text-right">CAC do Canal (Mês)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas && vendas.length > 0 ? (
                vendas.map((venda) => {
                  const valorLiquido = venda.valor_venda - (venda.valor_frete || 0);
                  return (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">
                        {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{venda.cliente_nome}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatarMoeda(valorLiquido)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                          {venda.canal_aquisicao_nome || 'Não informado'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {venda.cac_canal !== null ? (
                          <span className="font-medium text-muted-foreground">
                            {formatarMoeda(venda.cac_canal)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
