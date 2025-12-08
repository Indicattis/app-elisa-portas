import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface InstalacaoCompleta {
  id: string;
  nome_cliente: string;
  data_instalacao: string | null;
  hora: string;
  responsavel_instalacao_id: string | null;
  telefone_cliente: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  cep: string | null;
  observacoes: string | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [instalacaoCompleta, setInstalacaoCompleta] = useState<InstalacaoCompleta | null>(null);
  
  // Campos editáveis
  const [nomeCliente, setNomeCliente] = useState("");
  const [dataInstalacao, setDataInstalacao] = useState("");
  const [hora, setHora] = useState("");
  const [equipeId, setEquipeId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (instalacao && open) {
      loadInstalacaoCompleta(instalacao.id);
      loadEquipes();
    }
    setIsEditing(false);
  }, [instalacao, open]);

  const loadInstalacaoCompleta = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("instalacoes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setInstalacaoCompleta(data);
        setNomeCliente(data.nome_cliente || "");
        setDataInstalacao(data.data_instalacao || "");
        setHora(data.hora || "08:00");
        setEquipeId(data.responsavel_instalacao_id || "");
        setTelefone(data.telefone_cliente || "");
        setCidade(data.cidade || "");
        setEstado(data.estado || "");
        setEndereco(data.endereco || "");
        setCep(data.cep || "");
        setObservacoes(data.observacoes || "");
      }
    } catch (error) {
      console.error("Erro ao carregar instalação:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
          data_instalacao: dataInstalacao || null,
          hora: hora,
          responsavel_instalacao_id: equipeId || null,
          telefone_cliente: telefone || null,
          cidade: cidade || null,
          estado: estado || null,
          endereco: endereco || null,
          cep: cep || null,
          observacoes: observacoes || null,
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
    if (instalacaoCompleta) {
      setNomeCliente(instalacaoCompleta.nome_cliente || "");
      setDataInstalacao(instalacaoCompleta.data_instalacao || "");
      setHora(instalacaoCompleta.hora || "08:00");
      setEquipeId(instalacaoCompleta.responsavel_instalacao_id || "");
      setTelefone(instalacaoCompleta.telefone_cliente || "");
      setCidade(instalacaoCompleta.cidade || "");
      setEstado(instalacaoCompleta.estado || "");
      setEndereco(instalacaoCompleta.endereco || "");
      setCep(instalacaoCompleta.cep || "");
      setObservacoes(instalacaoCompleta.observacoes || "");
    }
    setIsEditing(false);
  };

  if (!instalacao) return null;

  const handleConcluir = () => {
    onConcluirInstalacao(instalacao.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="text-left">
            {isEditing ? "Editar Instalação" : "Detalhes da Instalação"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {isEditing ? (
                // Modo de edição
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_cliente">Nome do Cliente</Label>
                    <Input
                      id="nome_cliente"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
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

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, número, bairro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        maxLength={2}
                        placeholder="UF"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Informações adicionais..."
                      rows={3}
                    />
                  </div>
                </div>
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

                  {/* Localização */}
                  {(instalacaoCompleta?.cidade || instalacaoCompleta?.estado || instalacaoCompleta?.endereco) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="space-y-1">
                            {instalacaoCompleta.endereco && (
                              <p>{instalacaoCompleta.endereco}</p>
                            )}
                            {(instalacaoCompleta.cidade || instalacaoCompleta.estado) && (
                              <p className="text-muted-foreground">
                                {[instalacaoCompleta.cidade, instalacaoCompleta.estado]
                                  .filter(Boolean)
                                  .join(" - ")}
                              </p>
                            )}
                            {instalacaoCompleta.cep && (
                              <p className="text-muted-foreground text-sm">CEP: {instalacaoCompleta.cep}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Telefone */}
                  {instalacaoCompleta?.telefone_cliente && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{instalacaoCompleta.telefone_cliente}</span>
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

                  {/* Observações */}
                  {instalacaoCompleta?.observacoes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
                        <p className="text-sm whitespace-pre-wrap">{instalacaoCompleta.observacoes}</p>
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
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Ações fixas no rodapé */}
        {!isLoading && (
          <div className="p-6 pt-4 border-t">
            {isEditing ? (
              <div className="flex gap-2">
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
            ) : !instalacao.instalacao_concluida ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1" 
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleConcluir}
                  disabled={isConcluindo}
                >
                  {isConcluindo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Concluir
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
