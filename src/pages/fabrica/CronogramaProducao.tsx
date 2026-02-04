import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { DelayedParticles } from "@/components/DelayedParticles";
import { ColunaOrdensProducao } from "@/components/cronograma/ColunaOrdensProducao";
import { useOrdensProducaoPrioridade, TipoOrdemProducao, OrdemProducaoSimples } from "@/hooks/useOrdensProducaoPrioridade";

const COLUNAS: { tipo: TipoOrdemProducao; titulo: string; cor: string }[] = [
  { tipo: 'perfiladeira', titulo: 'Perfiladeira', cor: 'blue' },
  { tipo: 'soldagem', titulo: 'Solda', cor: 'orange' },
  { tipo: 'separacao', titulo: 'Separação', cor: 'purple' },
  { tipo: 'qualidade', titulo: 'Qualidade', cor: 'emerald' },
  { tipo: 'pintura', titulo: 'Pintura', cor: 'pink' },
];

export default function CronogramaProducao() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Hooks para cada tipo de ordem
  const perfiladeira = useOrdensProducaoPrioridade('perfiladeira');
  const soldagem = useOrdensProducaoPrioridade('soldagem');
  const separacao = useOrdensProducaoPrioridade('separacao');
  const qualidade = useOrdensProducaoPrioridade('qualidade');
  const pintura = useOrdensProducaoPrioridade('pintura');

  const ordensMap: Record<TipoOrdemProducao, {
    ordens: OrdemProducaoSimples[];
    isLoading: boolean;
    reorganizarOrdens: (ordens: OrdemProducaoSimples[]) => void;
    refetch: () => void;
  }> = {
    perfiladeira,
    soldagem,
    separacao,
    qualidade,
    pintura,
  };

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Encontrar qual coluna contém o item sendo arrastado
    for (const coluna of COLUNAS) {
      const ordensData = ordensMap[coluna.tipo];
      const activeIndex = ordensData.ordens.findIndex(o => o.id === active.id);
      const overIndex = ordensData.ordens.findIndex(o => o.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const novasOrdens = arrayMove(ordensData.ordens, activeIndex, overIndex);
        ordensData.reorganizarOrdens(novasOrdens);
        break;
      }
    }
  };

  const handleRefreshAll = () => {
    Object.values(ordensMap).forEach(data => data.refetch());
  };

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden relative">
      <DelayedParticles />
      
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Fábrica", path: "/fabrica" },
          { label: "Cronograma" }
        ]} 
        mounted={mounted} 
      />

      <FloatingProfileMenu mounted={mounted} />

      {/* Header */}
      <header className="relative z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/fabrica')}
            className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                       hover:bg-white/10 transition-all duration-300"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
            }}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </button>

          <h1 
            className="text-xl font-bold text-white"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.5s ease 200ms'
            }}
          >
            Cronograma de Produção
          </h1>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(20px)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-4 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="h-full w-full">
            <div 
              className="flex gap-4 pb-4 min-h-[calc(100vh-140px)]"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms'
              }}
            >
              {COLUNAS.map((coluna) => (
                <ColunaOrdensProducao
                  key={coluna.tipo}
                  tipo={coluna.tipo}
                  titulo={coluna.titulo}
                  ordens={ordensMap[coluna.tipo].ordens}
                  isLoading={ordensMap[coluna.tipo].isLoading}
                  cor={coluna.cor}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DndContext>
      </main>
    </div>
  );
}
