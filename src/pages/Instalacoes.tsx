import { useState, useRef, useEffect } from "react";
import { format, startOfWeek, addWeeks, subWeeks, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, MapPin, Download, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CronogramaInstalacao } from "@/components/cronograma/CronogramaInstalacao";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { FormPonto } from "@/components/cronograma/FormPonto";
import { EditPontoSheet } from "@/components/cronograma/EditPontoSheet";
import { CadastroInstalacaoForm } from "@/components/cadastro-instalacao/CadastroInstalacaoForm";
import { InstalacoesList } from "@/components/cadastro-instalacao/InstalacoesList";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { usePontosInstalacao } from "@/hooks/usePontosInstalacao";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { baixarCronogramaPDF } from "@/utils/cronogramaPDFGenerator";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export default function Instalacoes() {
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showEquipes, setShowEquipes] = useState(false);
  const [showFormPonto, setShowFormPonto] = useState(false);
  const [showEditPonto, setShowEditPonto] = useState(false);
  const [selectedPonto, setSelectedPonto] = useState<any>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState("cronograma");
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const swipeRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Hooks para dados
  const { equipes } = useEquipesInstalacao();
  const { pontos } = usePontosInstalacao(currentWeek);
  const { instalacoes, loading: loadingInstalacoes, createInstalacao, deleteInstalacao } = useInstalacoesCadastradas();

  // Navegação de dias e semanas
  const nextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const prevDay = () => setCurrentDate(prev => addDays(prev, -1));
  const nextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));

  // Gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    touchEndX.current = e.targetTouches[0].clientX;
    const diff = touchEndX.current - touchStartX.current;
    
    const maxOffset = 100;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setSwipeOffset(clampedOffset);
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    setIsAnimating(true);
    
    if (isLeftSwipe) {
      nextDay();
    } else if (isRightSwipe) {
      prevDay();
    }
    
    setTimeout(() => {
      setSwipeOffset(0);
      setIsAnimating(false);
    }, 300);
  };

  const handleEditPonto = (ponto: any) => {
    setSelectedPonto(ponto);
    setShowEditPonto(true);
  };

  const handleDownloadPDF = () => {
    try {
      baixarCronogramaPDF({
        equipes,
        pontos,
        weekStart: currentWeek
      });
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O cronograma de instalações foi baixado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o cronograma. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Header com abas */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Instalações</h1>
              <p className="text-sm text-muted-foreground">
                {activeTab === "cronograma" ? "Gerencie cronogramas de instalação" : "Cadastre novas instalações"}
              </p>
            </div>
            
            {activeTab === "cronograma" && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownloadPDF}
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {!isMobile && "Baixar PDF"}
                </Button>
                <Button 
                  onClick={() => setShowFormPonto(true)} 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {!isMobile && "Novo Ponto"}
                </Button>
                <Button 
                  onClick={() => setShowEquipes(true)} 
                  size={isMobile ? "sm" : "default"}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {!isMobile && "Equipes"}
                </Button>
              </div>
            )}
          </div>

          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
            <TabsTrigger value="cadastro">
              <MapPin className="h-4 w-4 mr-2" />
              Cadastro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cronograma" className="mt-0">
            {/* Mobile Day Navigation */}
            {isMobile ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={prevDay}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-center">
                      <CardTitle className="text-base">
                        {format(currentDate, "EEEE", { locale: ptBR })}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    
                    <Button variant="ghost" size="sm" onClick={nextDay}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-center text-muted-foreground mt-2">
                    Arraste para navegar entre os dias
                  </div>
                </CardHeader>
                
                <CardContent 
                  ref={swipeRef}
                  className="p-0 swipe-container"
                  style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <MobileDayView 
                    currentDate={currentDate} 
                    onEditPonto={handleEditPonto}
                    onAddPonto={() => setShowFormPonto(true)}
                  />
                </CardContent>
              </Card>
            ) : (
              /* Desktop Week View */
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Semana de {format(currentWeek, "dd 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={prevWeek}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextWeek}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <CronogramaInstalacao 
                    currentWeek={currentWeek} 
                    onEditPonto={handleEditPonto}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cadastro" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário */}
              <Card>
                <CardHeader>
                  <CardTitle>Nova Instalação</CardTitle>
                </CardHeader>
                <CardContent>
                  <CadastroInstalacaoForm
                    onSubmit={async (data) => {
                      await createInstalacao(data);
                    }}
                  />
                </CardContent>
              </Card>

              {/* Lista */}
              <div>
                <InstalacoesList
                  instalacoes={instalacoes}
                  onDelete={deleteInstalacao}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GerenciarEquipes 
        open={showEquipes} 
        onOpenChange={setShowEquipes} 
      />

      <FormPonto 
        open={showFormPonto} 
        onOpenChange={setShowFormPonto} 
      />

      <EditPontoSheet
        open={showEditPonto}
        onOpenChange={setShowEditPonto}
        ponto={selectedPonto}
        currentWeek={currentWeek}
      />
    </>
  );
}

// Componente para visualização mobile do dia
function MobileDayView({ 
  currentDate, 
  onEditPonto,
  onAddPonto 
}: { 
  currentDate: Date; 
  onEditPonto: (ponto: any) => void;
  onAddPonto: () => void;
}) {
  const { equipes } = useEquipesInstalacao();
  const { pontos, updatePonto, deletePonto } = usePontosInstalacao(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const { draggedItem, handleDragStart, handleDragEnd } = useDragAndDrop();
  
  const dayOfWeek = currentDate.getDay();
  const pontosNoDia = pontos.filter(p => p.dia_semana === dayOfWeek);

  const handleDrop = async (equipId: string) => {
    if (draggedItem && draggedItem.equipId !== equipId) {
      await updatePonto(
        draggedItem.id,
        equipId,
        draggedItem.cidade,
        dayOfWeek
      );
    }
  };

  return (
    <div className="divide-y">
      {equipes.map((equipe) => {
        const pontosEquipe = pontosNoDia.filter(p => p.equipe_id === equipe.id);
        
        return (
          <MobileEquipeCard
            key={equipe.id}
            equipe={equipe}
            pontos={pontosEquipe}
            onDrop={handleDrop}
            onEditPonto={onEditPonto}
            onDeletePonto={deletePonto}
            onAddPonto={onAddPonto}
            draggedItem={draggedItem}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        );
      })}
    </div>
  );
}

// Card de equipe para mobile
function MobileEquipeCard({ 
  equipe, 
  pontos, 
  onDrop, 
  onEditPonto, 
  onDeletePonto,
  onAddPonto,
  draggedItem,
  onDragStart,
  onDragEnd
}: any) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const canDrop = draggedItem && draggedItem.equipId !== equipe.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (canDrop) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (canDrop) {
      onDrop(equipe.id);
      setIsDragOver(false);
    }
  };

  return (
    <div 
      className={`p-4 transition-all duration-200 ${
        isDragOver && canDrop 
          ? 'bg-primary/10 border-l-4 border-l-primary' 
          : 'border-l-4'
      }`}
      style={{ 
        borderLeftColor: isDragOver && canDrop ? undefined : equipe.cor 
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header da Equipe */}
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-4 h-4 rounded-full flex-shrink-0" 
          style={{ backgroundColor: equipe.cor }}
        />
        <h3 className="font-semibold text-base">{equipe.nome}</h3>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-muted rounded-full px-2 py-1">
            <span className="text-xs font-medium">{pontos.length}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted touch-manipulation"
            onClick={onAddPonto}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Pontos de Instalação */}
      <div className="space-y-2">
        {pontos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-4">Nenhum ponto agendado</p>
            <Button
              onClick={onAddPonto}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Ponto
            </Button>
          </div>
        ) : (
          pontos.map((ponto: any) => (
            <MobilePontoCard
              key={ponto.id}
              ponto={ponto}
              cor={equipe.cor}
              onEdit={() => onEditPonto(ponto)}
              onDelete={() => onDeletePonto(ponto.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Card de ponto para mobile
function MobilePontoCard({ 
  ponto, 
  cor, 
  onEdit, 
  onDelete, 
  onDragStart, 
  onDragEnd 
}: any) {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart({
      id: ponto.id,
      equipId: ponto.equipe_id,
      cidade: ponto.cidade
    });
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`mobile-point-card touch-manipulation ${isPressed ? 'scale-95' : ''}`}
      style={{ 
        borderLeftColor: cor, 
        borderLeftWidth: '3px'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{ponto.cidade}</h4>
          {ponto.observacoes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {ponto.observacoes}
            </p>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted touch-manipulation"
            onClick={onEdit}
          >
            <MapPin className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 touch-manipulation"
            onClick={onDelete}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
