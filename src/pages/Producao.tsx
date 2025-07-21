import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarIcon, Palette, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const updateDataEntrega = async (pedidoId: string, novaData: string) => {
    const { error } = await supabase
      .from("pedidos_producao")
      .update({ data_entrega: novaData })
      .eq("id", pedidoId);

    if (error) {
      toast.error("Erro ao atualizar data de entrega");
      return;
    }

    toast.success("Data de entrega atualizada com sucesso!");
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

  const handleDragStart = (pedidoId: string) => {
    setDraggedPedido(pedidoId);
  };

  const handleDragEnd = () => {
    setDraggedPedido(null);
    setIsDragHovering(null);
  };

  const handleDragOver = (e: React.DragEvent, data: string) => {
    e.preventDefault();
    setIsDragHovering(data);
  };

  const handleDragLeave = () => {
    setIsDragHovering(null);
  };

  const handleDrop = (e: React.DragEvent, novaData: string) => {
    e.preventDefault();
    if (draggedPedido) {
      updateDataEntrega(draggedPedido, novaData);
    }
    setDraggedPedido(null);
    setIsDragHovering(null);
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
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
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
            "h-24 border border-border p-1 flex flex-col justify-between relative",
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
                
                {/* Dropdown de cores */}
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

          <div className="space-y-1 overflow-hidden">
            {pedidosNoDia.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-primary/10 text-primary text-xs p-1 rounded cursor-move"
                draggable
                onDragStart={() => handleDragStart(pedido.id)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  setSelectedPedido(pedido);
                  setDialogOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{pedido.numero_pedido}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPedido(pedido);
                      setDialogOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {pedido.cliente_nome}
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-4 w-4 rounded-full border border-gray-300" 
                    style={getCorStyle(pedido.produto_cor)}
                  />
                  <span>Cor: {pedido.produto_cor}</span>
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Calendário de Produção</h1>
        
        <div className="flex items-center gap-4">
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

      {/* Dialog de detalhes do pedido */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  Pedido {selectedPedido.numero_pedido}
                </h3>
                <p className="text-muted-foreground">
                  Status: {selectedPedido.status}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Cliente</h4>
                <p>{selectedPedido.cliente_nome}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPedido.cliente_telefone}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Produto</h4>
                <p>
                  {selectedPedido.produto_tipo} - {selectedPedido.produto_altura} x {selectedPedido.produto_largura}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div 
                    className="h-4 w-4 rounded-full border border-gray-300" 
                    style={getCorStyle(selectedPedido.produto_cor)}
                  />
                  <span>Cor: {selectedPedido.produto_cor}</span>
                </div>
              </div>

              {(selectedPedido.endereco_rua || selectedPedido.endereco_cidade) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Endereço</h4>
                  <div className="text-sm space-y-1">
                    {selectedPedido.endereco_rua && (
                      <p>{selectedPedido.endereco_rua}, {selectedPedido.endereco_numero}</p>
                    )}
                    {selectedPedido.endereco_bairro && (
                      <p>{selectedPedido.endereco_bairro}</p>
                    )}
                    {selectedPedido.endereco_cidade && (
                      <p>{selectedPedido.endereco_cidade} - {selectedPedido.endereco_estado}</p>
                    )}
                    {selectedPedido.endereco_cep && (
                      <p>CEP: {selectedPedido.endereco_cep}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedPedido.observacoes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Observações</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPedido.observacoes}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Data de Entrega</h4>
                <p className="text-sm">
                  {selectedPedido.data_entrega 
                    ? new Date(selectedPedido.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR')
                    : "Não definida"
                  }
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}