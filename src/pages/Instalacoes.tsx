import { useState } from "react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CronogramaInstalacao } from "@/components/cronograma/CronogramaInstalacao";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { FormPonto } from "@/components/cronograma/FormPonto";
import { EditPontoSheet } from "@/components/cronograma/EditPontoSheet";

export default function Instalacoes() {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showEquipes, setShowEquipes] = useState(false);
  const [showFormPonto, setShowFormPonto] = useState(false);
  const [showEditPonto, setShowEditPonto] = useState(false);
  const [selectedPonto, setSelectedPonto] = useState<any>(null);

  const nextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));

  const handleEditPonto = (ponto: any) => {
    setSelectedPonto(ponto);
    setShowEditPonto(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cronograma de Instalações</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowFormPonto(true)} variant="outline" className="gap-2">
            <MapPin className="h-4 w-4" />
            Novo Ponto
          </Button>
          <Button onClick={() => setShowEquipes(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Gerenciar Equipes
          </Button>
        </div>
      </div>

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
    </div>
  );
}