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
      <CardHeader>
        <CardTitle>Pedidos em Produção</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Etapa</TableHead>
                {Object.entries(ordemLabels).map(([key, label]) => (
                  <TableHead key={key} className="text-center">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow key={pedido.numero_pedido}>
                  <TableCell className="font-medium">
                    {pedido.numero_pedido}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {pedido.etapa_atual}
                    </Badge>
                  </TableCell>
                  {Object.entries(ordemIcons).map(([key, Icon]) => {
                    const ordem = pedido.ordens[key as keyof typeof pedido.ordens];
                    return (
                      <TableCell key={key} className="text-center">
                        {ordem.existe ? (
                          <div className="flex flex-col items-center gap-1">
                            <Icon
                              className={`h-5 w-5 ${getStatusColor(ordem.status)}`}
                            />
                            {ordem.capturada && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Capturada
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
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
