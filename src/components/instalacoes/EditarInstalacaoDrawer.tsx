import { useState, useEffect } from "react";
import { Instalacao } from "@/types/instalacao";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResponsaveisInstalacao } from "@/hooks/useResponsaveisInstalacao";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface EditarInstalacaoDrawerProps {
  instalacao: Instalacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    data_instalacao: string;
    tipo_instalacao: 'elisa' | 'autorizados';
    responsavel_instalacao_id: string;
    responsavel_instalacao_nome: string;
  }) => Promise<void>;
}

export const EditarInstalacaoDrawer = ({
  instalacao,
  open,
  onOpenChange,
  onSave,
}: EditarInstalacaoDrawerProps) => {
  const [dataCarregamento, setDataCarregamento] = useState("");
  const [tipoInstalacao, setTipoInstalacao] = useState<'elisa' | 'autorizados'>('elisa');
  const [responsavelId, setResponsavelId] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [saving, setSaving] = useState(false);

  const { responsaveis, loading: loadingResponsaveis } = useResponsaveisInstalacao();

  // Inicializar valores quando a instalação mudar
  useEffect(() => {
    if (instalacao) {
      setDataCarregamento(instalacao.data || "");
      setTipoInstalacao(instalacao.tipo_instalacao || 'elisa');
      setResponsavelId(instalacao.responsavel_instalacao_id || "");
      setResponsavelNome(instalacao.responsavel_instalacao_nome || "");
    }
  }, [instalacao]);

  // Filtrar responsáveis baseado no tipo selecionado
  const responsaveisFiltrados = responsaveis.filter(
    (r) => r.tipo === (tipoInstalacao === 'elisa' ? 'equipe_interna' : 'autorizado')
  );

  // Resetar responsável ao mudar o tipo
  const handleTipoChange = (novoTipo: 'elisa' | 'autorizados') => {
    setTipoInstalacao(novoTipo);
    setResponsavelId("");
    setResponsavelNome("");
  };

  // Atualizar nome ao selecionar responsável
  const handleResponsavelChange = (id: string) => {
    setResponsavelId(id);
    const responsavel = responsaveisFiltrados.find((r) => r.id === id);
    setResponsavelNome(responsavel?.nome || "");
  };

  const handleSave = async () => {
    if (!dataCarregamento || !responsavelId) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        data_instalacao: dataCarregamento,
        tipo_instalacao: tipoInstalacao,
        responsavel_instalacao_id: responsavelId,
        responsavel_instalacao_nome: responsavelNome,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-[700px] mx-auto">
        <SheetHeader>
          <SheetTitle>Editar Instalação</SheetTitle>
          <SheetDescription>
            Defina a data de carregamento e o responsável pela instalação
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Cliente (apenas visualização) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Cliente</Label>
            <p className="text-sm font-medium">{instalacao?.nome_cliente}</p>
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
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
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
  );
};
