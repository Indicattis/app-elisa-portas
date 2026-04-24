import { useState, useRef } from "react";
import { Upload, FileJson, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkUploadFretesCidadesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FreteRow {
  estado: string;
  cidade: string;
  valor_frete: number;
  quilometragem?: number | null;
  observacoes?: string | null;
  ativo?: boolean;
}

interface ResultLog {
  line: number;
  cidade: string;
  estado: string;
  status: "success" | "error";
  message?: string;
}

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const CSV_TEMPLATE = `estado,cidade,valor_frete,quilometragem,observacoes,ativo
SP,São Paulo,250.00,50,Centro,true
MG,Belo Horizonte,480.50,520,,true
RJ,Rio de Janeiro,520.00,430,Zona Sul,true`;

const JSON_TEMPLATE = JSON.stringify(
  [
    { estado: "SP", cidade: "São Paulo", valor_frete: 250.0, quilometragem: 50, observacoes: "Centro", ativo: true },
    { estado: "MG", cidade: "Belo Horizonte", valor_frete: 480.5, quilometragem: 520, observacoes: null, ativo: true },
  ],
  null,
  2
);

function parseCSV(text: string): FreteRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("Arquivo CSV vazio ou sem dados");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["estado", "cidade", "valor_frete"];
  for (const r of required) {
    if (!headers.includes(r)) throw new Error(`Coluna obrigatória ausente no CSV: ${r}`);
  }

  const rows: FreteRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));

    rows.push({
      estado: obj.estado?.toUpperCase() ?? "",
      cidade: obj.cidade ?? "",
      valor_frete: parseFloat(obj.valor_frete?.replace(",", ".")) || 0,
      quilometragem: obj.quilometragem ? parseFloat(obj.quilometragem.replace(",", ".")) : null,
      observacoes: obj.observacoes || null,
      ativo: obj.ativo ? obj.ativo.toLowerCase() !== "false" : true,
    });
  }
  return rows;
}

function parseJSON(text: string): FreteRow[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON deve ser um array de objetos");
  return data.map((item: any) => ({
    estado: String(item.estado ?? "").toUpperCase(),
    cidade: String(item.cidade ?? ""),
    valor_frete: Number(item.valor_frete) || 0,
    quilometragem: item.quilometragem != null ? Number(item.quilometragem) : null,
    observacoes: item.observacoes ?? null,
    ativo: item.ativo !== false,
  }));
}

function validateRow(row: FreteRow): string | null {
  if (!row.estado || row.estado.length !== 2) return "Estado inválido (use sigla com 2 letras)";
  if (!ESTADOS_BR.includes(row.estado)) return `Estado "${row.estado}" não é válido`;
  if (!row.cidade || row.cidade.trim().length === 0) return "Cidade obrigatória";
  if (!row.valor_frete || row.valor_frete <= 0) return "Valor de frete deve ser maior que 0";
  return null;
}

export function BulkUploadFretesCidades({ open, onOpenChange }: BulkUploadFretesCidadesProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ResultLog[]>([]);
  const [parsed, setParsed] = useState<FreteRow[] | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const reset = () => {
    setProcessing(false);
    setProgress(0);
    setLogs([]);
    setParsed(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onOpenChange(false);
  };

  const downloadTemplate = (type: "csv" | "json") => {
    const content = type === "csv" ? CSV_TEMPLATE : JSON_TEMPLATE;
    const mime = type === "csv" ? "text/csv" : "application/json";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template-fretes.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLogs([]);
    setParsed(null);

    try {
      const text = await file.text();
      const isJson = file.name.toLowerCase().endsWith(".json");
      const rows = isJson ? parseJSON(text) : parseCSV(text);
      if (rows.length === 0) throw new Error("Nenhum registro encontrado no arquivo");
      setParsed(rows);
      toast.success(`${rows.length} registros prontos para importar`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar arquivo");
      setParsed(null);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setProcessing(true);
    setLogs([]);
    setProgress(0);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;

    const newLogs: ResultLog[] = [];
    let success = 0;
    let errors = 0;

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      const validationError = validateRow(row);
      if (validationError) {
        newLogs.push({
          line: i + 2,
          cidade: row.cidade,
          estado: row.estado,
          status: "error",
          message: validationError,
        });
        errors++;
      } else {
        const { error } = await supabase.from("frete_cidades").insert({
          estado: row.estado,
          cidade: row.cidade,
          valor_frete: row.valor_frete,
          quilometragem: row.quilometragem ?? null,
          observacoes: row.observacoes ?? null,
          ativo: row.ativo ?? true,
          created_by: userId,
        });

        if (error) {
          const msg =
            error.code === "23505"
              ? "Já existe um frete para esta cidade/estado"
              : error.message;
          newLogs.push({
            line: i + 2,
            cidade: row.cidade,
            estado: row.estado,
            status: "error",
            message: msg,
          });
          errors++;
        } else {
          newLogs.push({
            line: i + 2,
            cidade: row.cidade,
            estado: row.estado,
            status: "success",
          });
          success++;
        }
      }

      setProgress(Math.round(((i + 1) / parsed.length) * 100));
      setLogs([...newLogs]);
    }

    queryClient.invalidateQueries({ queryKey: ["frete_cidades"] });
    setProcessing(false);

    if (success > 0) toast.success(`${success} frete(s) importado(s) com sucesso`);
    if (errors > 0) toast.error(`${errors} registro(s) com erro`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-black/90 border-white/10 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-400" />
            Importação em Massa de Fretes
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Faça upload de um arquivo CSV ou JSON com os fretes por cidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate("csv")}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <Download className="h-3 w-3 mr-1" />
              Modelo CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate("json")}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <FileJson className="h-4 w-4 mr-2" />
              <Download className="h-3 w-3 mr-1" />
              Modelo JSON
            </Button>
          </div>

          {/* File input */}
          <Card className="bg-white/5 border-white/10 border-dashed p-6">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={handleFile}
              disabled={processing}
              className="hidden"
              id="bulk-upload-input"
            />
            <label
              htmlFor="bulk-upload-input"
              className="flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="h-8 w-8 text-white/40" />
              <span className="text-sm text-white/70">
                {fileName || "Clique para selecionar um arquivo CSV ou JSON"}
              </span>
              {parsed && (
                <span className="text-xs text-blue-400">
                  {parsed.length} registro(s) prontos para importar
                </span>
              )}
            </label>
          </Card>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-white/60 text-center">{progress}% processado</p>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <ScrollArea className="h-48 rounded-md border border-white/10 bg-black/30 p-2">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs px-2 py-1 rounded hover:bg-white/5"
                  >
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                    )}
                    <span className="text-white/50 shrink-0">L{log.line}</span>
                    <span className="text-white/80 shrink-0">
                      {log.estado}/{log.cidade}
                    </span>
                    {log.message && (
                      <span className="text-red-300/80 truncate">— {log.message}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={processing}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-1" />
              Fechar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsed || processing}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white"
            >
              <Upload className="h-4 w-4 mr-1" />
              {processing ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}