import { useState, useEffect, useRef } from 'react';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Copy, Loader2, FileIcon, ImageIcon, Eye } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

const BUCKETS = [
  'autorizados-logos', 'catalogo-produtos', 'chamados-suporte-anexos',
  'comprovantes-pagamento', 'contas-pagar', 'contratos-autorizados',
  'contratos-vendas', 'documentos-publicos', 'fichas-visita-tecnica',
  'fotos-carregamento', 'lead-anexos', 'user-avatars', 'veiculos-fotos',
];

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

function isImage(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

export default function MidiasMinimalista() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bucket, setBucket] = useState(BUCKETS[0]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteFile, setDeleteFile] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      toast({ title: 'Erro ao listar arquivos', description: error.message, variant: 'destructive' });
    } else {
      setFiles((data || []).filter(f => f.name !== '.emptyFolderPlaceholder') as StorageFile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
    setPreviewUrl(null);
  }, [bucket]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { error } = await supabase.storage.from(bucket).upload(file.name, file, { upsert: true });
    if (error) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Upload concluído', description: file.name });
      fetchFiles();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async () => {
    if (!deleteFile) return;
    const { error } = await supabase.storage.from(bucket).remove([deleteFile]);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Arquivo excluído', description: deleteFile });
      fetchFiles();
    }
    setDeleteFile(null);
  };

  const copyPublicUrl = (name: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(name);
    navigator.clipboard.writeText(data.publicUrl);
    toast({ title: 'URL copiada!' });
  };

  const openPreview = (name: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(name);
    setPreviewUrl(data.publicUrl);
  };

  return (
    <MinimalistLayout
      title="Mídias"
      subtitle="Gerenciamento de arquivos no Storage"
      backPath="/marketing"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Marketing', path: '/marketing' },
        { label: 'Mídias' },
      ]}
      headerActions={
        <div className="flex items-center gap-2">
          <Select value={bucket} onValueChange={setBucket}>
            <SelectTrigger className="w-[220px] bg-white/5 border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUCKETS.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      }
    >
      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg" />
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir arquivo</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Deseja excluir <strong className="text-white">{deleteFile}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 text-white/40 text-sm">Nenhum arquivo neste bucket</div>
      ) : (
        <div className="grid gap-2">
          {files.map(file => (
            <div
              key={file.id || file.name}
              className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg">
                {isImage(file.name) ? (
                  <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" strokeWidth={1.5} />
                ) : (
                  <FileIcon className="w-5 h-5 text-white/40 shrink-0" strokeWidth={1.5} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-white/40">
                    {file.metadata?.size ? formatBytes(file.metadata.size) : '—'}
                    {' · '}
                    {file.created_at ? format(new Date(file.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isImage(file.name) && (
                    <Button variant="ghost" size="icon" onClick={() => openPreview(file.name)} className="text-white/60 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => copyPublicUrl(file.name)} className="text-white/60 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteFile(file.name)} className="text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MinimalistLayout>
  );
}
