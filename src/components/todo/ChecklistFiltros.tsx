import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAllUsers } from "@/hooks/useAllUsers";
import { Calendar as CalendarIcon, Filter, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface ChecklistFiltrosProps {
  usuarioSelecionado: string;
  setUsuarioSelecionado: (value: string) => void;
  tipoSelecionado: string;
  setTipoSelecionado: (value: string) => void;
  statusSelecionado: string;
  setStatusSelecionado: (value: string) => void;
  dataSelecionada: Date | undefined;
  setDataSelecionada: (date: Date | undefined) => void;
}
export function ChecklistFiltros({
  usuarioSelecionado,
  setUsuarioSelecionado,
  tipoSelecionado,
  setTipoSelecionado,
  statusSelecionado,
  setStatusSelecionado,
  dataSelecionada,
  setDataSelecionada
}: ChecklistFiltrosProps) {
  const {
    data: todosUsuarios
  } = useAllUsers();
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFilters = [usuarioSelecionado !== "todos", tipoSelecionado !== "todos", statusSelecionado !== "todos", dataSelecionada !== undefined].filter(Boolean).length;
  return null;
}