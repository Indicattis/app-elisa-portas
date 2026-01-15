import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLinhasOrdem } from "@/hooks/useLinhasOrdem";
import { Hammer, Package, Boxes, Sparkles, CheckSquare, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface OrdemStatus {
  existe: boolean;
  status: string | null;
  capturada: boolean;
  capturada_por_foto?: string | null;
  pausada: boolean;
  justificativa_pausa?: string | null;
  ordem_id?: string | null;
  numero_ordem?: string | null;
}

interface PedidoComOrdens {
  pedido_id: string;
  numero_pedido: string;
  numero_mes: number | null;
  etapa_atual: string;
  nome_cliente: string;
  data_entrega: string | null;
  data_carregamento: string | null;
  prioridade: number;
  produtos: Array<{
    tipo: string;
    descricao: string | null;
    tamanho: string | null;
    quantidade: number;
  }>;
  ordens: {
    soldagem: OrdemStatus;
    perfiladeira: OrdemStatus;
    separacao: OrdemStatus;
    qualidade: OrdemStatus;
    pintura: OrdemStatus;
  };
}

interface PedidoOrdensModalProps {
  pedido: PedidoComOrdens | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const setorConfig = {
  soldagem: {
    label: "Soldagem",
    icon: Hammer,
    tipoOrdem: "soldagem",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  perfiladeira: {
    label: "Perfiladeira",
    icon: Package,
    tipoOrdem: "perfiladeira",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  separacao: {
    label: "Separação",
    icon: Boxes,
    tipoOrdem: "separacao",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  qualidade: {
    label: "Qualidade",
    icon: Sparkles,
    tipoOrdem: "qualidade",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  pintura: {
    label: "Pintura",
    icon: CheckSquare,
    tipoOrdem: "pintura",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
} as const;

type SetorKey = keyof typeof setorConfig;

function getStatusLabel(status: string | null) {
  switch (status) {
    case "pendente":
      return { label: "Pendente", variant: "secondary" as const };
    case "em_andamento":
      return { label: "Em Andamento", variant: "default" as const };
    case "concluido":
    case "pronta":
      return { label: "Concluído", variant: "outline" as const };
    default:
      return { label: status || "-", variant: "secondary" as const };
  }
}

function OrdemContent({
  ordem,
  setor,
}: {
  ordem: OrdemStatus;
  setor: SetorKey;
}) {
  const config = setorConfig[setor];
  const { data: linhas = [], isLoading } = useLinhasOrdem(
    ordem.ordem_id || null,
    config.tipoOrdem
  );

  const statusInfo = getStatusLabel(ordem.status);
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Info da Ordem */}
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
        <div className={`p-2 rounded-md ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {ordem.numero_ordem || "Ordem"}
            </span>
            <Badge variant={statusInfo.variant} className="text-[10px]">
              {statusInfo.label}
            </Badge>
            {ordem.pausada && (
              <Badge variant="destructive" className="text-[10px] bg-orange-500">
                Pausada
              </Badge>
            )}
          </div>
          {ordem.justificativa_pausa && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Motivo pausa: {ordem.justificativa_pausa}
            </p>
          )}
        </div>
      </div>

      {/* Materiais/Linhas */}
      <div>
        <h4 className="text-sm font-medium mb-2">Materiais Necessários</h4>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum material vinculado a esta ordem
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">Material</TableHead>
                  <TableHead className="h-8 text-xs text-center w-16">Qtd</TableHead>
                  <TableHead className="h-8 text-xs">Tamanho</TableHead>
                  <TableHead className="h-8 text-xs">Dimensões</TableHead>
                  <TableHead className="h-8 text-xs text-center w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((linha) => (
                  <TableRow key={linha.id}>
                    <TableCell className="text-xs py-2">
                      {linha.estoque?.nome_produto || linha.item}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-center font-medium">
                      {linha.quantidade}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-muted-foreground">
                      {linha.tamanho || "-"}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-muted-foreground">
                      {linha.largura && linha.altura
                        ? `${linha.largura} x ${linha.altura}`
                        : linha.largura
                        ? `L: ${linha.largura}`
                        : linha.altura
                        ? `A: ${linha.altura}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center py-2">
                      {linha.concluida ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export function PedidoOrdensModal({
  pedido,
  open,
  onOpenChange,
}: PedidoOrdensModalProps) {
  // Encontrar a primeira aba disponível
  const getDefaultTab = (): SetorKey => {
    if (!pedido) return "soldagem";
    const setores: SetorKey[] = ["soldagem", "perfiladeira", "separacao", "qualidade", "pintura"];
    return setores.find((s) => pedido.ordens[s].existe) || "soldagem";
  };

  const [activeTab, setActiveTab] = useState<SetorKey>(getDefaultTab());

  if (!pedido) return null;

  const displayNumber = pedido.numero_mes ? `#${pedido.numero_mes}` : pedido.numero_pedido;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Pedido {displayNumber}</span>
            <span className="text-muted-foreground font-normal">—</span>
            <span className="font-normal text-muted-foreground">
              {pedido.nome_cliente}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SetorKey)}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-5 h-9">
            {(Object.keys(setorConfig) as SetorKey[]).map((key) => {
              const config = setorConfig[key];
              const ordem = pedido.ordens[key];
              const Icon = config.icon;
              const isDisabled = !ordem.existe;

              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  disabled={isDisabled}
                  className="text-xs gap-1 data-[state=active]:bg-background"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(setorConfig) as SetorKey[]).map((key) => {
            const ordem = pedido.ordens[key];
            if (!ordem.existe) return null;

            return (
              <TabsContent key={key} value={key} className="mt-4">
                <OrdemContent ordem={ordem} setor={key} />
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
