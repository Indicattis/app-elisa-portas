import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { useCoresPintadasHoje } from "@/hooks/useCoresPintadasHoje";

const ITEMS_PER_PAGE = 5;

export function CoresPintadasHoje() {
  const { data: cores = [], isLoading } = useCoresPintadasHoje();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(cores.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = cores.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Cores Pintadas Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-1 px-3 pt-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5" />
          Cores Pintadas Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2 px-3">
        {cores.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Nenhuma peça pintada hoje
          </p>
        ) : (
          <>
            <div className="space-y-0.5">
              {currentItems.map((cor) => (
                <div
                  key={cor.cor_nome}
                  className="flex items-center justify-between py-1.5 px-2 border rounded hover:bg-accent/50 transition-colors h-[35px]"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-primary/60 shrink-0" />
                    <span className="text-[10px] font-medium truncate">{cor.cor_nome}</span>
                  </div>
                  <Badge variant="secondary" className="text-[8px] py-0 px-1.5 h-4 shrink-0">
                    {cor.quantidade_pecas} {cor.quantidade_pecas === 1 ? 'peça' : 'peças'}
                  </Badge>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-6 text-[9px] px-2"
                >
                  <ChevronLeft className="h-3 w-3 mr-0.5" />
                  Anterior
                </Button>
                <span className="text-[9px] text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-6 text-[9px] px-2"
                >
                  Próximo
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
