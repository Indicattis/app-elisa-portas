import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { InstalacoesPorColaboradorModal } from "@/components/metas/InstalacoesPorColaboradorModal";
import { User, Trophy, Users, Crown, Target, Plus, CalendarDays, DoorOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useSetoresLideres } from "@/hooks/useSetoresLideres";
import { useMetasInstalacao, useCriarMetaInstalacao, useProgressoMetaInstalacao, useTamanhosMetaInstalacao, type MetaInstalacao } from "@/hooks/useMetasInstalacao";
import { Progress } from "@/components/ui/progress";
import { InstalacoesDaMetaModal } from "@/components/metas/InstalacoesDaMetaModal";

// --- Types ---
interface Colaborador {
  id: string;
  user_id: string;
  nome: string;
  role: string;
  foto_perfil_url: string | null;
}

interface Equipe {
  id: string;
  nome: string;
  cor: string;
  responsavel_id: string | null;
  responsavel?: { nome: string; foto_perfil_url: string | null } | null;
  membros: Colaborador[];
}

const roleLabels: Record<string, string> = {
  gerente_instalacoes: "Gerente",
  instalador: "Instalador",
  aux_instalador: "Auxiliar",
};

// --- Sub-components ---
function MetaFormDialog({
  tipo,
  referenciaId,
  label,
  metaAtiva,
}: {
  tipo: "equipe" | "gerente";
  referenciaId: string;
  label: string;
  metaAtiva: MetaInstalacao | null;
}) {
  const [open, setOpen] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataTermino, setDataTermino] = useState<Date>();
  const [portas, setPortas] = useState("");
  const criarMeta = useCriarMetaInstalacao();

  const handleSubmit = () => {
    if (!dataInicio || !dataTermino || !portas) return;
    criarMeta.mutate(
      {
        tipo,
        referencia_id: referenciaId,
        quantidade_portas: parseInt(portas),
        data_inicio: format(dataInicio, "yyyy-MM-dd"),
        data_termino: format(dataTermino, "yyyy-MM-dd"),
      },
      { onSuccess: () => { setOpen(false); setPortas(""); setDataInicio(undefined); setDataTermino(undefined); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={metaAtiva ? "outline" : "default"} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {metaAtiva ? "Nova Meta" : "Criar Meta"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Meta — {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Quantidade de Portas</Label>
            <Input
              type="number"
              min={1}
              value={portas}
              onChange={(e) => setPortas(e.target.value)}
              placeholder="Ex: 50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Início</Label>
              <DatePickerField date={dataInicio} onSelect={setDataInicio} />
            </div>
            <div>
              <Label>Data Término</Label>
              <DatePickerField date={dataTermino} onSelect={setDataTermino} />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!dataInicio || !dataTermino || !portas || criarMeta.isPending} className="w-full">
            {criarMeta.isPending ? "Salvando..." : "Salvar Meta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DatePickerField({ date, onSelect }: { date: Date | undefined; onSelect: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy") : "Selecionar"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}

function MetaCard({ meta }: { meta: MetaInstalacao }) {
  const [modalAberto, setModalAberto] = useState(false);
  const { data: progresso = 0 } = useProgressoMetaInstalacao(meta);
  const { data: tamanhos } = useTamanhosMetaInstalacao(meta);
  const porcentagem = Math.min((progresso / meta.quantidade_portas) * 100, 100);
  const atingida = progresso >= meta.quantidade_portas;

  return (
    <>
      <div
        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/80 ${atingida ? "border-green-500/50 bg-green-500/5" : "border-border bg-accent/50"}`}
        onClick={() => setModalAberto(true)}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <DoorOpen className={`h-5 w-5 shrink-0 ${atingida ? "text-green-500" : "text-primary"}`} />
            <p className="text-sm font-medium">{meta.quantidade_portas} portas</p>
          </div>
          {atingida ? (
            <Badge className="text-xs bg-green-500/20 text-green-500 border-green-500/30">
              <Trophy className="h-3 w-3 mr-1" /> Atingida!
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Ativa</Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progresso} / {meta.quantidade_portas} portas
            </span>
            <span className={`font-medium ${atingida ? "text-green-500" : "text-foreground"}`}>
              {porcentagem.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={porcentagem}
            className={`h-2 ${atingida ? "[&>div]:bg-green-500" : ""}`}
          />
        </div>

        {tamanhos && (tamanhos.P > 0 || tamanhos.G > 0 || tamanhos.GG > 0) && (
          <div className="flex items-center gap-1.5 mt-2">
            {tamanhos.P > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                P <span className="font-bold">{tamanhos.P}</span>
              </Badge>
            )}
            {tamanhos.G > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                G <span className="font-bold">{tamanhos.G}</span>
              </Badge>
            )}
            {tamanhos.GG > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                GG <span className="font-bold">{tamanhos.GG}</span>
              </Badge>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(meta.data_inicio + "T00:00:00"), "dd/MM/yyyy")} — {format(new Date(meta.data_termino + "T00:00:00"), "dd/MM/yyyy")}
        </p>
      </div>
      <InstalacoesDaMetaModal meta={meta} open={modalAberto} onOpenChange={setModalAberto} />
    </>
  );
}

// --- Main component ---
export default function MetasInstalacoesDirecao() {
  const navigate = useNavigate();
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string | null>(null);

  const { lideres } = useSetoresLideres();
  const gerenteSetor = lideres.find((l) => l.setor === "instalacoes");

  const { data: metas } = useMetasInstalacao();

  const { data: colaboradores, isLoading: loadingColabs } = useQuery({
    queryKey: ["colaboradores-instalacao-metas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, user_id, nome, role, foto_perfil_url")
        .in("role", ["gerente_instalacoes", "instalador", "aux_instalador"])
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as Colaborador[];
    },
  });

  const { data: equipes, isLoading: loadingEquipes } = useQuery({
    queryKey: ["equipes-instalacao-metas"],
    queryFn: async () => {
      const { data: equipesData, error } = await supabase
        .from("equipes_instalacao")
        .select(`*, responsavel:responsavel_id (nome, foto_perfil_url)`)
        .eq("ativa", true)
        .order("nome");
      if (error) throw error;

      const result: Equipe[] = await Promise.all(
        (equipesData || []).map(async (eq: any) => {
          const { data: membrosData } = await supabase
            .from("equipes_instalacao_membros")
            .select("user_id")
            .eq("equipe_id", eq.id);
          const userIds = (membrosData || []).map((m: any) => m.user_id);
          let membros: Colaborador[] = [];
          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from("admin_users")
              .select("id, user_id, nome, role, foto_perfil_url")
              .in("user_id", userIds)
              .eq("ativo", true);
            membros = (usersData || []) as Colaborador[];
          }
          return { id: eq.id, nome: eq.nome, cor: eq.cor, responsavel_id: eq.responsavel_id, responsavel: eq.responsavel, membros };
        })
      );
      return result;
    },
  });

  const { data: usersComMetas } = useQuery({
    queryKey: ["users-com-metas-individuais-instalacoes"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("metas_colaboradores")
        .select("user_id")
        .gte("data_termino", hoje)
        .eq("concluida", false);
      if (error) return new Set<string>();
      return new Set(data?.map((m) => m.user_id) || []);
    },
  });

  const isLoading = loadingColabs || loadingEquipes;
  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  const hoje = new Date().toISOString().split("T")[0];
  const getMetaAtiva = (tipo: "equipe" | "gerente", refId: string): MetaInstalacao | null => {
    return metas?.find((m) => m.tipo === tipo && m.referencia_id === refId && m.data_termino >= hoje && !m.concluida) || null;
  };

  // Colaboradores sem equipe
  const membrosEmEquipes = new Set<string>();
  equipes?.forEach((eq) => {
    if (eq.responsavel_id) membrosEmEquipes.add(eq.responsavel_id);
    eq.membros.forEach((m) => membrosEmEquipes.add(m.user_id));
  });
  const semEquipe = colaboradores?.filter((c) => !membrosEmEquipes.has(c.user_id)) || [];

  const renderColaborador = (colab: Colaborador, isResponsavel = false) => (
    <div
      key={colab.user_id}
      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
      onClick={() => setSelectedColaboradorId(colab.user_id)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={colab.foto_perfil_url || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-sm">{getInitials(colab.nome)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{colab.nome}</span>
          {usersComMetas?.has(colab.user_id) && <Trophy className="h-4 w-4 text-amber-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{roleLabels[colab.role] || colab.role}</span>
          {isResponsavel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-400">
              <Crown className="h-3 w-3 mr-0.5" /> Responsável
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <MinimalistLayout
      title="Metas Instalações"
      subtitle="Metas do setor de instalação"
      backPath="/direcao/metas"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Metas", path: "/direcao/metas" },
        { label: "Instalações" },
      ]}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold capitalize text-foreground">{mesAtual}</h2>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Seção: Meta do Gerente */}
          {gerenteSetor?.lider && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-accent/30">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Meta do Gerente do Setor</h3>
                </div>
                <MetaFormDialog
                  tipo="gerente"
                  referenciaId={gerenteSetor.lider_id}
                  label={gerenteSetor.lider.nome}
                  metaAtiva={getMetaAtiva("gerente", gerenteSetor.lider_id)}
                />
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={gerenteSetor.lider.foto_perfil_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {getInitials(gerenteSetor.lider.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{gerenteSetor.lider.nome}</p>
                    <p className="text-xs text-muted-foreground">Gerente de Instalações</p>
                  </div>
                </div>
                {getMetaAtiva("gerente", gerenteSetor.lider_id) ? (
                  <MetaCard meta={getMetaAtiva("gerente", gerenteSetor.lider_id)!} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhuma meta ativa</p>
                )}
              </div>
            </div>
          )}

          {/* Seção: Metas por Equipe */}
          {equipes && equipes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" /> Metas por Equipe
              </h3>
              {equipes.map((equipe) => {
                const metaAtiva = getMetaAtiva("equipe", equipe.id);
                return (
                  <div key={equipe.id} className="rounded-xl border border-border overflow-hidden">
                    <div
                      className="flex items-center justify-between gap-3 px-4 py-3"
                      style={{ borderLeft: `4px solid ${equipe.cor}` }}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-foreground">{equipe.nome}</h4>
                        <span className="text-xs text-muted-foreground">{equipe.membros.length} membro(s)</span>
                      </div>
                      <MetaFormDialog tipo="equipe" referenciaId={equipe.id} label={equipe.nome} metaAtiva={metaAtiva} />
                    </div>
                    <div className="p-3">
                      {metaAtiva ? (
                        <MetaCard meta={metaAtiva} />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">Nenhuma meta ativa</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seção: Colaboradores Individuais */}
          {colaboradores && colaboradores.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5" /> Desempenho Individual
              </h3>

              {equipes?.map((equipe) => {
                const responsavelColab = colaboradores.find((c) => c.user_id === equipe.responsavel_id);
                const membrosExcluindoResp = equipe.membros.filter((m) => m.user_id !== equipe.responsavel_id);

                return (
                  <div key={equipe.id} className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3" style={{ borderLeft: `4px solid ${equipe.cor}` }}>
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <h4 className="font-semibold text-foreground">{equipe.nome}</h4>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {(responsavelColab ? 1 : 0) + membrosExcluindoResp.length} membro(s)
                      </span>
                    </div>
                    <div className="p-3 space-y-2 bg-primary/5">
                      {responsavelColab && renderColaborador(responsavelColab, true)}
                      {membrosExcluindoResp.map((m) => renderColaborador(m))}
                      {!responsavelColab && membrosExcluindoResp.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">Nenhum membro</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {semEquipe.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-l-4 border-muted-foreground/20">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold text-foreground">Sem equipe</h4>
                    <span className="text-xs text-muted-foreground ml-auto">{semEquipe.length} membro(s)</span>
                  </div>
                  <div className="p-3 space-y-2 bg-primary/5">
                    {semEquipe.map((c) => renderColaborador(c))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && (!colaboradores || colaboradores.length === 0) && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de instalações do colaborador */}
      <InstalacoesPorColaboradorModal
        userId={selectedColaboradorId || ""}
        open={!!selectedColaboradorId}
        onOpenChange={(open) => { if (!open) setSelectedColaboradorId(null); }}
      />
    </MinimalistLayout>
  );
}
