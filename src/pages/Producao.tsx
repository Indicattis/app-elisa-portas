import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Package, Clock, MapPin, Palette, Trash2 } from 'lucide-react';
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
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  venda?: {
    cidade?: string;
    estado?: string;
    bairro?: string;
    cep?: string;
    cliente_nome?: string;
    cliente_telefone?: string;
    cliente_email?: string;
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

const coresBg = {
  'Branco': 'bg-white',
  'Preto': 'bg-black',
  'Cinza': 'bg-gray-500',
  'Azul': 'bg-blue-500',
  'Verde': 'bg-green-500',
  'Vermelho': 'bg-red-500',
  'Amarelo': 'bg-yellow-500',
  'Laranja': 'bg-orange-500',
  'Rosa': 'bg-pink-500',
  'Roxo': 'bg-purple-500',
  'Marrom': 'bg-amber-800',
  'Bege': 'bg-yellow-200',
  'Dourado': 'bg-yellow-400',
  'Prata': 'bg-gray-300',
  'Bronze': 'bg-yellow-600'
};

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
  const [dragHoverDay, setDragHoverDay] = useState<Date | null>(null);
  const [selectedColorForDay, setSelectedColorForDay] = useState<{date: Date, color: string} | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [viewMode, setViewMode] = useState<'lista' | 'detalhes'>('lista');

  // Carregar pedidos do banco
  useEffect(() => {
    const loadPedidos = async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select(`
          *,
          venda:vendas(cidade, estado, bairro, cep, cliente_nome, cliente_telefone, cliente_email)
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
        endereco_rua: pedido.endereco_rua,
        endereco_numero: pedido.endereco_numero,
        endereco_bairro: pedido.endereco_bairro,
        endereco_cidade: pedido.endereco_cidade,
        endereco_estado: pedido.endereco_estado,
        endereco_cep: pedido.endereco_cep,
        venda: pedido.venda?.[0] || undefined,
      }));

      setPedidos(pedidosFormatted);
    };

    loadPedidos();
  }, []);

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
    setDragHoverDay(null);
  };

  const handleDragEnter = (date: Date) => {
    if (draggedPedido) {
      setDragHoverDay(date);
    }
  };

  const handleDragLeave = () => {
    // Pequeno delay para evitar flickering
    setTimeout(() => {
      setDragHoverDay(null);
    }, 50);
  };

  const handleDrop = async (date: Date) => {
    if (draggedPedido) {
      const dateString = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('pedidos_producao')
        .update({ 
          data_entrega: dateString,
          status: 'em_andamento'
        })
        .eq('id', draggedPedido.id);

      if (!error) {
        setPedidos(prev => prev.map(p => 
          p.id === draggedPedido.id 
            ? { ...p, data_entrega: date, status: 'em_andamento' as const }
            : p
        ));
      }
    }
    setDragHoverDay(null);
  };

  const handleDropToTrash = async () => {
    if (draggedPedido) {
      const { error } = await supabase
        .from('pedidos_producao')
        .update({ 
          data_entrega: null,
          status: 'pendente'
        })
        .eq('id', draggedPedido.id);

      if (!error) {
        setPedidos(prev => prev.map(p => 
          p.id === draggedPedido.id 
            ? { ...p, data_entrega: undefined, status: 'pendente' as const }
            : p
        ));
      }
    }
    setDragHoverDay(null);
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

  // Pedidos sem data (para listagem)
  const getPedidosSemData = () => {
    return pedidos.filter(pedido => !pedido.data_entrega);
  };

  const handlePedidoDoubleClick = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setViewMode('detalhes');
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
                    const isHovered = dragHoverDay && isSameDay(dragHoverDay, day);
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          "relative min-h-[140px] p-2 border rounded-lg transition-all duration-200",
                          isSameDay(day, new Date()) && "bg-primary/10 border-primary/20",
                          isHovered && "bg-blue-100 border-blue-400 border-2 shadow-md",
                          !draggedPedido && "hover:bg-muted/50"
                        )}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(day)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(day)}
                      >
                        <div className="flex flex-col h-full">
                          {/* Cabeçalho do dia */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">
                              {format(day, 'd')}
                            </div>
                          </div>
                          
                          {/* Lista de pedidos */}
                          <div className="flex-1 space-y-1 mb-8">
                            {pedidosDia.map((pedido) => (
                              <div
                                key={pedido.id}
                                className={cn(
                                  "text-xs p-1 rounded cursor-move border",
                                  statusColors[pedido.status]
                                )}
                                draggable
                                onDragStart={() => handleDragStart(pedido)}
                                onDragEnd={handleDragEnd}
                                onDoubleClick={() => handlePedidoDoubleClick(pedido)}
                                title={`${pedido.numero_pedido} - ${pedido.cliente_nome}`}
                              >
                                {pedido.numero_pedido}
                              </div>
                            ))}
                          </div>
                          
                          {/* Seletor de cor no canto inferior direito */}
                          <div className="absolute bottom-2 right-2">
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setSelectedColorForDay(
                                  selectedColorForDay?.date && isSameDay(selectedColorForDay.date, day) 
                                    ? null 
                                    : { date: day, color: corDia || '' }
                                )}
                              >
                                <Palette 
                                  className={cn(
                                    "h-3 w-3",
                                    corDia && coresBg[corDia as keyof typeof coresBg],
                                    corDia === 'Branco' && "border border-gray-300"
                                  )} 
                                />
                              </Button>
                              
                              {/* Dropdown de cores */}
                              {selectedColorForDay?.date && isSameDay(selectedColorForDay.date, day) && (
                                <div className="absolute bottom-8 right-0 bg-white border shadow-lg rounded-md p-2 z-10 min-w-[120px]">
                                  <div className="grid grid-cols-3 gap-1">
                                    {cores.map(cor => (
                                      <button
                                        key={cor}
                                        className={cn(
                                          "w-6 h-6 rounded border-2 hover:scale-110 transition-transform",
                                          coresBg[cor as keyof typeof coresBg],
                                          cor === 'Branco' && "border-gray-300",
                                          corDia === cor && "ring-2 ring-blue-500"
                                        )}
                                        onClick={() => {
                                          updateCorForDate(day, cor);
                                          setSelectedColorForDay(null);
                                        }}
                                        title={cor}
                                      />
                                    ))}
                                  </div>
                                  <button
                                    className="w-full text-xs mt-2 p-1 text-gray-500 hover:text-gray-700"
                                    onClick={() => {
                                      updateCorForDate(day, '');
                                      setSelectedColorForDay(null);
                                    }}
                                  >
                                    Remover cor
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
          {/* Lixeira */}
          {draggedPedido && (
            <Card className="border-red-200 bg-red-50">
              <CardContent 
                className="p-4 text-center"
                onDragOver={handleDragOver}
                onDrop={handleDropToTrash}
              >
                <Trash2 className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <p className="text-sm text-red-600">
                  Solte aqui para remover da programação
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {viewMode === 'lista' ? 'Pedidos de Produção' : 'Informações do Pedido'}
                </div>
                {viewMode === 'detalhes' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewMode('lista');
                      setSelectedPedido(null);
                    }}
                  >
                    Voltar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {viewMode === 'lista' ? (
                <>
                  {getPedidosSemData().map((pedido) => (
                    <div
                      key={pedido.id}
                      className="p-4 border rounded-lg cursor-move hover:shadow-md transition-shadow bg-card"
                      draggable
                      onDragStart={() => handleDragStart(pedido)}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={() => handlePedidoDoubleClick(pedido)}
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
                        {(pedido.venda?.cidade || pedido.venda?.estado) && (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {pedido.venda?.cidade}, {pedido.venda?.estado}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {getPedidosSemData().length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Todos os pedidos estão programados</p>
                    </div>
                  )}
                </>
              ) : selectedPedido && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/10">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">{selectedPedido.numero_pedido}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn("text-sm", statusColors[selectedPedido.status])}
                      >
                        {selectedPedido.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Cliente:</span>
                        <p className="mt-1">{selectedPedido.cliente_nome}</p>
                        {selectedPedido.cliente_telefone && (
                          <p className="text-muted-foreground">{selectedPedido.cliente_telefone}</p>
                        )}
                      </div>
                      
                      <div>
                        <span className="font-medium text-muted-foreground">Produto:</span>
                        <p className="mt-1">{selectedPedido.produto_tipo}</p>
                        <p className="text-muted-foreground">
                          Dimensões: {selectedPedido.produto_altura} x {selectedPedido.produto_largura}
                        </p>
                        <p className="text-muted-foreground">
                          Cor: {selectedPedido.produto_cor}
                        </p>
                      </div>

                      {(selectedPedido.endereco_rua || selectedPedido.endereco_cidade || selectedPedido.venda?.cidade) && (
                        <div>
                          <span className="font-medium text-muted-foreground">Endereço:</span>
                          <div className="flex items-start gap-1 mt-1">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              {(selectedPedido.endereco_rua || selectedPedido.endereco_numero) && (
                                <p>
                                  {selectedPedido.endereco_rua}
                                  {selectedPedido.endereco_numero && `, ${selectedPedido.endereco_numero}`}
                                </p>
                              )}
                              {selectedPedido.endereco_bairro && (
                                <p className="text-muted-foreground">
                                  {selectedPedido.endereco_bairro}
                                </p>
                              )}
                              <p className="text-muted-foreground">
                                {selectedPedido.endereco_cidade || selectedPedido.venda?.cidade}
                                {(selectedPedido.endereco_estado || selectedPedido.venda?.estado) && 
                                  ` - ${selectedPedido.endereco_estado || selectedPedido.venda?.estado}`
                                }
                              </p>
                              {(selectedPedido.endereco_cep || selectedPedido.venda?.cep) && (
                                <p className="text-muted-foreground">
                                  CEP: {selectedPedido.endereco_cep || selectedPedido.venda?.cep}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPedido.data_entrega && (
                        <div>
                          <span className="font-medium text-muted-foreground">Data de entrega:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{format(selectedPedido.data_entrega, 'dd/MM/yyyy')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Dica: Clique duas vezes em um pedido no calendário para ver suas informações
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
