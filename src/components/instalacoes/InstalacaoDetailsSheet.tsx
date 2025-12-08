import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar, Clock, MapPin, Phone, User, Loader2, Pencil, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstalacaoDetailsSheetProps {
  instalacao: InstalacaoCalendario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluirInstalacao: (id: string) => Promise<void>;
  isConcluindo: boolean;
  onInstalacaoUpdated?: () => void;
}

interface Equipe {
  id: string;
  nome: string;
  cor: string | null;
}

export const InstalacaoDetailsSheet = ({
  instalacao,
  open,
  onOpenChange,
  onConcluirInstalacao,
  isConcluindo,
  onInstalacaoUpdated,
}: InstalacaoDetailsSheetProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  
  // Campos editáveis
  const [nomeCliente, setNomeCliente] = useState("");
  const [dataInstalacao, setDataInstalacao] = useState("");
  const [hora, setHora] = useState("");
  const [equipeId, setEquipeId] = useState("");

  useEffect(() => {
    if (instalacao) {
      setNomeCliente(instalacao.nome_cliente || "");
      setDataInstalacao(instalacao.data_instalacao || "");
      setHora(instalacao.hora || "08:00");
      setEquipeId(instalacao.responsavel_instalacao_id || "");
    }
    setIsEditing(false);
  }, [instalacao]);

  useEffect(() => {
    if (open) {
      loadEquipes();
    }
  }, [open]);

  const loadEquipes = async () => {
    const { data, error } = await supabase
      .from("equipes_instalacao")
      .select("id, nome, cor")
      .eq("ativa", true)
      .order("nome");

    if (!error && data) {
      setEquipes(data);
    }
  };

  const handleSave = async () => {
    if (!instalacao) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("instalacoes")
        .update({
          nome_cliente: nomeCliente,
          data_instalacao: dataInstalacao,
          hora: hora,
          responsavel_instalacao_id: equipeId || null,
        })
        .eq("id", instalacao.id);

      if (error) throw error;

      toast.success("Instalação atualizada!");
      setIsEditing(false);
      onInstalacaoUpdated?.();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (instalacao) {
      setNomeCliente(instalacao.nome_cliente || "");
      setDataInstalacao(instalacao.data_instalacao || "");
      setHora(instalacao.hora || "08:00");
      setEquipeId(instalacao.responsavel_instalacao_id || "");
    }
    setIsEditing(false);
  };

  if (!instalacao) return null;

  const handleConcluir = () => {
    onConcluirInstalacao(instalacao.id);
  };

  const selectedEquipe = equipes.find(e => e.id === equipeId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="text-left">
            {isEditing ? "Editar Instalação" : "Detalhes da Instalação"}
          </SheetTitle>
          {!isEditing && !instalacao.instalacao_concluida && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isEditing ? (
            // Modo de edição
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_cliente">Nome do Cliente</Label>
                  <Input
                    id="nome_cliente"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={dataInstalacao}
                      onChange={(e) => setDataInstalacao(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipe">Equipe</Label>
                  <Select value={equipeId} onValueChange={setEquipeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipes.map((equipe) => (
                        <SelectItem key={equipe.id} value={equipe.id}>
                          <div className="flex items-center gap-2">
                            {equipe.cor && (
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
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
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </div>
            </>
          ) : (
            // Modo de visualização
            <>
              {/* Cliente */}
              <div>
                <h3 className="font-semibold text-lg">{instalacao.nome_cliente}</h3>
                {instalacao.equipe && (
                  <Badge 
                    variant="outline" 
                    className="mt-2"
                    style={{ 
                      borderColor: instalacao.equipe.cor || undefined,
                      color: instalacao.equipe.cor || undefined
                    }}
                  >
                    {instalacao.equipe.nome}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Data e Hora */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {instalacao.data_instalacao
                      ? format(parseISO(instalacao.data_instalacao), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "Data não definida"}
                  </span>
                </div>
                {instalacao.hora && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{instalacao.hora.slice(0, 5)}</span>
                  </div>
                )}
              </div>

              {/* Dados da venda (se houver) */}
              {instalacao.venda && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
                    {(instalacao.venda.cidade || instalacao.venda.estado) && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[instalacao.venda.bairro, instalacao.venda.cidade, instalacao.venda.estado]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {instalacao.venda.cliente_telefone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{instalacao.venda.cliente_telefone}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Responsável */}
              {instalacao.responsavel_instalacao_nome && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{instalacao.responsavel_instalacao_nome}</span>
                  </div>
                </>
              )}

              {/* Status */}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={instalacao.instalacao_concluida ? "default" : "secondary"}>
                  {instalacao.instalacao_concluida ? "Concluída" : "Pendente"}
                </Badge>
              </div>

              {/* Ações */}
              {!instalacao.instalacao_concluida && (
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={handleConcluir}
                    disabled={isConcluindo}
                  >
                    {isConcluindo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Concluindo...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir Instalação
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
