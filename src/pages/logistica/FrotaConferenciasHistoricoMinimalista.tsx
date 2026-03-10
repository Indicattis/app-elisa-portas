import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useConferencias } from "@/hooks/useConferencias";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";

export default function FrotaConferenciasHistoricoMinimalista() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { veiculos, isLoading: loadingVeiculos } = useVeiculos();
  const { conferencias, isLoading: loadingConferencias } = useConferencias(id);
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const veiculo = veiculos?.find(v => v.id === id);
  const isLoading = loadingVeiculos || loadingConferencias;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Frota", path: "/logistica/frota" },
          { label: "Histórico" },
        ]}
        mounted={mounted}
      />

      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-blue-500/20">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate("/logistica/frota")}
              className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {isLoading ? "Carregando..." : veiculo ? `Histórico: ${veiculo.nome}` : "Veículo não encontrado"}
              </h1>
              {veiculo && (
                <p className="text-xs text-white/60">
                  {conferencias?.length || 0} conferências registradas
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
            </div>
          ) : !veiculo ? (
            <div className="flex items-center justify-center h-64 text-white/50">
              Veículo não encontrado
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {conferencias?.map((conferencia) => (
                <Card
                  key={conferencia.id}
                  className="bg-white/5 border-white/10 backdrop-blur-xl cursor-pointer hover:bg-white/10 transition-all duration-200"
                  onClick={() => setSelectedFoto(conferencia.foto_url)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <img
                        src={conferencia.foto_url}
                        alt="Foto da conferência"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50">
                            {format(new Date(conferencia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <StatusBadge status={conferencia.status as any} />
                        </div>
                        <div className="text-sm space-y-1 text-white/80">
                          <p><span className="text-white/50">Km:</span> {conferencia.km_atual.toLocaleString("pt-BR")}</p>
                          {conferencia.data_troca_oleo && (
                            <p><span className="text-white/50">Troca óleo:</span> {format(new Date(conferencia.data_troca_oleo), "dd/MM/yyyy", { locale: ptBR })}</p>
                          )}
                          <p><span className="text-white/50">Água:</span> {conferencia.agua_conferida ? "Conferida ✓" : "Não conferida"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {conferencias?.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/40">
                  Nenhuma conferência registrada para este veículo
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selectedFoto} onOpenChange={() => setSelectedFoto(null)}>
        <DialogContent className="max-w-4xl bg-black/90 border-white/10 backdrop-blur-xl">
          {selectedFoto && (
            <img src={selectedFoto} alt="Foto em detalhe" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
