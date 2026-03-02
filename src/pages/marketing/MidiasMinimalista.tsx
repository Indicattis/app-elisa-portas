import { useState, useEffect, useRef } from 'react';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Copy, Loader2, FileIcon, ImageIcon, Eye, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

const DEFAULT_BUCKETS = [
  'autorizados-logos', 'catalogo-produtos', 'chamados-suporte-anexos',
  'comprovantes-pagamento', 'contas-pagar', 'contratos-autorizados',
  'contratos-vendas', 'documentos-publicos', 'fichas-visita-tecnica',
  'fotos-carregamento', 'lead-anexos', 'user-avatars', 'veiculos-fotos',
];

const ALL_CATEGORIES = '__all__';
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

interface StorageFileWithBucket extends StorageFile {
  bucket: string;
}

export default function MidiasMinimalista() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [buckets, setBuckets] = useState(DEFAULT_BUCKETS);
  const [bucket, setBucket] = useState(ALL_CATEGORIES);
  const [files, setFiles] = useState<StorageFileWithBucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StorageFileWithBucket | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadBucket, setUploadBucket] = useState(DEFAULT_BUCKETS[0]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);

  // New category state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Fetch available buckets
  useEffect(() => {
    const fetchBuckets = async () => {
      const { data } = await supabase.storage.listBuckets();
      if (data && data.length > 0) {
        setBuckets(data.map(b => b.name).sort());
      }
    };
    fetchBuckets();
  }, []);

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    setCreatingCategory(true);
    const { data, error } = await supabase.functions.invoke('create-storage-bucket', { body: { name } });
    if (error || (data && data.error)) {
      toast({ title: 'Erro ao criar categoria', description: data?.error || error?.message || 'Erro desconhecido', variant: 'destructive' });
    } else {
      setBuckets(prev => [...prev, name].sort());
      setUploadBucket(name);
      setNewCategoryName('');
      setShowNewCategory(false);
      toast({ title: 'Categoria criada', description: name });
    }
    setCreatingCategory(false);
  };

  const fetchFiles = async () => {
    setLoading(true);
    if (bucket === ALL_CATEGORIES) {
      const results = await Promise.allSettled(
        buckets.map(async (b) => {
          const { data } = await supabase.storage.from(b).list('', {
            limit: 200,
            sortBy: { column: 'created_at', order: 'desc' },
          });
          return (data || [])
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map(f => ({ ...f, bucket: b })) as StorageFileWithBucket[];
        })
      );
      const all = results
        .filter((r): r is PromiseFulfilledResult<StorageFileWithBucket[]> => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setFiles(all);
    } else {
      const { data, error } = await supabase.storage.from(bucket).list('', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) {
        toast({ title: 'Erro ao listar arquivos', description: error.message, variant: 'destructive' });
        setFiles([]);
      } else {
        setFiles(
          (data || [])
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map(f => ({ ...f, bucket })) as StorageFileWithBucket[]
        );
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
    setPreviewUrl(null);
  }, [bucket, buckets]);

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadTotal(selectedFiles.length);
    setUploadProgress(0);
    let successCount = 0;
    for (const file of selectedFiles) {
      const { error } = await supabase.storage.from(uploadBucket).upload(file.name, file, { upsert: true });
      if (error) {
        toast({ title: 'Erro no upload', description: `${file.name}: ${error.message}`, variant: 'destructive' });
      } else {
        successCount++;
      }
      setUploadProgress(prev => prev + 1);
    }
    if (successCount > 0) {
      toast({ title: 'Upload concluído', description: `${successCount} arquivo(s) enviado(s)` });
    }
    setUploading(false);
    setSelectedFiles([]);
    setUploadModalOpen(false);
    setUploadProgress(0);
    setUploadTotal(0);
    fetchFiles();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.storage.from(deleteTarget.bucket).remove([deleteTarget.name]);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Arquivo excluído', description: deleteTarget.name });
      fetchFiles();
    }
    setDeleteTarget(null);
  };

  const copyPublicUrl = (file: StorageFileWithBucket) => {
    const { data } = supabase.storage.from(file.bucket).getPublicUrl(file.name);
    navigator.clipboard.writeText(data.publicUrl);
    toast({ title: 'URL copiada!' });
  };

  const openPreview = (file: StorageFileWithBucket) => {
    const { data } = supabase.storage.from(file.bucket).getPublicUrl(file.name);
    setPreviewUrl(data.publicUrl);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <SelectItem value={ALL_CATEGORIES}>Todas as categorias</SelectItem>
              {buckets.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
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
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir arquivo</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Deseja excluir <strong className="text-white">{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => { if (!uploading) { setUploadModalOpen(open); if (!open) setSelectedFiles([]); } }}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Upload de imagens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/60 mb-1 block">Categoria de destino</label>
              <div className="flex items-center gap-2">
                <Select value={uploadBucket} onValueChange={setUploadBucket} disabled={uploading}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {buckets.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={uploading}
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {showNewCategory && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="nome-da-categoria"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                    disabled={creatingCategory}
                    onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                  />
                  <Button
                    size="sm"
                    disabled={creatingCategory || !newCategoryName.trim()}
                    onClick={handleCreateCategory}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 shrink-0"
                  >
                    {creatingCategory ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Criar'}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="border-white/10 text-white/80 hover:bg-white/5 text-xs w-full"
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Selecionar imagens
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{file.name}</p>
                      <p className="text-xs text-white/40">{formatBytes(file.size)}</p>
                    </div>
                    {!uploading && (
                      <button onClick={() => removeSelectedFile(i)} className="text-white/40 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="space-y-1">
                <Progress value={(uploadProgress / uploadTotal) * 100} className="h-2" />
                <p className="text-xs text-white/40 text-center">{uploadProgress} / {uploadTotal}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              size="sm"
              disabled={uploading || selectedFiles.length === 0}
              onClick={handleUploadFiles}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              Enviar {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 text-white/40 text-sm">Nenhum arquivo neste bucket</div>
      ) : (
        <div className="grid gap-2">
          {files.map((file, idx) => (
            <div
              key={`${file.bucket}-${file.id || file.name}-${idx}`}
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
                    {bucket === ALL_CATEGORIES && (
                      <span className="text-blue-400/80 mr-1">{file.bucket}</span>
                    )}
                    {file.metadata?.size ? formatBytes(file.metadata.size) : '—'}
                    {' · '}
                    {file.created_at ? format(new Date(file.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isImage(file.name) && (
                    <Button variant="ghost" size="icon" onClick={() => openPreview(file)} className="text-white/60 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => copyPublicUrl(file)} className="text-white/60 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(file)} className="text-red-400/60 hover:text-red-400">
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
