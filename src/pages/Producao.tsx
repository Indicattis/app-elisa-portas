import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Package, Clock, MapPin } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone?: string;
  produto_tipo: string;
  produto_cor: string;
  produto_altura: string;
  produto_largura: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  data_entrega?: Date;
  venda?: {
    cidade?: string;
    estado?: string;
    bairro?: string;
  };
}

interface CalendarioCore {
  data: Date;
  cor: string;
  ativa: boolean;
}

const cores = [
  'Branco', 'Preto', 'Cinza', 'Azul', 'Verde', 'Vermelho', 
  'Amarelo', 'Laranja', 'Rosa', 'Roxo', 'Marrom', 'Bege',
  'Dourado', 'Prata', 'Bronze'
];

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  em_andamento: 'bg-blue-100 text-blue-800 border-blue-200',
  concluido: 'bg-green-100 text-green-800 border-green-200'
};

export default function Producao() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [coresCalendario, setCoresCalendario] = useState<CalendarioCore[]>([]);
  const [draggedPedido, setDraggedPedido] = useState<Pedido | null>(null);

  // Carregar pedidos do banco
  useEffect(() => {
    const loadPedidos = async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select(`
          *,
          venda:vendas(cidade, estado, bairro)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar pedidos:', error);
        return;
      }

      const pedidosFormatted = data.map(pedido => ({
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        cliente_nome: pedido.cliente_nome,
        cliente_telefone: pedido.cliente_telefone,
        produto_tipo: pedido.produto_tipo,
        produto_cor: pedido.produto_cor,
        produto_altura: pedido.produto_altura,
        produto_largura: pedido.produto_largura,
        status: pedido.status as 'pendente' | 'em_andamento' | 'concluido',
        data_entrega: pedido.data_entrega ? new Date(pedido.data_entrega) : undefined,
        venda: pedido.venda?.[0] || undefined,
      }));

      setPedidos(pedidosFormatted);
    };

    loadPedidos();
  }, []);

  // Carregar cores do calendário
  useEffect(() => {
    const loadCores = async () => {
      const { data, error } = await supabase
        .from('calendario_cores')
        .select('*')
        .eq('ativa', true);

      if (error) {
        console.error('Erro ao carregar cores:', error);
        return;
      }

      const coresFormatted = data.map(cor => ({
        data: new Date(cor.data_producao),
        cor: cor.cor,
        ativa: cor.ativa,
      }));

      setCoresCalendario(coresFormatted);
    };

    loadCores();
  }, []);

  // Gerar dias do mês para o calendário
  const generateMonthDays = () => {
    const currentDate = selectedDate || new Date();
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const monthDays = generateMonthDays();

  const handleDragStart = (pedido: Pedido) => {
    setDraggedPedido(pedido);
  };

  const handleDragEnd = () => {
    setDraggedPedido(null);
  };

  const handleDrop = (date: Date) => {
    if (draggedPedido) {
      console.log(`Pedido ${draggedPedido.numero_pedido} agendado para ${format(date, 'dd/MM/yyyy')}`);
      // Aqui você implementaria a lógica para atualizar a data de entrega no banco
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getCorForDate = (date: Date) => {
    return coresCalendario.find(c => isSameDay(c.data, date))?.cor;
  };

  const updateCorForDate = async (date: Date, cor: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Primeiro, verificar se já existe uma cor para essa data
    const { data: existing } = await supabase
      .from('calendario_cores')
      .select('id')
      .eq('data_producao', dateString)
      .eq('ativa', true)
      .single();

    let error;
    
    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('calendario_cores')
        .update({ cor })
        .eq('id', existing.id);
      error = updateError;
    } else {
      // Criar novo registro
      const { error: insertError } = await supabase
        .from('calendario_cores')
        .insert({
          data_producao: dateString,
          cor,
          ativa: true,
        });
      error = insertError;
    }

    if (error) {
      console.error('Erro ao salvar cor:', error);
      return;
    }

    setCoresCalendario(prev => {
      const existingIndex = prev.findIndex(c => isSameDay(c.data, date));
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], cor };
        return updated;
      } else {
        return [...prev, { data: date, cor, ativa: true }];
      }
    });
  };

  const getPedidosForDate = (date: Date) => {
    return pedidos.filter(pedido => 
      pedido.data_entrega && isSameDay(pedido.data_entrega, date)
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Produção</h1>
        <Button 
          className="gap-2" 
          onClick={() => navigate('/dashboard/novo-pedido')}
        >
          <Plus className="h-4 w-4" />
          Criar Pedido
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário de Cores */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendário de Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Calendário expandido por mês */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  {format(selectedDate || new Date(), 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((day, index) => {
                    const corDia = getCorForDate(day);
                    const pedidosDia = getPedidosForDate(day);
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[120px] p-2 border rounded-lg hover:bg-muted/50 transition-colors",
                          isSameDay(day, new Date()) && "bg-primary/10 border-primary/20"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day)}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">
                              {format(day, 'd')}
                            </div>
                            {corDia && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {corDia}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Seletor de cor */}
                          <select
                            value={corDia || ''}
                            onChange={(e) => updateCorForDate(day, e.target.value)}
                            className="w-full text-xs p-1 border rounded mb-2"
                          >
                            <option value="">Cor</option>
                            {cores.map(cor => (
                              <option key={cor} value={cor}>{cor}</option>
                            ))}
                          </select>
                          
                          {/* Pedidos do dia */}
                          <div className="flex-1 space-y-1">
                            {pedidosDia.map((pedido) => (
                              <div
                                key={pedido.id}
                                className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                                title={`${pedido.numero_pedido} - ${pedido.cliente_nome}`}
                              >
                                {pedido.numero_pedido}
                              </div>
                            ))}
                          </div>
                          
                          {draggedPedido && (
                            <div className="mt-2 text-xs text-blue-600 text-center">
                              Solte aqui
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pedidos de Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="p-4 border rounded-lg cursor-move hover:shadow-md transition-shadow bg-card"
                  draggable
                  onDragStart={() => handleDragStart(pedido)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm">{pedido.numero_pedido}</div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", statusColors[pedido.status])}
                    >
                      {pedido.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="font-medium">{pedido.cliente_nome}</div>
                    <div>{pedido.produto_tipo}</div>
                    <div className="flex items-center gap-2">
                      <span>Cor: {pedido.produto_cor}</span>
                    </div>
                    <div className="text-xs">
                      {pedido.produto_altura} x {pedido.produto_largura}
                    </div>
                    {pedido.venda && (pedido.venda.cidade || pedido.venda.estado) && (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {[pedido.venda.cidade, pedido.venda.estado].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {pedido.data_entrega && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Entrega: {format(pedido.data_entrega, 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}