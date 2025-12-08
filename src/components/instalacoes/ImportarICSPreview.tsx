import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Calendar, MapPin, Phone, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ParsedICSEvent } from "@/utils/icsParser";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";

interface ImportarICSPreviewProps {
  events: ParsedICSEvent[];
  onConfirm: (selectedEvents: ParsedICSEvent[], options: {
    equipeId: string | null;
    horaDefault: string;
    skipDuplicates: boolean;
  }) => void;
  onCancel: () => void;
  isImporting: boolean;
}

export function ImportarICSPreview({
  events,
  onConfirm,
  onCancel,
  isImporting
}: ImportarICSPreviewProps) {
  const { equipes } = useEquipesInstalacao();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(events.map(e => e.uid))
  );
  const [equipeId, setEquipeId] = useState<string>("");
  const [horaDefault, setHoraDefault] = useState("08:00");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  const filteredEvents = useMemo(() => {
    if (!filterDate) return events;
    return events.filter(e => e.dataInstalacao >= filterDate);
  }, [events, filterDate]);

  const toggleAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map(e => e.uid)));
    }
  };

  const toggleEvent = (uid: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(uid)) {
      newSet.delete(uid);
    } else {
      newSet.add(uid);
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = () => {
    const selectedEvents = events.filter(e => selectedIds.has(e.uid));
    onConfirm(selectedEvents, {
      equipeId: equipeId || null,
      horaDefault,
      skipDuplicates
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T12:00:00');
      return format(date, "dd/MM/yyyy (EEEE)", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header com opções */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {events.length} evento(s) encontrado(s)
          </h3>
          <Badge variant="secondary">
            {selectedIds.size} selecionado(s)
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="equipe">Equipe de Instalação</Label>
            <Select value={equipeId} onValueChange={setEquipeId}>
              <SelectTrigger id="equipe">
                <SelectValue placeholder="Selecionar equipe..." />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    <div className="flex items-center gap-2">
                      {equipe.cor && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: equipe.cor }}
                        />
                      )}
                      {equipe.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora">Horário Padrão</Label>
            <Input
              id="hora"
              type="time"
              value={horaDefault}
              onChange={(e) => setHoraDefault(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filterDate">Filtrar a partir de</Label>
            <Input
              id="filterDate"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="skipDuplicates"
            checked={skipDuplicates}
            onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
          />
          <Label htmlFor="skipDuplicates" className="text-sm cursor-pointer">
            Ignorar duplicatas (mesmo cliente e data)
          </Label>
        </div>
      </div>

      {/* Lista de eventos */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {/* Header da lista */}
          <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
            <Checkbox
              checked={selectedIds.size === filteredEvents.length && filteredEvents.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">Selecionar todos</span>
          </div>

          {/* Eventos */}
          {filteredEvents.map((event) => (
            <div
              key={event.uid}
              className={`p-3 border rounded-lg transition-colors ${
                selectedIds.has(event.uid) 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(event.uid)}
                  onCheckedChange={() => toggleEvent(event.uid)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-medium truncate">
                    {event.nomeCliente}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.dataInstalacao)}
                    </span>
                    
                    {event.cidade && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.cidade}/{event.estado}
                      </span>
                    )}
                    
                    {event.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {event.telefone}
                      </span>
                    )}
                    
                    {event.corPorta && (
                      <span className="flex items-center gap-1">
                        <Palette className="h-3.5 w-3.5" />
                        {event.corPorta}
                      </span>
                    )}
                  </div>
                  
                  {event.endereco && (
                    <div className="text-xs text-muted-foreground truncate">
                      {event.endereco}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum evento encontrado para o filtro selecionado
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer com ações */}
      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={selectedIds.size === 0 || isImporting}
        >
          <Check className="h-4 w-4 mr-2" />
          {isImporting ? "Importando..." : `Importar ${selectedIds.size} instalação(ões)`}
        </Button>
      </div>
    </div>
  );
}
