import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, ChevronLeft, ChevronRight, Paintbrush, Wrench, Flame } from "lucide-react";
import { useRankingPintura, useRankingPerfiladeira, useRankingSolda, RankingColaborador } from "@/hooks/useRankingProducao";

const ITEMS_PER_PAGE = 5;

interface RankingListProps {
  ranking: RankingColaborador[];
  isLoading: boolean;
  unidade: string;
  onColaboradorClick?: (userId: string) => void;
}

function RankingList({ ranking, isLoading, unidade, onColaboradorClick }: RankingListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(ranking.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = ranking.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Carregando ranking...
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma pontuação registrada este mês
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {currentItems.map((colaborador, index) => {
          const globalIndex = startIndex + index;
          return (
            <div 
              key={colaborador.user_id}
              className={`flex items-center gap-2 p-1.5 px-2 rounded-lg transition-colors h-[35px] cursor-pointer ${
                globalIndex < 3 ? 'bg-accent/50 hover:bg-accent/70' : 'hover:bg-accent/30'
              }`}
              onClick={() => onColaboradorClick?.(colaborador.user_id)}
            >
              <div className="flex items-center justify-center w-6">
                {globalIndex === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                {globalIndex === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                {globalIndex === 2 && <Medal className="h-4 w-4 text-amber-700" />}
                {globalIndex > 2 && <span className="text-[10px] font-medium text-muted-foreground">{globalIndex + 1}º</span>}
              </div>
              <Avatar className="h-6 w-6">
                <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                <AvatarFallback className="text-[8px]">{colaborador.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[10px] truncate">{colaborador.nome}</p>
                <p className="text-[8px] text-muted-foreground">{colaborador.total_ordens} ordens</p>
              </div>
              <Badge variant="secondary" className="text-[9px] font-bold h-5 px-1.5">
                {colaborador.total_pontos.toFixed(1)} {unidade}
              </Badge>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-6 text-[9px] px-2"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Anterior
          </Button>
          <span className="text-[9px] text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-6 text-[9px] px-2"
          >
            Próximo
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </>
  );
}

export function RankingPorSetor() {
  const navigate = useNavigate();
  const { data: rankingPintura = [], isLoading: loadingPintura } = useRankingPintura();
  const { data: rankingPerfiladeira = [], isLoading: loadingPerfiladeira } = useRankingPerfiladeira();
  const { data: rankingSolda = [], isLoading: loadingSolda } = useRankingSolda();

  const handleColaboradorClick = (userId: string) => {
    navigate(`/hub-fabrica/colaborador/${userId}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Rankings de Produção - Mês Atual</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ranking Pintura */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Paintbrush className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Pintura</h3>
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">
            Pontuação por m² de portas pintadas
          </div>
          <RankingList ranking={rankingPintura} isLoading={loadingPintura} unidade="m²" onColaboradorClick={handleColaboradorClick} />
        </Card>

        {/* Ranking Perfiladeira */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Perfiladeira</h3>
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">
            Pontuação por metro de linhas concluídas
          </div>
          <RankingList ranking={rankingPerfiladeira} isLoading={loadingPerfiladeira} unidade="m" onColaboradorClick={handleColaboradorClick} />
        </Card>

        {/* Ranking Solda */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Solda</h3>
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">
            Pontuação por item (definida no estoque)
          </div>
          <RankingList ranking={rankingSolda} isLoading={loadingSolda} unidade="pts" onColaboradorClick={handleColaboradorClick} />
        </Card>
      </div>
    </div>
  );
}
