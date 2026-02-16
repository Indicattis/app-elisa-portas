import { NeoInstalacao } from "@/types/neoInstalacao";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  FileText,
  CheckCircle,
  Users,
  Building2,
  Pencil,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoInstalacaoDetailsProps {
  neoInstalacao: NeoInstalacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluir?: (id: string) => void;
  onEditar?: (neoInstalacao: NeoInstalacao) => void;
  isConcluindo?: boolean;
}

export function NeoInstalacaoDetails({
  neoInstalacao,
  open,
  onOpenChange,
  onConcluir,
  onEditar,
  isConcluindo,
}: NeoInstalacaoDetailsProps) {
  if (!neoInstalacao) return null;

  const isAutorizado = neoInstalacao.tipo_responsavel === 'autorizado';
  const corResponsavel = isAutorizado ? '#10B981' : (neoInstalacao.equipe?.cor || "#6366f1");
  const nomeResponsavel = isAutorizado 
    ? neoInstalacao.autorizado_nome || "Sem autorizado"
    : neoInstalacao.equipe_nome || "Sem equipe";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] max-w-[700px] mx-auto rounded-t-2xl overflow-hidden flex flex-col p-0 bg-zinc-900 border-t border-white/10"
      >
        {/* Header com gradiente */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-600/20 to-amber-600/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <SheetHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                Instalação Avulsa
              </Badge>
              <Badge
                style={{
                  backgroundColor: `${corResponsavel}20`,
                  color: corResponsavel,
                  borderColor: `${corResponsavel}50`,
                }}
              >
                {nomeResponsavel}
              </Badge>
            </div>
            <SheetTitle className="text-white text-lg text-left">
              {neoInstalacao.nome_cliente}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Localização e Data em card */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white">
                {neoInstalacao.cidade}/{neoInstalacao.estado}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-purple-400" />
              {neoInstalacao.data_instalacao ? (
                <span className="text-sm text-white">
                  {format(parseISO(neoInstalacao.data_instalacao), "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              ) : (
                <span className="text-sm text-white/50 italic">Não agendada</span>
              )}
            </div>
          </div>

          {/* Responsável em card */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              {isAutorizado ? (
                <Building2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Users className="h-4 w-4 text-indigo-400" />
              )}
              <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                {isAutorizado ? "Autorizado Responsável" : "Equipe Responsável"}
              </h3>
            </div>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${corResponsavel}20`,
                color: corResponsavel,
                borderColor: `${corResponsavel}50`,
              }}
            >
              {nomeResponsavel}
            </Badge>
          </div>

          {/* Valores financeiros */}
          {(neoInstalacao.valor_total > 0 || neoInstalacao.valor_a_receber > 0) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-green-400" />
                <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                  Financeiro
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Valor Total</p>
                  <p className="text-sm text-white font-medium">{formatCurrency(neoInstalacao.valor_total)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Valor a Receber</p>
                  <p className="text-sm text-green-400 font-medium">{formatCurrency(neoInstalacao.valor_a_receber)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Descrição se existir */}
          {neoInstalacao.descricao && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-amber-400" />
                <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                  Observações
                </h3>
              </div>
              <p className="text-sm text-white/80 whitespace-pre-wrap">
                {neoInstalacao.descricao}
              </p>
            </div>
          )}

          {/* Metadados */}
          <div className="text-xs text-white/40 space-y-1 pt-2">
            <p>
              Criado em:{" "}
              {format(parseISO(neoInstalacao.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
            {neoInstalacao.updated_at !== neoInstalacao.created_at && (
              <p>
                Última atualização:{" "}
                {format(parseISO(neoInstalacao.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        </div>

        {/* Footer com ações - fixo no fundo */}
        {!neoInstalacao.concluida && (onEditar || onConcluir) && (
          <div className="sticky bottom-0 bg-zinc-900 border-t border-white/10 px-6 py-4 space-y-2">
            {onEditar && (
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  onEditar(neoInstalacao);
                  onOpenChange(false);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {onConcluir && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onConcluir(neoInstalacao.id)}
                disabled={isConcluindo}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isConcluindo ? "Concluindo..." : "Concluir Instalação"}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
