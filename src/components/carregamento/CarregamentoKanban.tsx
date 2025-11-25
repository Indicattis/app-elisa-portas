import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, RefreshCw, Truck, PackageCheck, Calendar, MapPin, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemCardProps {
  ordem: OrdemCarregamento;
  onIniciarColeta: (ordem: OrdemCarregamento) => void;
  podeIniciar: boolean;
}

function OrdemCard({ ordem, onIniciarColeta, podeIniciar }: OrdemCardProps) {
  const Icon = ordem.tipo_carregamento === 'elisa' ? Truck : PackageCheck;

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all overflow-hidden",
        !podeIniciar && "opacity-60"
      )}
    >
      {/* HEADER */}
      <CardHeader className="h-[40px] py-0 px-4 border-b bg-muted/30 flex items-center justify-center">
        <div className="flex items-center justify-between w-full gap-4 h-full">
          <div className="flex items-center gap-3 text-xs">
            {ordem.pedido?.numero_pedido && (
              <span className="font-medium text-muted-foreground">
                Pedido #{ordem.pedido.numero_pedido}
              </span>
            )}
            <span className="font-bold">
              {ordem.nome_cliente}
            </span>
            {ordem.venda?.cidade && ordem.venda?.estado && (
              <span className="text-muted-foreground">
                {ordem.venda.cidade} - {ordem.venda.estado}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={ordem.tipo_carregamento === 'elisa' ? 'default' : 'outline'} 
              className="flex items-center gap-1 text-xs h-5"
            >
              <Icon className="h-3 w-3" />
              {ordem.tipo_carregamento === 'elisa' ? 'Elisa' : 'Autorizado'}
            </Badge>
            <Badge variant={podeIniciar ? 'default' : 'secondary'} className="text-xs h-5">
              {ordem.status === 'agendada' ? 'Agendada' : ordem.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {/* BODY */}
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* LATERAL ESQUERDA - Ícone */}
          <div 
            className="flex-shrink-0 cursor-pointer"
            onClick={() => podeIniciar && onIniciarColeta(ordem)}
          >
            <div className="h-[100px] w-[100px] rounded-full bg-muted/50 flex items-center justify-center">
              <Icon className="h-12 w-12 text-muted-foreground/70" />
            </div>
          </div>

          {/* CENTRO - Informações */}
          <div 
            className="flex-1 space-y-3 cursor-pointer min-w-0"
            onClick={() => podeIniciar && onIniciarColeta(ordem)}
          >
            {ordem.data_carregamento && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Data Agendada
                </p>
                <p className="text-sm font-semibold">
                  {format(new Date(ordem.data_carregamento), "dd/MM/yyyy", { locale: ptBR })}
                  {ordem.hora && ` às ${ordem.hora}`}
                </p>
              </div>
            )}
            
            {ordem.responsavel_carregamento_nome && (
              <div>
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="text-sm font-semibold truncate">{ordem.responsavel_carregamento_nome}</p>
              </div>
            )}

            {ordem.venda?.cidade && ordem.venda?.estado && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Localização
                </p>
                <p className="text-sm truncate">
                  {ordem.venda.cidade} - {ordem.venda.estado}
                </p>
              </div>
            )}

            {ordem.venda?.cliente_telefone && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Telefone
                </p>
                <p className="text-sm">{ordem.venda.cliente_telefone}</p>
              </div>
            )}

            {ordem.observacoes && (
              <div>
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="text-xs line-clamp-2">{ordem.observacoes}</p>
              </div>
            )}
          </div>

          {/* LATERAL DIREITA - Botão Iniciar */}
          <div className="flex-shrink-0">
            <Button
              size="lg"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                onIniciarColeta(ordem);
              }}
              disabled={!podeIniciar}
              className="h-[100px] w-[100px] rounded-full flex flex-col gap-2 p-2"
            >
              <PackageCheck className="h-8 w-8" />
              <span className="text-xs font-semibold">
                {podeIniciar ? 'Iniciar Coleta' : 'Aguardando'}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CarregamentoKanbanProps {
  ordens: OrdemCarregamento[];
  isLoading: boolean;
  onIniciarColeta: (ordem: OrdemCarregamento) => void;
  onRefresh?: () => void;
}

export function CarregamentoKanban({
  ordens,
  isLoading,
  onIniciarColeta,
  onRefresh,
}: CarregamentoKanbanProps) {
  const podeIniciarColeta = (ordem: OrdemCarregamento) => {
    return !ordem.carregamento_concluido;
  };

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Ordens Pendentes
          </h2>
          <Badge variant="secondary">{isLoading ? '...' : ordens.length}</Badge>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        )}
      </div>

      {/* Lista de Ordens */}
      <div className="space-y-3">
        {isLoading ? (
          renderSkeletons()
        ) : ordens.length > 0 ? (
          ordens.map(ordem => (
            <OrdemCard
              key={ordem.id}
              ordem={ordem}
              onIniciarColeta={onIniciarColeta}
              podeIniciar={podeIniciarColeta(ordem)}
            />
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhuma ordem de carregamento pendente
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
