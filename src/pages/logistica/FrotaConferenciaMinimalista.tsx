import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, Loader2, Check } from "lucide-react";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useConferencias } from "@/hooks/useConferencias";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { useAuth } from "@/hooks/useAuth";

export default function FrotaConferenciaMinimalista() {
  const navigate = useNavigate();
  useAuth();
  const { veiculos, isLoading } = useVeiculos();
  const { createConferencia, uploadFotoConferencia, isCreating, isUploading } = useConferencias();

  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kmAtual, setKmAtual] = useState("");
  const [dataTrocaOleo, setDataTrocaOleo] = useState("");
  const [aguaConferida, setAguaConferida] = useState(false);
  const [nivelOleoConferido, setNivelOleoConferido] = useState(false);
  const [observacoes, setObservacoes] = useState("");


  const veiculo = veiculos?.find(v => v.id === selectedVeiculo);

  // When vehicle is selected, prefill km
  useEffect(() => {
    if (veiculo) {
      setKmAtual(String(veiculo.km_atual || ""));
      setDataTrocaOleo(veiculo.data_troca_oleo || "");
    }
  }, [veiculo]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClearPhoto = () => {
    setCapturedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBack = () => {
    if (capturedPhoto) {
      handleClearPhoto();
    } else if (selectedVeiculo) {
      setSelectedVeiculo(null);
      setCapturedPhoto(null);
      setPhotoPreview(null);
    } else {
      navigate("/logistica/frota");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeiculo || !capturedPhoto) return;

    const foto_url = await uploadFotoConferencia({
      file: capturedPhoto,
      veiculo_id: selectedVeiculo
    });

    await createConferencia({
      veiculo_id: selectedVeiculo,
      foto_url,
      km_atual: Number(kmAtual),
      data_troca_oleo: dataTrocaOleo || undefined,
      agua_conferida: aguaConferida,
      observacoes: observacoes || undefined,
      status: veiculo?.status || "rodando"
    });

    navigate("/logistica/frota");
  };

  const stepTitle = !selectedVeiculo
    ? "Selecione o veículo"
    : !capturedPhoto
    ? `Foto: ${veiculo?.nome}`
    : `Conferir: ${veiculo?.nome}`;

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/40 focus-visible:ring-blue-400/20";

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Frota", path: "/logistica/frota" },
          { label: "Conferência" },
        ]}
        mounted={mounted}
      />

      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-blue-500/20">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-blue-400">Conferência</h1>
              <p className="text-xs text-white/60">{stepTitle}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
              </div>
            ) : !selectedVeiculo ? (
              /* Step 1: Select Vehicle */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {veiculos?.map((v) => (
                  <Card
                    key={v.id}
                    onClick={() => setSelectedVeiculo(v.id)}
                    className="cursor-pointer bg-white/5 border-blue-500/10 backdrop-blur-xl hover:bg-blue-500/5 hover:border-blue-400/20 transition-all duration-300"
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {v.foto_url ? (
                          <img
                            src={v.foto_url}
                            alt={v.nome}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-white/5 rounded-lg flex items-center justify-center text-white/30 text-xs">
                            Sem foto
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-sm text-white">{v.nome}</h3>
                          <p className="text-xs text-white/50">{v.modelo}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40">{v.placa || "-"}</span>
                          <StatusBadge status={v.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {veiculos?.length === 0 && (
                  <div className="col-span-full text-center py-12 text-white/50">
                    Nenhum veículo cadastrado
                  </div>
                )}
              </div>
            ) : !capturedPhoto ? (
              /* Step 2: Capture Photo */
              <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-blue-400" />
                    </div>
                    <p className="text-center text-white/60 text-sm">
                      Tire uma foto do veículo para registrar a conferência
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                    <Button
                      size="lg"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full max-w-xs bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white hover:bg-blue-500/25 hover:border-blue-400/35 transition-all duration-300"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Abrir Câmera
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      Voltar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Step 3: Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo preview */}
                <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="relative">
                      <img
                        src={photoPreview!}
                        alt="Foto do veículo"
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleClearPhoto}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-red-500/30 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Form fields */}
                <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Km Atual *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={kmAtual}
                        onChange={(e) => setKmAtual(e.target.value)}
                        placeholder="Quilometragem atual"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Data da Última Troca de Óleo</Label>
                      <Input
                        type="date"
                        value={dataTrocaOleo}
                        onChange={(e) => setDataTrocaOleo(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agua"
                        checked={aguaConferida}
                        onCheckedChange={(c) => setAguaConferida(c as boolean)}
                        className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor="agua" className="text-white/70 text-sm cursor-pointer">
                        Água conferida
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="oleo"
                        checked={nivelOleoConferido}
                        onCheckedChange={(c) => setNivelOleoConferido(c as boolean)}
                        className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor="oleo" className="text-white/70 text-sm cursor-pointer">
                        Nível do óleo conferido
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">Observações</Label>
                      <Input
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Observações da conferência"
                        className={inputClass}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || isUploading || !kmAtual}
                    className="flex-1 bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white hover:bg-blue-500/25 hover:border-blue-400/35 transition-all duration-300"
                  >
                    {(isCreating || isUploading) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Finalizar Conferência
                  </Button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
