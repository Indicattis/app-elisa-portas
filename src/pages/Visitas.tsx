import { useVisitas } from "@/hooks/useVisitas";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TURNO_LABELS, STATUS_LABELS, VisitaTecnicaWithLead } from "@/types/visita";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Visitas() {
  const navigate = useNavigate();
  const { visitas, loading, marcarConcluida, cancelarVisita } = useVisitas();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedVisita, setSelectedVisita] = useState<VisitaTecnicaWithLead | null>(null);
  const [statusFiltros, setStatusFiltros] = useState<string[]>(['agendada', 'realizada', 'atrasada']);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'default';
      case 'realizada':
        return 'secondary';
      case 'atrasada':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getVisitaStyle = (visita: VisitaTecnicaWithLead) => {
    const status = getVisitaStatus(visita);
    switch (status) {
      case 'agendada':
        return "bg-blue-100 border-blue-300 text-blue-800";
      case 'realizada':
        return "bg-green-100 border-green-300 text-green-800";
      case 'atrasada':
        return "bg-red-100 border-red-300 text-red-800";
      default:
        return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  const getVisitaStatus = (visita: VisitaTecnicaWithLead): string => {
    if (visita.status === 'concluida') {
      return 'realizada';
    }
    if (visita.status === 'agendada') {
      const hoje = new Date();
      const dataVisita = new Date(visita.data_visita);
      hoje.setHours(0, 0, 0, 0);
      dataVisita.setHours(0, 0, 0, 0);
      
      if (dataVisita < hoje) {
        return 'atrasada';
      }
      return 'agendada';
    }
    return visita.status;
  };

  const statusOptions = [
    { value: 'agendada', label: 'Agendada', color: 'blue' },
    { value: 'realizada', label: 'Realizada', color: 'green' },
    { value: 'atrasada', label: 'Atrasada', color: 'red' }
  ];

  const toggleStatusFiltro = (status: string) => {
    setStatusFiltros(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleVisitaDoubleClick = (visita: VisitaTecnicaWithLead) => {
    setSelectedVisita(visita);
  };

  const handleNovaVisita = () => {
    navigate('/dashboard/nova-visita');
  };

  const getDaysInMonth = (month: number, year: number) => {
    const date = new Date(year, month + 1, 0);
    return date.getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    return date.getDay();
  };

  const canManageVisita = (visita: VisitaTecnicaWithLead) => {
    return visita.responsavel_id === user?.id;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32"></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dataString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const visitasNoDiaFiltradas = visitas.filter(v => {
        const visitaDataString = v.data_visita;
        const status = getVisitaStatus(v);
        return visitaDataString === dataString && statusFiltros.includes(status);
      });

      days.push(
        <div
          key={day}
          className="h-32 border border-border p-1 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{day}</span>
          </div>

          {/* Lista de visitas em formato de linha */}
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {visitasNoDiaFiltradas.map((visita) => (
              <div
                key={visita.id}
                className={cn(
                  "h-6 flex items-center gap-1 px-1 rounded text-xs group relative cursor-pointer hover:shadow-sm transition-all",
                  getVisitaStyle(visita)
                )}
                onClick={() => handleVisitaDoubleClick(visita)}
                title={`Clique para ver detalhes - ${visita.lead.nome} - ${TURNO_LABELS[visita.turno]} - ${visita.lead.cidade || 'Cidade não informada'}`}
              >
                {/* Ícone do turno */}
                <Clock className="h-3 w-3 flex-shrink-0" />
                
                {/* Nome do cliente */}
                <span className="font-medium truncate flex-shrink-0 min-w-0">
                  {visita.lead.nome}
                </span>
                
                {/* Turno */}
                <span className="text-muted-foreground truncate flex-1 min-w-0">
                  {TURNO_LABELS[visita.turno]}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const visitasComStatus = visitas.map(visita => ({
    ...visita,
    statusCalculado: getVisitaStatus(visita)
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendário de Visitas</h1>
        
        <div className="flex items-center gap-4">
          <Button onClick={handleNovaVisita} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Button>

          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Filtros por Status</h3>
        <div className="flex items-center gap-4 flex-wrap">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all",
                statusFiltros.includes(option.value)
                  ? `bg-${option.color}-50 border-${option.color}-200 shadow-sm`
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              )}
              onClick={() => toggleStatusFiltro(option.value)}
            >
              <div className={`h-3 w-3 rounded-full bg-${option.color}-500`} />
              <div className="text-sm">
                <span className={cn(
                  "font-semibold",
                  statusFiltros.includes(option.value) ? `text-${option.color}-700` : "text-gray-700"
                )}>
                  {option.label}
                </span>
                <div className={cn(
                  "text-lg font-bold",
                  statusFiltros.includes(option.value) ? `text-${option.color}-800` : "text-gray-800"
                )}>
                  {visitasComStatus.filter(v => v.statusCalculado === option.value).length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-lg border">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="p-3 text-center font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Dias do calendário */}
        <div className="grid grid-cols-7">
          {renderCalendar()}
        </div>
      </div>

      {/* Modal de detalhes da visita */}
      {selectedVisita && (
        <Card className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {selectedVisita.lead.nome}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Telefone: {selectedVisita.lead.telefone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getStatusBadgeVariant(getVisitaStatus(selectedVisita))}>
                    {getVisitaStatus(selectedVisita) === 'realizada' ? 'Realizada' : 
                     getVisitaStatus(selectedVisita) === 'atrasada' ? 'Atrasada' : 'Agendada'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedVisita(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedVisita.data_visita), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{TURNO_LABELS[selectedVisita.turno]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {selectedVisita.lead.endereco_rua}, {selectedVisita.lead.endereco_numero} - {selectedVisita.lead.endereco_bairro}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Responsável: {selectedVisita.responsavel_nome}</span>
                </div>
              </div>

              {selectedVisita.observacoes && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Observações:</p>
                  <p className="text-sm">{selectedVisita.observacoes}</p>
                </div>
              )}

              {selectedVisita.status === 'agendada' && canManageVisita(selectedVisita) && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      marcarConcluida(selectedVisita.id);
                      setSelectedVisita(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar como Concluída
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      cancelarVisita(selectedVisita.id);
                      setSelectedVisita(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar Visita
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}