import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseICSFile, ParsedICSEvent } from "@/utils/icsParser";
import { useImportarICS } from "@/hooks/useImportarICS";
import { ImportarICSPreview } from "./ImportarICSPreview";

interface ImportarICSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'upload' | 'preview';

export function ImportarICSModal({ 
  open, 
  onOpenChange,
  onSuccess 
}: ImportarICSModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [events, setEvents] = useState<ParsedICSEvent[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const { importEvents, isImporting } = useImportarICS();

  const resetState = () => {
    setStep('upload');
    setEvents([]);
    setParseErrors([]);
  };

  const handleClose = () => {
    if (!isImporting) {
      resetState();
      onOpenChange(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.ics') && !file.name.endsWith('.ical')) {
      setParseErrors(['Por favor, selecione um arquivo .ics ou .ical']);
      return;
    }

    try {
      const content = await file.text();
      const result = parseICSFile(content);
      
      if (result.events.length === 0) {
        setParseErrors(['Nenhum evento encontrado no arquivo']);
        return;
      }
      
      // Ordenar por data
      result.events.sort((a, b) => 
        a.dataInstalacao.localeCompare(b.dataInstalacao)
      );
      
      setEvents(result.events);
      setParseErrors(result.errors);
      setStep('preview');
    } catch (err) {
      setParseErrors([`Erro ao ler arquivo: ${err}`]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleConfirmImport = async (
    selectedEvents: ParsedICSEvent[],
    options: {
      equipeId: string | null;
      horaDefault: string;
      skipDuplicates: boolean;
    }
  ) => {
    const result = await importEvents(selectedEvents, options);
    
    if (result.success > 0) {
      onSuccess?.();
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === 'preview' ? 'max-w-4xl h-[90vh]' : 'max-w-md'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar do Google Calendar
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de um arquivo .ics exportado do Google Calendar para importar os agendamentos como instalações.
            </p>

            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste o arquivo .ics aqui ou
              </p>
              <Button variant="secondary" asChild>
                <label className="cursor-pointer">
                  Selecionar arquivo
                  <input
                    type="file"
                    accept=".ics,.ical"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
            </div>

            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {parseErrors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Como exportar do Google Calendar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra Google Calendar no navegador</li>
                <li>Vá em Configurações → Importar e exportar</li>
                <li>Clique em "Exportar" e baixe o arquivo .ics</li>
              </ol>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <ImportarICSPreview
            events={events}
            onConfirm={handleConfirmImport}
            onCancel={() => setStep('upload')}
            isImporting={isImporting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
