import { useState } from "react";
import { Calendar, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrdensSemDataCarregamento } from "@/hooks/useOrdensSemDataCarregamento";
import { useResponsaveisInstalacao } from "@/hooks/useResponsaveisInstalacao";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const OrdensSemData = () => {
  const { ordens, isLoading, updateOrdem } = useOrdensSemDataCarregamento();
  const { responsaveis, loading: loadingResponsaveis } = useResponsaveisInstalacao();
  const [editOrdem, setEditOrdem] = useState<OrdemCarregamento | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  
  const [dataCarregamento, setDataCarregamento] = useState("");
  const [tipoInstalacao, setTipoInstalacao] = useState<'elisa' | 'autorizados'>('elisa');
  const [responsavelId, setResponsavelId] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [saving, setSaving] = useState(false);

  const responsaveisFiltrados = responsaveis.filter(
    (r) => r.tipo === (tipoInstalacao === 'elisa' ? 'equipe_interna' : 'autorizado')
  );

  const handleEdit = (ordem: OrdemCarregamento) => {
    setEditOrdem(ordem);
    setDataCarregamento("");
    setTipoInstalacao('elisa');
    setResponsavelId("");
    setResponsavelNome("");
    setEditOpen(true);
  };

  const handleTipoChange = (novoTipo: 'elisa' | 'autorizados') => {
    setTipoInstalacao(novoTipo);
    setResponsavelId("");
    setResponsavelNome("");
  };

  const handleResponsavelChange = (id: string) => {
    setResponsavelId(id);
    const responsavel = responsaveisFiltrados.find((r) => r.id === id);
    setResponsavelNome(responsavel?.nome || "");
  };

  const handleSaveEdit = async () => {
    if (!editOrdem || !dataCarregamento || !responsavelId) {
      return;
    }

    setSaving(true);
    try {
      await updateOrdem({
        id: editOrdem.id,
        data: {
          data_carregamento: dataCarregamento,
          tipo_carregamento: tipoInstalacao,
          responsavel_carregamento_id: responsavelId,
          responsavel_carregamento_nome: responsavelNome,
          status: 'agendada',
        },
      });
      toast.success("Data de carregamento definida com sucesso!");
      setEditOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ordens Pendentes de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (ordens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ordens Pendentes de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Não há ordens pendentes de agendamento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ordens Pendentes de Agendamento
            <Badge variant="secondary" className="ml-auto">
              {ordens.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ordens.map((ordem) => (
              <div
                key={ordem.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{ordem.venda?.cliente_nome}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {ordem.venda?.cidade}/{ordem.venda?.estado}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(ordem)}
                  className="ml-4"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Definir Data
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="w-full max-w-[700px] mx-auto">
          <SheetHeader>
            <SheetTitle>Definir Data de Carregamento</SheetTitle>
            <SheetDescription>
              Configure a data e o responsável pelo carregamento
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Cliente</Label>
              <p className="text-sm font-medium">{editOrdem?.venda?.cliente_nome}</p>
            </div>

            {/* Data de Carregamento */}
            <div className="space-y-2">
              <Label htmlFor="data_carregamento">
                Data de Carregamento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_carregamento"
                type="date"
                value={dataCarregamento}
                onChange={(e) => setDataCarregamento(e.target.value)}
                required
              />
            </div>

            {/* Tipo de Instalação */}
            <div className="space-y-2">
              <Label htmlFor="tipo_instalacao">
                Tipo de Instalação <span className="text-destructive">*</span>
              </Label>
              <Select
                value={tipoInstalacao}
                onValueChange={(value) => handleTipoChange(value as 'elisa' | 'autorizados')}
              >
                <SelectTrigger id="tipo_instalacao">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elisa">Instalação Elisa</SelectItem>
                  <SelectItem value="autorizados">Autorizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsavel">
                {tipoInstalacao === 'elisa' ? 'Equipe' : 'Autorizado'}{' '}
                <span className="text-destructive">*</span>
              </Label>
              {loadingResponsaveis ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select
                  value={responsavelId}
                  onValueChange={handleResponsavelChange}
                >
                  <SelectTrigger id="responsavel">
                    <SelectValue placeholder={`Selecione ${tipoInstalacao === 'elisa' ? 'a equipe' : 'o autorizado'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {responsaveisFiltrados.map((resp) => (
                      <SelectItem key={resp.id} value={resp.id}>
                        {resp.nome}
                        {resp.cidade && resp.estado && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({resp.cidade}/{resp.estado})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!dataCarregamento || !responsavelId || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
