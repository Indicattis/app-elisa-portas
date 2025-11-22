import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePedidosComOrdens } from "@/hooks/usePedidosComOrdens";
import { Hammer, Package, Boxes, Sparkles, CheckSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ordemIcons = {
  soldagem: Hammer,
  perfiladeira: Package,
  separacao: Boxes,
  qualidade: Sparkles,
  pintura: CheckSquare,
};

const ordemLabels = {
  soldagem: "Soldagem",
  perfiladeira: "Perfiladeira",
  separacao: "Separação",
  qualidade: "Qualidade",
  pintura: "Pintura",
};

export function PedidosStatusOrdens() {
  const { data: pedidos = [], isLoading } = usePedidosComOrdens();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos em Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos em Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum pedido em produção no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "concluido":
      case "pronta":
        return "text-green-500";
      case "em_andamento":
        return "text-yellow-500";
      case "pendente":
        return "text-gray-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Pedidos com Ordens Pendentes</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="h-9 text-xs">Pedido</TableHead>
                <TableHead className="h-9 text-xs">Etapa</TableHead>
                {Object.entries(ordemLabels).map(([key, label]) => (
                  <TableHead key={key} className="text-center h-9 text-xs">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow key={pedido.numero_pedido} className="border-b last:border-0">
                  <TableCell className="font-medium text-sm py-2">
                    {pedido.numero_pedido}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {pedido.etapa_atual}
                    </Badge>
                  </TableCell>
                  {Object.entries(ordemIcons).map(([key, Icon]) => {
                    const ordem = pedido.ordens[key as keyof typeof pedido.ordens];
                    return (
                      <TableCell key={key} className="text-center py-2">
                        {ordem.existe ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Icon
                              className={`h-4 w-4 ${getStatusColor(ordem.status)}`}
                            />
                            {ordem.capturada && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 leading-none">
                                Cap
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
