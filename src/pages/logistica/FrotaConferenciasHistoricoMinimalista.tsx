import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useConferencias } from "@/hooks/useConferencias";
import { useVeiculoArquivos } from "@/hooks/useVeiculoArquivos";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useRef } from "react";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";

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
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const veiculo = veiculos?.find(v => v.id === id);
  const isLoading = loadingVeiculos || loadingConferencias;

  const dynamicTitle = isLoading ? "Carregando..." : veiculo ? `Histórico: ${veiculo.nome}` : "Veículo não encontrado";
  const dynamicSubtitle = veiculo ? `${conferencias?.length || 0} conferências registradas` : undefined;

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
              {/* Conferências */}
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {conferencias?.map((conferencia) => (
                  <Card
                    key={conferencia.id}
                    className="bg-white/5 border-blue-500/10 backdrop-blur-xl cursor-pointer hover:bg-blue-500/5 transition-all duration-200"
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

              {/* Arquivos */}
              <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white/90">Arquivos</h2>
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

                {loadingArquivos ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                  </div>
                ) : arquivos && arquivos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {arquivos.map((arquivo) => (
                      <div
                        key={arquivo.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-blue-500/10 backdrop-blur-xl hover:bg-white/8 transition-all"
                      >
                        <FileText className="h-5 w-5 text-blue-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/90 truncate">{arquivo.nome}</p>
                          <p className="text-xs text-white/40">
                            {formatFileSize(arquivo.tamanho)} · {format(new Date(arquivo.created_at), "dd/MM/yy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/30 text-sm">
                    Nenhum arquivo anexado
                  </div>
                )}
              </div>
            </div>
          )}
      <Dialog open={!!selectedFoto} onOpenChange={() => setSelectedFoto(null)}>
        <DialogContent className="max-w-4xl bg-black/90 border-white/10 backdrop-blur-xl">
          {selectedFoto && (
            <img src={selectedFoto} alt="Foto em detalhe" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </MinimalistLayout>
  );
}
