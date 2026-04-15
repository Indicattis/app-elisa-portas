import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFaturamentoPorProduto } from "@/hooks/useFaturamentoPorProduto";
import { DateRange } from "react-day-picker";
import { DoorOpen, Package, Wrench, Palette } from "lucide-react";

interface RelatorioProdutosProps {
  dateRange?: DateRange;
  selectedAtendente: string;
  filterPublico: string;
}

const getTipoProdutoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    'porta': 'Porta',
    'porta_enrolar': 'Porta Enrolar',
    'porta_social': 'Porta Social',
    'pintura_epoxi': 'Pintura Epóxi',
    'manutencao': 'Manutenção',
    'acessorios': 'Acessórios',
    'instalacao': 'Instalação',
  };
  return labels[tipo] || tipo;
};

const getTipoProdutoIcon = (tipo: string) => {
  const icons: Record<string, JSX.Element> = {
    'porta': <DoorOpen className="w-4 h-4 text-amber-600" />,
    'porta_enrolar': <DoorOpen className="w-4 h-4 text-slate-600" />,
    'pintura_epoxi': <Palette className="w-4 h-4 text-purple-600" />,
    'manutencao': <Wrench className="w-4 h-4 text-cyan-600" />,
    'acessorios': <Package className="w-4 h-4 text-blue-600" />,
  };
  return icons[tipo] || <Package className="w-4 h-4" />;
};

export function RelatorioProdutos({ dateRange, selectedAtendente, filterPublico }: RelatorioProdutosProps) {
  const { data: produtos = [], isLoading } = useFaturamentoPorProduto({
    dateRange,
    selectedAtendente,
    filterPublico,
  });

  const totais = produtos.reduce(
    (acc, p) => ({
      quantidade: acc.quantidade + p.quantidade,
      faturamento: acc.faturamento + p.valor_total,
      lucro: acc.lucro + p.lucro_total,
    }),
    { quantidade: 0, faturamento: 0, lucro: 0 }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatório por Produtos</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório por Produtos</CardTitle>
        <CardDescription>
          Faturamento, quantidade e lucro por tipo de produto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">% Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {produtos.map((produto) => {
                    const margemLucro = produto.valor_total > 0 
                      ? (produto.lucro_total / produto.valor_total) * 100 
                      : 0;

                    return (
                      <TableRow key={produto.tipo_produto}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTipoProdutoIcon(produto.tipo_produto)}
                            <span className="font-medium">
                              {getTipoProdutoLabel(produto.tipo_produto)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {produto.quantidade}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-semibold">
                          R$ {produto.valor_total.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          R$ {produto.lucro_total.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={margemLucro >= 20 ? "text-green-600" : margemLucro >= 10 ? "text-amber-600" : "text-red-600"}>
                            {margemLucro.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Linha de Totais */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {totais.quantidade}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      R$ {totais.faturamento.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      R$ {totais.lucro.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {totais.faturamento > 0 
                        ? ((totais.lucro / totais.faturamento) * 100).toFixed(1) 
                        : 0}%
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
