import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMateriaisProducaoRanking } from "@/hooks/useMateriaisProducaoRanking";

export function MateriaisRanking() {
  const { rankingQuantidade, rankingMetragem, isLoading } = useMateriaisProducaoRanking();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Materiais Produzidos</CardTitle>
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ranking de Materiais Produzidos</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <Tabs defaultValue="quantidade" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="quantidade" className="text-xs">Quantidade</TabsTrigger>
            <TabsTrigger value="metragem" className="text-xs">Metragem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quantidade" className="mt-3">
            <div className="space-y-2">
              {rankingQuantidade.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Nenhum material produzido hoje
                </p>
              ) : (
                rankingQuantidade.map((material, index) => (
                  <div
                    key={material.item}
                    className="flex items-center justify-between py-2 px-3 border rounded hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={index < 3 ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                        {index + 1}º
                      </Badge>
                      <span className="text-sm font-medium">{material.item}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{material.total_quantidade}</p>
                      <p className="text-[10px] text-muted-foreground">un</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="metragem" className="mt-3">
            <div className="space-y-2">
              {rankingMetragem.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Nenhum material com metragem registrada hoje
                </p>
              ) : (
                rankingMetragem.map((material, index) => (
                  <div
                    key={material.item}
                    className="flex items-center justify-between py-2 px-3 border rounded hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={index < 3 ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                        {index + 1}º
                      </Badge>
                      <span className="text-sm font-medium">{material.item}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {material.metragem_m2?.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">m²</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
