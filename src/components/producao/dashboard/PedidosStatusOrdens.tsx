import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePedidosComOrdens } from "@/hooks/usePedidosComOrdens";
import { Hammer, Package, Boxes, Sparkles, CheckSquare, User, AlertCircle } from "lucide-react";
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
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-sm">Pedidos em Produção</CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
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
        return "border-green-500";
      case "em_andamento":
        return "border-yellow-500";
      case "pendente":
        return "border-gray-400";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-1 px-3 pt-3">
        <CardTitle className="text-sm">Pedidos com Ordens Pendentes</CardTitle>
      </CardHeader>
      <CardContent className="pb-2 px-3">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="h-6 text-[10px] py-0.5 px-2">Pedido</TableHead>
                <TableHead className="h-6 text-[10px] py-0.5 px-2">Cliente</TableHead>
                <TableHead className="h-6 text-[10px] py-0.5 px-2">Entrega</TableHead>
                <TableHead className="h-6 text-[10px] py-0.5 px-2">Carregamento</TableHead>
                <TableHead className="h-6 text-[10px] py-0.5 px-2">Etapa</TableHead>
                {Object.entries(ordemLabels).map(([key, label]) => (
                  <TableHead key={key} className="text-center h-6 text-[10px] py-0.5 px-1">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow key={pedido.numero_pedido} className="border-b last:border-0">
                  <TableCell className="font-medium text-[11px] py-1 px-2">
                    {pedido.numero_pedido}
                  </TableCell>
                  <TableCell className="text-[11px] py-1 px-2">
                    {pedido.nome_cliente}
                  </TableCell>
                  <TableCell className="text-[11px] py-1 px-2">
                    {pedido.data_entrega ? new Date(pedido.data_entrega).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-[11px] py-1 px-2">
                    {pedido.data_carregamento ? new Date(pedido.data_carregamento).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Badge variant="outline" className="text-[8px] px-1 py-0">
                      {pedido.etapa_atual}
                    </Badge>
                  </TableCell>
                  {Object.entries(ordemIcons).map(([key]) => {
                    const ordem = pedido.ordens[key as keyof typeof pedido.ordens];
                    return (
                      <TableCell key={key} className="text-center py-1 px-1">
                        {ordem.existe ? (
                          <div className="flex flex-col items-center">
                            {ordem.capturada && ordem.capturada_por_foto ? (
                              <Avatar className={`h-5 w-5 border-2 ${getStatusColor(ordem.status)}`}>
                                <AvatarImage src={ordem.capturada_por_foto} />
                                <AvatarFallback className="text-[8px]">
                                  <User className="h-2.5 w-2.5" />
                                </AvatarFallback>
                              </Avatar>
                            ) : ordem.capturada ? (
                              <div className={`h-5 w-5 rounded-full border-2 ${getStatusColor(ordem.status)} bg-secondary flex items-center justify-center`}>
                                <User className="h-2.5 w-2.5" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
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
