import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, RefreshCw } from "lucide-react";
import { useMateriaisNecessariosProducao } from "@/hooks/useMateriaisNecessariosProducao";

export function MateriaisNecessariosProducao() {
  const { data: materiais, isLoading, refetch, isFetching } = useMateriaisNecessariosProducao();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Materiais Necessários para Produção</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-[100px] w-[100px]" />
            ))}
          </div>
        ) : !materiais || materiais.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum material vinculado aos pedidos em produção
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {materiais.map((material) => (
              <div
                key={material.estoque_id}
                className="h-[100px] w-[100px] p-2 rounded-md border border-border/50 bg-muted/30 flex flex-col justify-between overflow-hidden hover:bg-muted/50 transition-colors cursor-default"
                title={`${material.nome_produto}${material.descricao_produto ? "\n" + material.descricao_produto : ""}\nQtd: ${material.quantidade_necessaria}\nMetragem: ${material.metragem_total > 0 ? material.metragem_total.toFixed(2) + " m²" : "—"}`}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-medium leading-tight line-clamp-2 text-foreground">
                    {material.nome_produto}
                  </p>
                  {material.descricao_produto && (
                    <p className="text-[8px] leading-tight line-clamp-2 text-muted-foreground">
                      {material.descricao_produto}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-primary leading-none">
                    {material.quantidade_necessaria}
                  </span>
                  {material.metragem_total > 0 && (
                    <span className="text-[9px] text-muted-foreground leading-none">
                      {material.metragem_total.toFixed(1)}m²
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
