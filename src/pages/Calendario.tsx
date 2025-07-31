import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Clock, Users, Tag, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface EventoCalendario {
  id: string;
  nome_evento: string;
  horario_evento: string;
  data_evento: string;
  categoria: 'data_comemorativa' | 'reuniao' | 'evento' | 'campanha';
  descricao_evento?: string;
  created_by: string;
  created_at: string;
  membros?: { user_id: string; nome: string; email: string; foto_perfil_url?: string }[];
}

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  foto_perfil_url?: string;
}

const categoriaLabels = {
  data_comemorativa: { label: "Data Comemorativa", color: "bg-purple-500" },
  reuniao: { label: "Reunião", color: "bg-blue-500" },
  evento: { label: "Evento", color: "bg-green-500" },
  campanha: { label: "Campanha", color: "bg-orange-500" }
};

export default function Calendario() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [eventosSelecionados, setEventosSelecionados] = useState<EventoCalendario[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [novoEvento, setNovoEvento] = useState({
    nome_evento: "",
    horario_evento: "",
    categoria: "",
    descricao_evento: "",
    membros: [] as string[]
  });
  
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    carregarEventos();
    carregarUsuarios();
  }, []);

  useEffect(() => {
    const eventosDoDia = eventos.filter(evento => 
      isSameDay(parseISO(evento.data_evento), selectedDate)
    );
    setEventosSelecionados(eventosDoDia);
  }, [selectedDate, eventos]);

  const carregarEventos = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos_calendario')
        .select(`
          *,
          eventos_membros (
            user_id,
            admin_users (
              nome,
              email,
              foto_perfil_url
            )
          )
        `);

      if (error) throw error;

      const eventosFormatados = data.map(evento => ({
        ...evento,
        categoria: evento.categoria as 'data_comemorativa' | 'reuniao' | 'evento' | 'campanha',
        membros: evento.eventos_membros?.map((membro: any) => ({
          user_id: membro.user_id,
          nome: membro.admin_users?.nome || '',
          email: membro.admin_users?.email || '',
          foto_perfil_url: membro.admin_users?.foto_perfil_url
        })) || []
      }));

      setEventos(eventosFormatados);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
    }
  };

  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, email, foto_perfil_url')
        .eq('ativo', true);

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const criarEvento = async () => {
    if (!novoEvento.nome_evento || !novoEvento.horario_evento || !novoEvento.categoria) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Criar evento
      const { data: evento, error: eventoError } = await supabase
        .from('eventos_calendario')
        .insert({
          nome_evento: novoEvento.nome_evento,
          horario_evento: novoEvento.horario_evento,
          data_evento: format(selectedDate, 'yyyy-MM-dd'),
          categoria: novoEvento.categoria,
          descricao_evento: novoEvento.descricao_evento,
          created_by: user?.id
        })
        .select()
        .single();

      if (eventoError) throw eventoError;

      // Adicionar membros
      if (novoEvento.membros.length > 0) {
        const membrosData = novoEvento.membros.map(userId => ({
          evento_id: evento.id,
          user_id: userId
        }));

        const { error: membrosError } = await supabase
          .from('eventos_membros')
          .insert(membrosData);

        if (membrosError) throw membrosError;
      }

      toast.success('Evento criado com sucesso!');
      setNovoEvento({
        nome_evento: "",
        horario_evento: "",
        categoria: "",
        descricao_evento: "",
        membros: []
      });
      setIsSheetOpen(false);
      carregarEventos();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
    }
  };

  const renderCalendarioAnual = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentMonth.getFullYear(), i, 1);
      months.push(monthDate);
    }

    if (isMobile) {
      // Em mobile, mostrar um mês por vez com navegação
      const currentMonthIndex = currentMonth.getMonth();
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonthIndex - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonthIndex + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {renderMes(currentMonth)}
        </div>
      );
    }

    // Desktop: grade de 4x3 meses
    return (
      <div className="grid grid-cols-4 gap-4">
        {months.map((month) => (
          <div key={month.getMonth()} className="space-y-2">
            <h3 className="text-sm font-medium text-center">
              {format(month, 'MMMM', { locale: ptBR })}
            </h3>
            {renderMes(month)}
          </div>
        ))}
      </div>
    );
  };

  const renderMes = (month: Date) => {
    const startOfCurrentMonth = startOfMonth(month);
    const endOfCurrentMonth = endOfMonth(month);
    const daysInMonth = eachDayOfInterval({
      start: startOfCurrentMonth,
      end: endOfCurrentMonth
    });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <div key={index} className="text-xs text-center p-1 font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Dias vazios no início do mês */}
        {Array.from({ length: startOfCurrentMonth.getDay() }, (_, index) => (
          <div key={`empty-${index}`} className="p-1" />
        ))}
        
        {/* Dias do mês */}
        {daysInMonth.map((day) => {
          const hasEvent = eventos.some(evento => 
            isSameDay(parseISO(evento.data_evento), day)
          );
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`
                relative w-8 h-8 rounded-full text-xs flex items-center justify-center
                transition-colors hover:bg-accent
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${hasEvent && !isSelected ? 'bg-secondary text-secondary-foreground' : ''}
              `}
            >
              {day.getDate()}
              {hasEvent && (
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendário</h1>
          <p className="text-muted-foreground">Gerencie eventos e compromissos da empresa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentMonth.getFullYear() - 1}
          </Button>
          <span className="font-semibold text-lg">{currentMonth.getFullYear()}</span>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))}
          >
            {currentMonth.getFullYear() + 1}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendário {currentMonth.getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderCalendarioAnual()}
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral - Eventos do dia */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Evento
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Criar Novo Evento</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      <div>
                        <Label htmlFor="nome">Nome do Evento *</Label>
                        <Input
                          id="nome"
                          value={novoEvento.nome_evento}
                          onChange={(e) => setNovoEvento({ ...novoEvento, nome_evento: e.target.value })}
                          placeholder="Digite o nome do evento"
                        />
                      </div>

                      <div>
                        <Label htmlFor="horario">Horário *</Label>
                        <Input
                          id="horario"
                          type="time"
                          value={novoEvento.horario_evento}
                          onChange={(e) => setNovoEvento({ ...novoEvento, horario_evento: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="categoria">Categoria *</Label>
                        <Select
                          value={novoEvento.categoria}
                          onValueChange={(value) => setNovoEvento({ ...novoEvento, categoria: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoriaLabels).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="membros">Membros</Label>
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (!novoEvento.membros.includes(value)) {
                              setNovoEvento({
                                ...novoEvento,
                                membros: [...novoEvento.membros, value]
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Adicionar membro" />
                          </SelectTrigger>
                          <SelectContent>
                            {usuarios
                              .filter(user => !novoEvento.membros.includes(user.id))
                              .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {novoEvento.membros.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {novoEvento.membros.map((membroId) => {
                              const usuario = usuarios.find(u => u.id === membroId);
                              return (
                                <Badge key={membroId} variant="secondary" className="flex items-center gap-1">
                                  {usuario?.nome}
                                  <button
                                    onClick={() => setNovoEvento({
                                      ...novoEvento,
                                      membros: novoEvento.membros.filter(id => id !== membroId)
                                    })}
                                    className="ml-1 text-xs"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={novoEvento.descricao_evento}
                          onChange={(e) => setNovoEvento({ ...novoEvento, descricao_evento: e.target.value })}
                          placeholder="Descreva o evento..."
                          rows={3}
                        />
                      </div>

                      <Button onClick={criarEvento} className="w-full">
                        Criar Evento
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              {eventosSelecionados.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum evento neste dia</p>
              ) : (
                <div className="space-y-3">
                  {eventosSelecionados.map((evento) => (
                    <div key={evento.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{evento.nome_evento}</h4>
                        <Badge variant="secondary" className={categoriaLabels[evento.categoria].color}>
                          {categoriaLabels[evento.categoria].label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {evento.horario_evento}
                      </div>

                      {evento.membros && evento.membros.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div className="flex -space-x-2">
                            {evento.membros.slice(0, 3).map((membro, index) => (
                              <Avatar key={index} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={membro.foto_perfil_url} />
                                <AvatarFallback className="text-xs">
                                  {membro.nome.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {evento.membros.length > 3 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                +{evento.membros.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {evento.descricao_evento && (
                        <p className="text-sm text-muted-foreground">{evento.descricao_evento}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}