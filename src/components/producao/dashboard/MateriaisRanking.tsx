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
      <CardHeader>
        <CardTitle>Ranking de Materiais Produzidos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quantidade" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quantidade">Por Quantidade</TabsTrigger>
            <TabsTrigger value="metragem">Por Metragem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quantidade" className="mt-4">
            <div className="space-y-3">
              {rankingQuantidade.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum material produzido hoje
                </p>
              ) : (
                rankingQuantidade.map((material, index) => (
                  <div
                    key={material.item}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        {index + 1}º
                      </Badge>
                      <span className="font-medium">{material.item}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{material.total_quantidade}</p>
                      <p className="text-xs text-muted-foreground">unidades</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="metragem" className="mt-4">
            <div className="space-y-3">
              {rankingMetragem.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum material com metragem registrada hoje
                </p>
              ) : (
                rankingMetragem.map((material, index) => (
                  <div
                    key={material.item}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        {index + 1}º
                      </Badge>
                      <span className="font-medium">{material.item}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {material.metragem_m2?.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">m²</p>
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
