import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMateriaisProducaoRanking } from "@/hooks/useMateriaisProducaoRanking";

const ITEMS_PER_PAGE = 11;

export function MateriaisRanking() {
  const { rankingCompleto, isLoading } = useMateriaisProducaoRanking();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(rankingCompleto.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = rankingCompleto.slice(startIndex, endIndex);

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
      <CardHeader className="pb-1 px-3 pt-3">
        <CardTitle className="text-sm">Ranking de Materiais Produzidos</CardTitle>
      </CardHeader>
      <CardContent className="pb-2 px-3">
        <div className="space-y-1">
          {currentItems.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              Nenhum material produzido hoje
            </p>
          ) : (
            currentItems.map((material, index) => {
              const globalIndex = startIndex + index;
              return (
                <div
                  key={material.item}
                  className="flex items-center justify-between py-1 px-1.5 border rounded hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <Badge variant={globalIndex < 3 ? "default" : "secondary"} className="text-[9px] px-1 py-0 shrink-0">
                      {globalIndex + 1}º
                    </Badge>
                    <span className="text-[11px] font-medium truncate">{material.item}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-[11px]">{material.total_quantidade}</p>
                      <p className="text-[8px] text-muted-foreground">un</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[11px]">
                        {material.metragem_m2 > 0 ? material.metragem_m2.toFixed(2) : "—"}
                      </p>
                      <p className="text-[8px] text-muted-foreground">m²</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 text-[10px]"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Anterior
            </Button>
            <span className="text-[10px] text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 text-[10px]"
            >
              Próximo
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
