
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Palette, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductionSidebar } from "@/components/production/ProductionSidebar";

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  produto_tipo: string;
  produto_cor: string;
  produto_altura: string;
  produto_largura: string;
  data_entrega: string | null;
  status: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_cep?: string;
  endereco_estado?: string;
  observacoes?: string;
}

export default function Producao() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [coresCalendario, setCoresCalendario] = useState<{ [date: string]: string }>({});
  const [draggedPedido, setDraggedPedido] = useState<string | null>(null);
  const [isDragHovering, setIsDragHovering] = useState<string | null>(null);
  const [catalogoCores, setCatalogoCores] = useState<{ nome: string; codigo_hex: string }[]>([]);

  useEffect(() => {
    fetchPedidos();
    fetchCoresCalendario();
    fetchCatalogoCores();
  }, [selectedMonth, selectedYear]);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos_producao")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao buscar pedidos");
      return;
    }

    const pedidosFormatados = data?.map(pedido => ({
      id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      cliente_nome: pedido.cliente_nome,
      cliente_telefone: pedido.cliente_telefone || '',
      produto_tipo: pedido.produto_tipo,
      produto_cor: pedido.produto_cor,
      produto_altura: pedido.produto_altura,
      produto_largura: pedido.produto_largura,
      data_entrega: pedido.data_entrega,
      status: pedido.status,
      endereco_rua: pedido.endereco_rua,
      endereco_numero: pedido.endereco_numero,
      endereco_bairro: pedido.endereco_bairro,
      endereco_cidade: pedido.endereco_cidade,
      endereco_cep: pedido.endereco_cep,
      endereco_estado: pedido.endereco_estado,
      observacoes: pedido.observacoes
    })) || [];

    setPedidos(pedidosFormatados);
  };

  const fetchCoresCalendario = async () => {
    const { data, error } = await supabase
      .from("calendario_cores")
      .select("data_producao, cor")
      .eq("ativa", true);

    if (error) {
      toast.error("Erro ao buscar cores do calendário");
      return;
    }

    const coresMap: { [date: string]: string } = {};
    data?.forEach((item) => {
      coresMap[item.data_producao] = item.cor;
    });
    setCoresCalendario(coresMap);
  };

  const fetchCatalogoCores = async () => {
    const { data, error } = await supabase
      .from("catalogo_cores")
      .select("nome, codigo_hex")
      .eq("ativa", true)
      .order("nome");

    if (error) {
      toast.error("Erro ao buscar catálogo de cores");
      return;
    }

    setCatalogoCores(data || []);
  };

  const getCorStyle = (nomeCor: string) => {
    const cor = catalogoCores.find(c => c.nome === nomeCor);
    return cor ? { backgroundColor: cor.codigo_hex } : {};
  };

  const getPedidoStyle = (pedido: Pedido) => {
    switch (pedido.status) {
      case 'em_producao':
        return "bg-blue-100 border-blue-300 text-blue-800";
      case 'pendente_pintura':
        return "bg-orange-100 border-orange-300 text-orange-800";
      case 'pendente_instalacao':
        return "bg-red-100 border-red-300 text-red-800";
      case 'autorizado':
        return "bg-gray-100 border-gray-300 text-gray-800";
      case 'instalada':
        return "bg-green-100 border-green-300 text-green-800";
      default:
        return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  const statusOptions = [
    { value: 'em_producao', label: 'Em produção', color: 'blue' },
    { value: 'pendente_pintura', label: 'Pendente pintura', color: 'orange' },
    { value: 'pendente_instalacao', label: 'Pendente instalação', color: 'red' },
    { value: 'autorizado', label: 'Autorizado', color: 'gray' },
    { value: 'instalada', label: 'Instalada', color: 'green' }
  ];

  const updateStatusPedido = async (pedidoId: string, novoStatus: string) => {
    const { error } = await supabase
      .from("pedidos_producao")
      .update({ status: novoStatus })
      .eq("id", pedidoId);

    if (error) {
      toast.error("Erro ao atualizar status do pedido");
      return;
    }

    toast.success("Status atualizado com sucesso!");
    fetchPedidos();
  };

  const updateDataEntrega = async (pedidoId: string, novaData: string | null) => {
    const { error } = await supabase
      .from("pedidos_producao")
      .update({ data_entrega: novaData })
      .eq("id", pedidoId);

    if (error) {
      toast.error("Erro ao atualizar data de entrega");
      return;
    }

    toast.success(novaData ? "Data de entrega atualizada com sucesso!" : "Data de entrega removida com sucesso!");
    fetchPedidos();
  };

  const updateCorCalendario = async (data: string, cor: string) => {
    if (!cor || cor === "remove") {
      // Remover cor do dia
      const { error } = await supabase
        .from("calendario_cores")
        .delete()
        .eq("data_producao", data);

      if (error) {
        toast.error("Erro ao remover cor do calendário");
        return;
      }
    } else {
      // Adicionar ou atualizar cor do dia
      const { error } = await supabase
        .from("calendario_cores")
        .upsert({
          data_producao: data,
          cor: cor,
          ativa: true
        });

      if (error) {
        toast.error("Erro ao atualizar cor do calendário");
        return;
      }
    }

    fetchCoresCalendario();
    toast.success(cor && cor !== "remove" ? "Cor definida com sucesso!" : "Cor removida com sucesso!");
  };

  const handlePedidoDoubleClick = (pedido: Pedido) => {
    setSelectedPedido(pedido);
  };

  const handleDragStart = (pedidoId: string) => {
    setDraggedPedido(pedidoId);
  };

  const handleDragEnd = () => {
    setDraggedPedido(null);
    setIsDragHovering(null);
  };

  const handleDragOver = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    setIsDragHovering(target);
  };

  const handleDragLeave = () => {
    setIsDragHovering(null);
  };

  const handleDrop = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    if (draggedPedido) {
      if (target === 'sidebar') {
        // Remover data de entrega ao arrastar para a sidebar
        updateDataEntrega(draggedPedido, null);
      } else {
        // Definir nova data de entrega
        updateDataEntrega(draggedPedido, target);
      }
    }
    setDraggedPedido(null);
    setIsDragHovering(null);
  };

  const handleNovoPedido = () => {
    navigate('/dashboard/novo-pedido');
  };

  const getDaysInMonth = (month: number, year: number) => {
    const date = new Date(year, month + 1, 0);
    return date.getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    return date.getDay();
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
      const pedidosNoDia = pedidos.filter(p => p.data_entrega === dataString);
      const corDia = coresCalendario[dataString];

      days.push(
        <div
          key={day}
          className={cn(
            "h-32 border border-border p-1 flex flex-col justify-between relative overflow-hidden",
            isDragHovering === dataString && "bg-blue-100"
          )}
          onDragOver={(e) => handleDragOver(e, dataString)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dataString)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{day}</span>
            
            {/* Seletor de cor para o dia */}
            <div className="relative">
              <Select
                value={corDia || ""}
                onValueChange={(cor) => updateCorCalendario(dataString, cor)}
              >
                <SelectTrigger className="h-6 w-6 p-0 border-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {corDia ? (
                      <div 
                        className="h-4 w-4 rounded border border-gray-300" 
                        style={getCorStyle(corDia)}
                      />
                    ) : (
                      <Palette className="h-3 w-3" />
                    )}
                  </Button>
                </SelectTrigger>
                
                <SelectContent>
                  <SelectItem value="remove">Remover cor</SelectItem>
                  {catalogoCores.map((cor) => (
                    <SelectItem key={cor.nome} value={cor.nome}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded border border-gray-300" 
                          style={{ backgroundColor: cor.codigo_hex }}
                        />
                        {cor.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de pedidos em formato de linha */}
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {pedidosNoDia.map((pedido) => (
              <div
                key={pedido.id}
                className={cn(
                  "h-6 flex items-center gap-1 px-1 rounded text-xs group relative",
                  getPedidoStyle(pedido)
                )}
                draggable
                onDragStart={() => handleDragStart(pedido.id)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => handlePedidoDoubleClick(pedido)}
                title={`${pedido.numero_pedido} - ${pedido.cliente_nome} - ${pedido.endereco_cidade || 'Cidade não informada'}`}
              >
                {/* Círculo da cor */}
                <div 
                  className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" 
                  style={getCorStyle(pedido.produto_cor)}
                />
                
                {/* Código do pedido */}
                <span className="font-medium truncate flex-shrink-0 min-w-0">
                  {pedido.numero_pedido}
                </span>
                
                {/* Cidade */}
                <span className="text-muted-foreground truncate flex-1 min-w-0">
                  {pedido.endereco_cidade || 'N/A'}
                </span>

                {/* Seletor de status (aparece no hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Select
                    value={pedido.status}
                    onValueChange={(novoStatus) => updateStatusPedido(pedido.id, novoStatus)}
                  >
                    <SelectTrigger className="h-4 w-4 p-0 border-none bg-transparent">
                      <div className="h-2 w-2 rounded-full bg-current" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`h-2 w-2 rounded-full bg-${option.color}-500`}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

  return (
    <div className="flex h-screen">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Calendário de Produção</h1>
            
          <div className="flex items-center gap-4">
            {/* Índices de status */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-blue-500"></div>
                <span>Em produção: {pedidos.filter(p => p.status === 'em_producao').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-orange-500"></div>
                <span>Pendente pintura: {pedidos.filter(p => p.status === 'pendente_pintura').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-red-500"></div>
                <span>Pendente instalação: {pedidos.filter(p => p.status === 'pendente_instalacao').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-gray-600"></div>
                <span>Autorizado: {pedidos.filter(p => p.status === 'autorizado').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-500"></div>
                <span>Instalada: {pedidos.filter(p => p.status === 'instalada').length}</span>
              </div>
            </div>

            <Button onClick={handleNovoPedido} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Pedido
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

          {/* Calendário */}
          <div className="bg-card rounded-lg border">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-0 border-b">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="p-4 text-center font-medium bg-muted/50">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid dos dias */}
            <div className="grid grid-cols-7 gap-0">
              {renderCalendar()}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <ProductionSidebar
        pedidos={pedidos}
        catalogoCores={catalogoCores}
        onPedidoDoubleClick={handlePedidoDoubleClick}
        onPedidoDragStart={handleDragStart}
        onPedidoDragEnd={handleDragEnd}
        onPedidosUpdated={fetchPedidos}
        selectedPedido={selectedPedido}
        isDragHovering={isDragHovering === 'sidebar'}
        onDrop={(e) => handleDrop(e, 'sidebar')}
        onDragOver={(e) => handleDragOver(e, 'sidebar')}
        onDragLeave={handleDragLeave}
        onStatusUpdate={updateStatusPedido}
        statusOptions={statusOptions}
      />
    </div>
  );
}
