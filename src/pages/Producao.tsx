import React, { useState, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Package, Clock } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  produto_tipo: string;
  produto_cor: string;
  produto_altura: string;
  produto_largura: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  data_entrega?: Date;
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [pedidos] = useState<Pedido[]>([
    {
      id: '1',
      numero_pedido: 'PED001',
      cliente_nome: 'João Silva',
      produto_tipo: 'Porta de Enrolar',
      produto_cor: 'Branco',
      produto_altura: '2.20m',
      produto_largura: '3.00m',
      status: 'pendente'
    },
    {
      id: '2',
      numero_pedido: 'PED002',
      cliente_nome: 'Maria Santos',
      produto_tipo: 'Kit Porta Social',
      produto_cor: 'Cinza',
      produto_altura: '2.10m',
      produto_largura: '0.80m',
      status: 'em_andamento'
    }
  ]);

  const [coresCalendario, setCoresCalendario] = useState<CalendarioCore[]>([]);
  const [draggedPedido, setDraggedPedido] = useState<Pedido | null>(null);

  // Gerar semana atual para o calendário de cores
  const generateWeekDays = () => {
    const start = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDays = generateWeekDays();

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

  const updateCorForDate = (date: Date, cor: string) => {
    setCoresCalendario(prev => {
      const existing = prev.findIndex(c => isSameDay(c.data, date));
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], cor };
        return updated;
      } else {
        return [...prev, { data: date, cor, ativa: true }];
      }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Produção</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Pedido
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário de Cores */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendário de Cores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="rounded-md border"
              />
              
              {/* Configuração de cores para a semana */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Cores da Semana</h3>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => (
                    <div
                      key={index}
                      className="text-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day)}
                    >
                      <div className="text-sm font-medium mb-2">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {format(day, 'dd/MM')}
                      </div>
                      
                      <select
                        value={getCorForDate(day) || ''}
                        onChange={(e) => updateCorForDate(day, e.target.value)}
                        className="w-full text-xs p-1 border rounded"
                      >
                        <option value="">Selecionar cor</option>
                        {cores.map(cor => (
                          <option key={cor} value={cor}>{cor}</option>
                        ))}
                      </select>
                      
                      {draggedPedido && (
                        <div className="mt-2 text-xs text-blue-600">
                          Solte aqui para agendar
                        </div>
                      )}
                    </div>
                  ))}
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