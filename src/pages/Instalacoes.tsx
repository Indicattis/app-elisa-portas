import { useState, useRef } from "react";
import { format, startOfWeek, addWeeks, subWeeks, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Download, Settings, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CronogramaInstalacao } from "@/components/cronograma/CronogramaInstalacao";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { CadastroInstalacaoForm } from "@/components/cadastro-instalacao/CadastroInstalacaoForm";
import { InstalacoesTabelaView } from "@/components/cadastro-instalacao/InstalacoesTabelaView";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useInstalacoesCronograma } from "@/hooks/useInstalacoesCronograma";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";
import { baixarCronogramaPDF } from "@/utils/cronogramaPDFGenerator";
import { baixarInstalacoesPDF } from "@/utils/instalacoesPDFGenerator";
import { useToast } from "@/hooks/use-toast";

export default function Instalacoes() {
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showEquipes, setShowEquipes] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState("cronograma");
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const swipeRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  // Hooks para dados
  const { equipes } = useEquipesInstalacao();
  const { instalacoes: instalacoesSemanais } = useInstalacoesCronograma(currentWeek);
  const { 
    instalacoes, 
    loading: loadingInstalacoes, 
    createInstalacao, 
    deleteInstalacao, 
    updateInstalacao,
    alterarParaCorrecao,
    updateStatus 
  } = useInstalacoesCadastradas();

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

  const handleDownloadPDF = () => {
    try {
      baixarCronogramaPDF({
        equipes,
        instalacoes: instalacoesSemanais,
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

  const handleDownloadInstalacoesPDF = () => {
    try {
      baixarInstalacoesPDF({
        instalacoes
      });
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O relatório de instalações foi baixado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
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
                {activeTab === "cronograma" 
                  ? "Gerencie cronogramas de instalação" 
                  : "Visualize todas as instalações cadastradas"}
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
                  onClick={() => setShowEquipes(true)} 
                  size={isMobile ? "sm" : "default"}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {!isMobile && "Gerenciar Equipes"}
                </Button>
              </div>
            )}
            
            {activeTab === "lista" && (
              <div className="flex gap-2">
                {isAdmin && (
                  <Button 
                    onClick={() => setShowCadastroModal(true)}
                    size={isMobile ? "sm" : "default"}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    {!isMobile && "Nova Instalação"}
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsList className="grid w-full max-w-xl grid-cols-2 mb-6">
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
            <TabsTrigger value="lista">
              <MapPin className="h-4 w-4 mr-2" />
              Instalações
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
                    onEditPonto={() => {}}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="lista" className="mt-0">
            <InstalacoesTabelaView
              instalacoes={instalacoes}
              onDelete={deleteInstalacao}
              onUpdate={updateInstalacao}
              onAlterarParaCorrecao={alterarParaCorrecao}
              onUpdateStatus={updateStatus}
              isAdmin={isAdmin}
            />
          </TabsContent>
        </Tabs>
      </div>

      <GerenciarEquipes 
        open={showEquipes} 
        onOpenChange={setShowEquipes} 
      />

      <Dialog open={showCadastroModal} onOpenChange={setShowCadastroModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Instalação</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova instalação
            </DialogDescription>
          </DialogHeader>
          <CadastroInstalacaoForm 
            onSubmit={async (data) => {
              await createInstalacao(data);
              setShowCadastroModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente para visualização mobile do dia
function MobileDayView({ 
  currentDate
}: { 
  currentDate: Date; 
}) {
  const { equipes } = useEquipesInstalacao();
  const { instalacoes } = useInstalacoesCronograma(startOfWeek(currentDate, { weekStartsOn: 1 }));
  
  const dayOfWeek = currentDate.getDay();
  const instalacoesNoDia = instalacoes.filter(i => i.dia_semana === dayOfWeek);

  return (
    <div className="divide-y">
      {equipes.map((equipe) => {
        const instalacoesEquipe = instalacoesNoDia.filter(i => i.responsavel_instalacao_id === equipe.id);
        
        return (
          <div 
            key={equipe.id}
            className="p-4 border-l-4"
            style={{ borderLeftColor: equipe.cor }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: equipe.cor }}
              />
              <h3 className="font-semibold text-base">{equipe.nome}</h3>
              <div className="ml-auto flex items-center gap-2">
                <div className="bg-muted rounded-full px-2 py-1">
                  <span className="text-xs font-medium">{instalacoesEquipe.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {instalacoesEquipe.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma instalação agendada</p>
                </div>
              ) : (
                instalacoesEquipe.map((instalacao) => (
                  <div
                    key={instalacao.id}
                    className="bg-card border border-border rounded-lg p-3"
                    style={{ borderLeftColor: equipe.cor, borderLeftWidth: '4px' }}
                  >
                    <div className="font-semibold text-sm mb-1">
                      {instalacao.nome_cliente}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{instalacao.cidade}</span>
                    </div>
                    {instalacao.tamanho && (
                      <div className="text-xs text-muted-foreground">
                        {instalacao.tamanho}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
