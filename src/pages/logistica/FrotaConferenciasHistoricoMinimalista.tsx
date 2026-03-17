import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useConferencias, Conferencia } from "@/hooks/useConferencias";
import { useVeiculoArquivos } from "@/hooks/useVeiculoArquivos";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useRef } from "react";
import { Upload, FileText, Trash2, Download, Loader2, Paperclip, Droplets, Calendar, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FrotaConferenciasHistoricoMinimalista() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { veiculos, isLoading: loadingVeiculos } = useVeiculos();
  const { conferencias, isLoading: loadingConferencias } = useConferencias(id);
  const { arquivos, isLoading: loadingArquivos, uploadArquivo, deleteArquivo, isUploading, isDeleting } = useVeiculoArquivos(id);
  const [selectedConferencia, setSelectedConferencia] = useState<Conferencia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const veiculo = veiculos?.find(v => v.id === id);
  const isLoading = loadingVeiculos || loadingConferencias;

  type TimelineItem =
    | { type: 'conferencia'; created_at: string; data: NonNullable<typeof conferencias>[number] }
    | { type: 'arquivo'; created_at: string; data: NonNullable<typeof arquivos>[number] };

  const timeline: TimelineItem[] = [
    ...(conferencias?.map(c => ({ type: 'conferencia' as const, created_at: c.created_at, data: c })) || []),
    ...(arquivos?.map(a => ({ type: 'arquivo' as const, created_at: a.created_at, data: a })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const dynamicTitle = isLoading ? "Carregando..." : veiculo ? `Histórico: ${veiculo.nome}` : "Veículo não encontrado";
  const dynamicSubtitle = veiculo ? `${timeline.length} registros no histórico` : undefined;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id) return;
    for (const file of Array.from(files)) {
      await uploadArquivo({ file, veiculoId: id });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <MinimalistLayout
      title={dynamicTitle}
      subtitle={dynamicSubtitle}
      backPath="/logistica/frota"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Frota", path: "/logistica/frota" },
        { label: "Histórico" },
      ]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
        </div>
      ) : !veiculo ? (
        <div className="flex items-center justify-center h-64 text-white/50">
          Veículo não encontrado
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upload button */}
          <div className="max-w-7xl mx-auto flex justify-end mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white text-sm hover:bg-blue-500/25 hover:border-blue-400/35 transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Enviando..." : "Anexar arquivo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Unified Timeline */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {timeline.map((item) => {
              if (item.type === 'conferencia') {
                const conferencia = item.data;
                return (
                  <Card
                    key={`conf-${conferencia.id}`}
                    className="bg-white/5 border-blue-500/10 backdrop-blur-xl cursor-pointer hover:bg-blue-500/5 transition-all duration-200"
                    onClick={() => setSelectedConferencia(conferencia)}
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
                );
              }

              const arquivo = item.data;
              return (
                <Card
                  key={`arq-${arquivo.id}`}
                  className="bg-white/5 border-blue-500/10 backdrop-blur-xl hover:bg-blue-500/5 transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="w-full h-48 rounded-lg bg-white/5 flex flex-col items-center justify-center gap-2">
                        <Paperclip className="h-10 w-10 text-blue-400/60" />
                        <Badge variant="secondary" className="bg-blue-500/15 text-blue-300 border-blue-500/20 text-[10px]">
                          Arquivo anexado
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50">
                            {format(new Date(arquivo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <div className="flex items-center gap-1">
                            <a
                              href={arquivo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => deleteArquivo(arquivo)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-white/90 truncate">{arquivo.nome}</p>
                        <p className="text-xs text-white/40">{formatFileSize(arquivo.tamanho)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {timeline.length === 0 && (
              <div className="col-span-full text-center py-12 text-white/40">
                Nenhum registro encontrado para este veículo
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog de detalhes da conferência */}
      <Dialog open={!!selectedConferencia} onOpenChange={() => setSelectedConferencia(null)}>
        <DialogContent className="max-w-2xl bg-black/95 border-white/10 backdrop-blur-xl p-0 overflow-hidden">
          {selectedConferencia && (
            <div className="space-y-0">
              {/* Foto em destaque */}
              <a href={selectedConferencia.foto_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={selectedConferencia.foto_url}
                  alt="Foto da conferência"
                  className="w-full max-h-[400px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>

              {/* Informações */}
              <div className="p-6 space-y-4">
                {/* Header: data + status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">
                    {format(new Date(selectedConferencia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <StatusBadge status={selectedConferencia.status as any} />
                </div>

                {/* Grid de informações */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Gauge className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-white/40">Km Atual</p>
                      <p className="text-sm font-medium text-white">{selectedConferencia.km_atual.toLocaleString("pt-BR")} km</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Droplets className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-white/40">Água</p>
                      <p className="text-sm font-medium text-white">
                        {selectedConferencia.agua_conferida ? "Conferida ✓" : "Não conferida ✗"}
                      </p>
                    </div>
                  </div>

                  {selectedConferencia.data_troca_oleo && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-xs text-white/40">Troca de Óleo</p>
                        <p className="text-sm font-medium text-white">
                          {format(new Date(selectedConferencia.data_troca_oleo), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedConferencia.conferente && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="h-5 w-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] text-blue-300 font-bold">
                        {selectedConferencia.conferente.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Conferente</p>
                        <p className="text-sm font-medium text-white">{selectedConferencia.conferente.nome}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MinimalistLayout>
  );
}
