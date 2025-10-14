import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onCapture(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center space-y-4">
        {preview ? (
          <div className="relative w-full max-w-md">
            <img 
              src={preview} 
              alt="Foto capturada" 
              className="w-full h-auto rounded-lg border"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleClear}
            >
              <X className="h-4 w-4 mr-1" />
              Tirar outra
            </Button>
          </div>
        ) : (
          <>
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-16 w-16 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Clique no botão abaixo para tirar uma foto do veículo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id="camera-input"
            />
            <Button
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xs"
            >
              <Camera className="h-5 w-5 mr-2" />
              Abrir Câmera
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full max-w-xs"
              >
                Cancelar
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
